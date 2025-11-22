import { invokeLLM } from "./_core/llm";
import type { Assignment, RebalancingSuggestion } from "./rebalancer";

export interface Recommendation {
  title: string;
  description: string;
  suggestions: RebalancingSuggestion[];
  priority: "critical" | "high" | "medium" | "low";
  estimatedImpact: string;
}

/**
 * Generate intelligent recommendations using LLM
 */
export async function generateRecommendations(
  assignments: Assignment[],
  suggestions: RebalancingSuggestion[]
): Promise<Recommendation[]> {
  if (suggestions.length === 0) {
    return [];
  }

  // Prepare context for LLM
  const assignmentSummary = assignments
    .map(
      a =>
        `${a.nurseName} (${a.unit}): ${a.workload}/${a.maxWorkload} workload, ${a.patients.length}/${a.maxPatients} patients, qualifications: ${a.qualifications.join(", ")}`
    )
    .join("\n");

  const suggestionSummary = suggestions
    .map(
      s =>
        `Move ${s.patientName} (acuity ${s.patientId}) from ${s.fromNurseName} to ${s.toNurseName}. Skill match: ${s.skillMatch ? "Yes" : "No"}`
    )
    .join("\n");

  // Calculate current workload statistics
  const overloadedNurses = assignments.filter(a => a.isOverloaded);
  const idleNurses = assignments.filter(a => a.patients.length === 0);
  const utilizationRates = assignments.map(a => (a.maxWorkload > 0 ? (a.workload / a.maxWorkload) * 100 : 0));
  const avgUtilization = utilizationRates.reduce((sum, rate) => sum + rate, 0) / utilizationRates.length;
  
  const prompt = `You are a hospital staffing optimization expert. The current staffing situation shows INADEQUATE balance and requires immediate rebalancing.

CURRENT SITUATION:
- ${overloadedNurses.length} nurses are OVERLOADED (>100% capacity)
- ${idleNurses.length} nurses are IDLE (0 patients)
- Average utilization: ${avgUtilization.toFixed(1)}%

OVERLOADED NURSES:
${overloadedNurses.map(a => `${a.nurseName} (${a.unit}): ${a.patients.length} patients, ${a.workload}/${a.maxWorkload} workload (${((a.workload/a.maxWorkload)*100).toFixed(0)}% capacity)`).join("\n")}

IDLE/UNDERUTILIZED NURSES:
${assignments.filter(a => a.workload < a.maxWorkload * 0.7).map(a => `${a.nurseName} (${a.unit}): ${a.patients.length} patients, ${a.workload}/${a.maxWorkload} workload (${((a.workload/a.maxWorkload)*100).toFixed(0)}% capacity) - Qualifications: ${a.qualifications.join(", ")}`).join("\n")}

AVAILABLE PATIENT TRANSFERS:
${suggestionSummary}

Your task:
1. Identify the MOST CRITICAL staffing imbalance (which nurse is most overloaded?)
2. Recommend specific patient transfers that will:
   - Reduce overloaded nurses to manageable ratios (target 70-90% capacity)
   - Utilize idle nurses effectively
   - Prioritize skill-matched transfers
3. Explain the immediate impact on patient safety and nurse workload

Provide a clear, actionable recommendation that hospital administrators can implement immediately.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a hospital staffing optimization expert. Provide concise, actionable recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "staffing_recommendation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Brief title of the recommendation"
              },
              description: {
                type: "string",
                description: "Detailed description of the recommendation"
              },
              priority: {
                type: "string",
                enum: ["critical", "high", "medium", "low"],
                description: "Priority level of the recommendation"
              },
              estimatedImpact: {
                type: "string",
                description: "Expected outcome of applying the recommendation"
              }
            },
            required: ["title", "description", "priority", "estimatedImpact"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from LLM");
    }

    const parsed = JSON.parse(content);

    return [
      {
        title: parsed.title,
        description: parsed.description,
        suggestions: suggestions.slice(0, 3), // Top 3 suggestions
        priority: parsed.priority,
        estimatedImpact: parsed.estimatedImpact
      }
    ];
  } catch (error) {
    console.error("Error generating recommendations:", error);
    // Fallback to rule-based recommendations if LLM fails
    return generateFallbackRecommendations(assignments, suggestions);
  }
}

/**
 * Fallback recommendations when LLM is unavailable
 */
function generateFallbackRecommendations(
  assignments: Assignment[],
  suggestions: RebalancingSuggestion[]
): Recommendation[] {
  const overloadedCount = assignments.filter(a => a.isOverloaded).length;
  const totalWorkload = assignments.reduce((sum, a) => sum + a.workload, 0);
  const avgWorkload = totalWorkload / assignments.length;

  if (overloadedCount === 0) {
    return [];
  }

  let priority: "critical" | "high" | "medium" | "low" = "medium";
  if (overloadedCount >= 3) {
    priority = "critical";
  } else if (overloadedCount === 2) {
    priority = "high";
  }

  const skillMatchedSuggestions = suggestions.filter(s => s.skillMatch);
  const topSuggestions = [
    ...skillMatchedSuggestions.slice(0, 2),
    ...suggestions.slice(skillMatchedSuggestions.length, 3)
  ].slice(0, 3);

  // Find the most overloaded nurse
  const mostOverloaded = assignments.reduce((max, a) => 
    (a.workload / a.maxWorkload) > (max.workload / max.maxWorkload) ? a : max
  );
  
  const mostOverloadedUtilization = ((mostOverloaded.workload / mostOverloaded.maxWorkload) * 100).toFixed(0);
  
  return [
    {
      title: `URGENT: Rebalance ${overloadedCount} Overloaded Nurse${overloadedCount > 1 ? "s" : ""}`,
      description: `Critical staffing imbalance detected. ${mostOverloaded.nurseName} is at ${mostOverloadedUtilization}% capacity with ${mostOverloaded.patients.length} patients (max: ${mostOverloaded.maxPatients}). ${overloadedCount > 1 ? `${overloadedCount - 1} other nurse${overloadedCount > 2 ? "s are" : " is"} also overloaded.` : ""} Immediate patient reassignment needed to prevent burnout and ensure patient safety. The suggested transfers will redistribute workload to available nurses with matching qualifications.`,
      suggestions: topSuggestions,
      priority,
      estimatedImpact: `Reduces ${mostOverloaded.nurseName}'s workload from ${mostOverloadedUtilization}% to ~${Math.max(70, parseInt(mostOverloadedUtilization) - 30)}% capacity. Brings all nurses within safe patient-to-staff ratios (target: 70-90% utilization).`
    }
  ];
}

/**
 * Format recommendations for display
 */
export function formatRecommendations(
  recommendations: Recommendation[]
): string {
  if (recommendations.length === 0) {
    return "All staff are well-balanced. No rebalancing needed.";
  }

  return recommendations
    .map(
      rec => `
**${rec.title}** [${rec.priority.toUpperCase()}]
${rec.description}

Expected Impact: ${rec.estimatedImpact}

Suggested Actions:
${rec.suggestions.map(s => `- Move ${s.patientName} from ${s.fromNurseName} to ${s.toNurseName}`).join("\n")}
`
    )
    .join("\n---\n");
}
