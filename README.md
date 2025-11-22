# Staffflow - Hospital Staffing Analytics Platform

**Staffflow** is an intelligent hospital staffing analytics platform that demonstrates real-time workload rebalancing through simulation. The system visualizes how patient assignments can be optimized across nursing staff to maintain safe nurse-to-patient ratios and prevent burnout.

![Staffflow Logo](client/public/staffflow-logo.png)

## Overview

Healthcare facilities face constant challenges in balancing patient care demands with staff capacity. Staffflow addresses this by providing a visual simulation that demonstrates how intelligent workload distribution algorithms can progressively rebalance patient assignments, moving from severely imbalanced states to optimal distribution.

The platform uses a **patient-to-nurse ratio system** that aligns with real-world hospital staffing standards:

| Balance Status | Ratio | Description |
|---------------|-------|-------------|
| **IDEAL** | 1:1-2 | Each nurse has 1-2 patients, optimal for quality care |
| **SUFFICIENT** | 1:3-4 | Each nurse has 3-4 patients, manageable workload |
| **INADEQUATE** | 1:5+ | Nurses have 5+ patients, risk of burnout and safety issues |

## Key Features

### Real-Time Simulation

The simulation engine creates a deliberately imbalanced starting state where only 1-2 nurses per unit are assigned all patients, leaving others idle. Over 10-20 simulation ticks, the rebalancing algorithm progressively redistributes patients to achieve balanced workload across all staff.

**Convergence Example:**
- **Initial State**: INADEQUATE (max 7 patients per nurse, std dev 2.19)
- **After 10 Ticks**: IDEAL (max 2 patients per nurse, std dev 0.49)

### Workload Visualization

The interactive workload chart tracks each nurse's patient count over time, showing clear convergence as the lines cluster together. Key metrics displayed include:

- **Standard Deviation**: Measures workload distribution (lower = better balance)
- **Average Patients**: Mean patient count across all nurses
- **Max Patients**: Highest patient count for any single nurse
- **Ticks Tracked**: Number of simulation steps recorded

### AI-Powered Recommendations

When the system detects INADEQUATE balance status, it generates specific rebalancing recommendations using LLM analysis. Each recommendation includes:

- Overloaded nurse identification with exact capacity percentages
- Specific patient-to-staff transfer suggestions
- Skill-match verification for safe transfers
- Expected impact on workload distribution
- Priority level (critical, high, medium, low)

### Unit-Based Management

The platform supports four hospital units with specialized staff qualifications:

- **ICU** (Intensive Care Unit): Critical care patients
- **ER** (Emergency Room): Acute emergency cases
- **MEDSURG** (Medical-Surgical): General medical and surgical patients
- **PEDS** (Pediatrics): Child and adolescent care

Nurses can be qualified for multiple units, and the system respects these qualifications when making transfer recommendations.

## Technical Architecture

### Frontend Stack

- **React 19**: Modern UI framework with concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling with custom theme
- **tRPC**: End-to-end typesafe API layer
- **Recharts**: Interactive data visualization
- **Wouter**: Lightweight routing
- **shadcn/ui**: Accessible component library

### Backend Stack

- **Node.js 22**: JavaScript runtime
- **Express 4**: Web application framework
- **tRPC 11**: Type-safe RPC framework
- **Drizzle ORM**: Type-safe database toolkit
- **MySQL/TiDB**: Relational database
- **Manus LLM Integration**: AI-powered recommendations

### Simulation Engine

The core simulation engine (`server/simulationEngine.ts`) implements a progressive convergence algorithm:

1. **Initialization**: Creates imbalanced assignments (1-2 nurses per unit get all patients)
2. **Tick Advancement**: Each tick analyzes workload distribution and identifies imbalances
3. **Rebalancing**: Transfers patients from overloaded to underutilized nurses
4. **Convergence**: Continues until standard deviation drops below threshold
5. **History Tracking**: Records workload snapshots for visualization

### Balance Metric Calculation

The system calculates balance status using patient counts rather than abstract utilization percentages:

```typescript
// Calculate patient count for each nurse
const patientCounts = assignments.map(a => a.patients.length);

// Calculate standard deviation
const mean = patientCounts.reduce((sum, count) => sum + count, 0) / patientCounts.length;
const variance = patientCounts.map(count => Math.pow(count - mean, 2))
  .reduce((sum, d) => sum + d, 0) / patientCounts.length;
const stdDev = Math.sqrt(variance);

// Determine status based on max count and distribution
const maxCount = Math.max(...patientCounts);
if (maxCount <= 2 && stdDev <= 1) return 'IDEAL';
if (maxCount <= 4 && stdDev <= 1.5) return 'SUFFICIENT';
return 'INADEQUATE';
```

## Installation & Setup

### Prerequisites

- Node.js 22.x or higher
- pnpm package manager
- MySQL or TiDB database (optional for local development)

### Environment Variables

The platform requires several environment variables for full functionality:

```bash
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Authentication
JWT_SECRET=your-jwt-secret
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im

# Application
VITE_APP_ID=your-app-id
VITE_APP_TITLE=Staffflow - Hospital Staffing Analytics
VITE_APP_LOGO=/staffflow-logo.png

# LLM Integration
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key

# Owner Info
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name
```

### Local Development

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

The development server runs at `http://localhost:3000` with hot module replacement enabled.

## Usage Guide

### Starting a Simulation

