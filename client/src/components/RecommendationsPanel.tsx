import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Lightbulb, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface Recommendation {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  estimatedImpact: string;
  suggestions: Array<{
    fromNurseId: string;
    fromNurseName: string;
    toNurseId: string;
    toNurseName: string;
    patientId: string;
    patientName: string;
    reason: string;
    skillMatch: boolean;
  }>;
}

interface RecommendationsPanelProps {
  unit?: string;
}

export default function RecommendationsPanel({ unit }: RecommendationsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);

  const { data: recommendationsData, isLoading, refetch } = trpc.staffflow.getRecommendations.useQuery(
    { unit },
    { refetchOnWindowFocus: false }
  );

  const applySuggestionMutation = trpc.staffflow.applySuggestion.useMutation();

  const recommendations = recommendationsData?.recommendations || [];
  const formattedText = recommendationsData?.formattedRecommendations || "";

  const handleApplySuggestion = async (suggestion: any) => {
    try {
      await applySuggestionMutation.mutateAsync({
        fromNurseId: suggestion.fromNurseId,
        toNurseId: suggestion.toNurseId,
        patientId: suggestion.patientId,
        unit
      });
      setAppliedSuggestions([...appliedSuggestions, suggestion.patientId]);
      // Refetch recommendations after applying
      await refetch();
    } catch (error) {
      console.error("Error applying suggestion:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 border-red-300 text-red-900";
      case "high":
        return "bg-orange-100 border-orange-300 text-orange-900";
      case "medium":
        return "bg-yellow-100 border-yellow-300 text-yellow-900";
      default:
        return "bg-blue-100 border-blue-300 text-blue-900";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <AlertCircle className="w-5 h-5" />;
      case "high":
        return <AlertCircle className="w-5 h-5" />;
      case "medium":
        return <Clock className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  if (recommendations.length === 0 && !isLoading) {
    return (
      <div className="recommendations-panel optimal">
        <div className="recommendations-header">
          <div className="recommendations-title">
            <CheckCircle className="w-5 h-5" />
            <span>Staffing Optimized</span>
          </div>
        </div>
        <p className="recommendations-message">All staff are well-balanced. No rebalancing needed.</p>
      </div>
    );
  }

  return (
    <div className="recommendations-panel">
      <button
        className="recommendations-header"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={isLoading}
      >
        <div className="recommendations-title">
          <Lightbulb className="w-5 h-5" />
          <span>AI Recommendations ({recommendations.length})</span>
        </div>
        <span className="toggle-icon">{isExpanded ? "▼" : "▶"}</span>
      </button>

      {isExpanded && (
        <div className="recommendations-content">
          {isLoading ? (
            <div className="loading-state">Loading recommendations...</div>
          ) : recommendations.length === 0 ? (
            <div className="no-recommendations">No recommendations at this time.</div>
          ) : (
            <div className="recommendations-list">
              {recommendations.map((rec: Recommendation, idx: number) => (
                <div key={idx} className={`recommendation-card ${getPriorityColor(rec.priority)}`}>
                  <div className="recommendation-header">
                    <div className="recommendation-title-section">
                      {getPriorityIcon(rec.priority)}
                      <h4>{rec.title}</h4>
                      <span className="priority-badge">{rec.priority.toUpperCase()}</span>
                    </div>
                  </div>

                  <p className="recommendation-description">{rec.description}</p>

                  <div className="recommendation-impact">
                    <strong>Expected Impact:</strong> {rec.estimatedImpact}
                  </div>

                  {rec.suggestions.length > 0 && (
                    <div className="suggestions-list">
                      <strong>Suggested Actions:</strong>
                      {rec.suggestions.map((suggestion: any, sIdx: number) => (
                        <div
                          key={sIdx}
                          className={`suggestion-item ${
                            appliedSuggestions.includes(suggestion.patientId) ? "applied" : ""
                          }`}
                        >
                          <div className="suggestion-text">
                            <span className="patient-name">{suggestion.patientName}</span>
                            <span className="transfer-arrow">→</span>
                            <span className="from-nurse">{suggestion.fromNurseName}</span>
                            <span className="to-nurse">{suggestion.toNurseName}</span>
                            {suggestion.skillMatch && (
                              <span className="skill-match-badge">✓ Skill Match</span>
                            )}
                          </div>
                          {!appliedSuggestions.includes(suggestion.patientId) && (
                            <button
                              className="apply-button"
                              onClick={() => handleApplySuggestion(suggestion)}
                              disabled={applySuggestionMutation.isPending}
                            >
                              {applySuggestionMutation.isPending ? "Applying..." : "Apply"}
                            </button>
                          )}
                          {appliedSuggestions.includes(suggestion.patientId) && (
                            <span className="applied-badge">✓ Applied</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            className="refresh-recommendations-button"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh Recommendations"}
          </button>
        </div>
      )}
    </div>
  );
}