1. Click **"Initialize Simulation"** to create a new imbalanced starting state
2. The system assigns all patients to 1-2 nurses per unit, creating clear overload
3. View the initial INADEQUATE balance status and high standard deviation

### Running the Simulation

**Auto-Run Mode:**
- Click **"Start Auto-Run"** to automatically advance the simulation every second
- Watch the workload chart lines converge as patients are redistributed
- Click **"Stop Auto-Run"** to pause at any time

**Manual Mode:**
- Click **"Run Single Tick"** to advance one step at a time
- Observe how each tick improves balance metrics
- Useful for detailed analysis of the rebalancing algorithm

### Viewing Recommendations

When balance status is INADEQUATE:

1. Scroll to the **AI Recommendations** panel at the bottom
2. Review specific transfer suggestions with priority levels
3. Each recommendation shows:
   - Overloaded nurse name and capacity percentage
   - Specific patient to transfer
   - Target nurse with available capacity
   - Expected impact on workload distribution

### Analyzing Results

The workload chart provides several insights:

- **Convergence Pattern**: Lines should cluster together over time
- **Standard Deviation**: Should decrease from ~2.0 to <0.5
- **Balance Status**: Should progress INADEQUATE → SUFFICIENT → IDEAL
- **Ticks to Convergence**: Typically 10-20 ticks for full rebalancing

## Project Structure

```
staffflow/
├── client/                    # Frontend application
│   ├── public/               # Static assets
│   │   └── staffflow-logo.png
│   └── src/
│       ├── components/       # React components
│       │   ├── SimulationControls.tsx
│       │   ├── WorkloadChart.tsx
│       │   ├── RecommendationsPanel.tsx
│       │   └── ...
│       ├── pages/           # Page components
│       │   └── Home.tsx
│       ├── lib/             # Utilities
│       │   └── trpc.ts
│       ├── const.ts         # Constants
│       └── index.css        # Global styles
├── server/                   # Backend application
│   ├── _core/               # Framework code
│   ├── simulationEngine.ts  # Core simulation logic
│   ├── recommendationEngine.ts  # AI recommendations
│   ├── rebalancer.ts        # Workload rebalancing
│   ├── sampleData.ts        # Static staff data
│   ├── routers.ts           # tRPC endpoints
│   └── db.ts                # Database queries
├── drizzle/                 # Database schema
│   └── schema.ts
├── shared/                  # Shared types
└── tests/                   # Test files
    ├── simulation.test.ts
    ├── staffflow.test.ts
    └── auth.logout.test.ts
```

## API Endpoints

All endpoints are exposed via tRPC at `/api/trpc/*`:

### Simulation Management

- `staffflow.initSimulation`: Initialize new simulation with specified patient count
- `staffflow.runTick`: Advance simulation by one tick
- `staffflow.getSimulationState`: Get current simulation state
- `staffflow.resetSimulation`: Reset to initial state

### Data Queries

- `staffflow.getAssignments`: Get current nurse assignments (optionally filtered by unit)
- `staffflow.getBalanceMetric`: Get current balance status and metrics
- `staffflow.getSimulationStats`: Get aggregate statistics
- `staffflow.getWorkloadChartData`: Get historical workload data for visualization

### Recommendations

- `staffflow.getRebalancingSuggestions`: Get algorithmic rebalancing suggestions
- `staffflow.getRecommendations`: Get AI-powered recommendations with LLM analysis
- `staffflow.applySuggestion`: Apply a specific transfer suggestion

## Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test simulation.test.ts

# Run tests in watch mode
pnpm test --watch
```

**Test Coverage:**
- **25 tests total** across 3 test suites
- Simulation engine tests (16 tests)
- API endpoint tests (8 tests)
- Authentication tests (1 test)

Key test scenarios:
- Imbalanced initialization creates proper starting state
- Tick advancement reduces standard deviation
- Convergence achieves IDEAL status within 20 ticks
- Balance metric calculation uses correct thresholds
- Recommendations generate for INADEQUATE states

## Performance Considerations

### Data Stability

The system uses **persistent simulation state** rather than regenerating data on each query. This ensures:

- Nurse assignments remain stable between ticks
- Workload chart shows actual convergence (not random fluctuations)
- Recommendations are based on real simulation state
- UI updates only when simulation advances

### Query Optimization

Frontend queries use `refetchOnWindowFocus: false` to prevent unnecessary data regeneration. Data refreshes only when:

- User clicks "Initialize Simulation"
- User clicks "Run Single Tick"
- Auto-run advances the simulation
- User manually triggers refresh

## Future Enhancements

Potential improvements for production deployment:

1. **Database Persistence**: Store simulation history in database for multi-session analysis
2. **Real-Time Collaboration**: WebSocket support for multiple users viewing same simulation
3. **Historical Playback**: Replay past simulations with adjustable speed
4. **Export Functionality**: Generate PDF reports of simulation results
5. **Custom Scenarios**: Allow users to define custom starting conditions
6. **Multi-Hospital Support**: Manage multiple facilities with different staffing models
7. **Shift Scheduling**: Integrate with shift planning and time-off management
8. **Predictive Analytics**: Forecast staffing needs based on historical patterns

## License

This project is proprietary software developed for hospital staffing optimization demonstrations.

## Support

For questions, issues, or feature requests, please contact the development team or submit feedback at [https://help.manus.im](https://help.manus.im).

---

**Built with Manus AI** - Intelligent automation for modern healthcare.
