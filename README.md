# CBE Pathway Finding and Corrector System

A web-based system designed to assist learners in selecting appropriate pathways under the Competency-Based Curriculum (CBE) based on their interests, abilities, and academic performance. This monorepo contains the NestJS backend API and Angular frontend application.

## Overview

The CBE Pathway System addresses the challenge of learners transitioning from junior school to senior school by providing:
- **Intelligent pathway recommendations** based on student performance and interests
- **Monitoring and correction** of chosen pathways
- **Structured guidance** for parents and teachers
- **Data-driven decision-making** for school administrators

## Project Structure

```
CBE-pathway/
├── CBE-backend/          # NestJS backend API
├── CBE-frontend/         # Angular frontend application
├── package.json          # Root workspace configuration
├── pnpm-workspace.yaml   # pnpm workspace definition
└── .npmrc                # pnpm configuration
```

## System Modules

### Student Module
- **Registration**: Students create accounts using admission numbers
- **Profile Setup**: Manage learner information and preferences
- **Performance Tracking**: Input and monitor subject scores
- **Pathway Selection**: View and select recommended pathways
- **Interest Assessment**: Capture learner interests and abilities

### Teacher Module
- **Student Data Review**: Access and analyze student performance
- **Guidance & Feedback**: Provide recommendations for pathway adjustments
- **Pathway Approval**: Review and approve/modify student pathway selections
- **Performance Monitoring**: Track learner progress in chosen pathways
- **Career Guidance**: Input career guidance information

### Parent Module
- **Progress Monitoring**: View child's academic performance and grades
- **Pathway Information**: Access pathway selection and recommendations
- **Performance Reports**: Download student progress reports
- **Communication**: Receive updates on pathway selections

### Admin Module
- **User Management**: Manage students, teachers, and parent accounts
- **Role Assignment**: Assign roles and permissions (Admin, Teacher, Parent, Student)
- **System Configuration**: Configure system settings and parameters
- **Monitoring**: View system activities and audit logs

### Reporting Module
- **Student Reports**: Generate individual pathway and performance reports
- **School-Level Analytics**: Generate aggregated pathway selection reports
- **Export Functionality**: Download reports in various formats
- **Performance Analytics**: Analyze trends in pathway selections

## Features

1. **Student Registration & Profile Management**
   - Students register using admission numbers
   - System automatically assigns subjects based on chosen pathway
   - Profile includes interests, abilities, and academic history

2. **Performance & Interest Input**
   - Teachers enter subject scores and performance data
   - System tracks learner abilities and interests
   - Automatic monitoring for pathway changes if needed

3. **Pathway Recommendation Engine**
   - Analyzes student performance data
   - Matches abilities and interests to appropriate pathways
   - Provides data-driven recommendations

4. **Teacher Review & Guidance**
   - Teachers review student data and recommendations
   - Provide additional career guidance
   - Approve or modify pathway selections

5. **Report Generation**
   - Automatic generation of downloadable reports
   - Student-level and school-level analytics
   - Track pathway selection trends

6. **Admin Control**
   - Manage all users and roles
   - Monitor system activities
   - Configure system parameters

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular, TypeScript, HTML, CSS, SCSS |
| **Backend** | NestJS, Node.js, TypeScript |
| **Database** | MongoDB |
| **Authentication** | JWT, Google OAuth 2.0 |
| **Package Manager** | pnpm |
| **Development** | VS Code, ESLint |

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (install via `npm install -g pnpm`)
- MongoDB (local or cloud instance)
- Gmail account (for OAuth authentication)
- VS Code (recommended IDE)

## Installation

Install all dependencies for both packages:

```bash
pnpm install
```

## Development

### Run All Services (Parallel)

```bash
pnpm dev
```

This starts both backend and frontend in development mode with hot-reload.

### Run Individual Services

```bash
# Backend only
pnpm backend:dev

# Frontend only
pnpm frontend:start
```

## Building

### Build All

```bash
pnpm build
```

### Build Individual

```bash
pnpm backend:build
pnpm frontend:build
```

## Testing

### Run All Tests

```bash
pnpm test
```

### Test Coverage

```bash
pnpm test:cov
```

### E2E Tests

```bash
pnpm test:e2e
```

### Watch Mode

```bash
pnpm test:watch
```

## Linting & Formatting

### Lint All

```bash
pnpm lint
```

### Format All

```bash
pnpm format
```

## Production

### Build & Start

```bash
pnpm build
pnpm start:prod
```

## Workspace Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all services in parallel (dev mode) |
| `pnpm build` | Build all packages |
| `pnpm test` | Test all packages |
| `pnpm lint` | Lint all packages |
| `pnpm backend:dev` | Run backend in dev mode |
| `pnpm frontend:start` | Run frontend dev server |
| `pnpm -F <package> <script>` | Run script in specific package |
| `pnpm -r <script>` | Run script in all packages |
| `pnpm -r --parallel <script>` | Run script in all packages in parallel |

## Notes

- Both services run on their configured ports (backend: 3000, frontend: 4200)
- Use `Ctrl+C` to stop all services when running `pnpm dev`
- Dependencies are centralized in each package's `package.json`
- Use `pnpm install` to add new dependencies

## Core Backend Modules

### Existing Modules (Synced with Frontend)
- **auth** - Authentication, Gmail OAuth, JWT tokens, role-based access control
- **students** - Student registration, profiles, admission numbers
- **staff** - Teacher management, career guidance input
- **classes** - Class management and organization
- **subjects** - Subject management and mapping to pathways
- **performance** - Student performance tracking and grades
- **grading** - Grading system and subject scores
- **exams** - Exam management and results
- **timetable** - Class and exam scheduling
- **leave** - Leave management for staff and students
- **audit-log** - System activity logging
- **system-settings** - System configuration and parameters

### Modules to be Implemented
- **pathways** - Pathway recommendations, selection, and management
- **reports** - Report generation (student and school-level)
- **parent-portal** - Parent access and communication features

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CBE-pathway
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   - Backend: Create `.env` in `CBE-backend` with MongoDB URI and authentication settings
   - Frontend: Configure API endpoint in environment files

4. **Start development servers**
   ```bash
   pnpm dev
   ```

5. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000/api

## API Documentation

The backend API provides endpoints for all core modules. Detailed API documentation is available at `/api-docs` when running the backend in development mode.

## Contributing

Ensure all changes maintain alignment with both backend and frontend implementations. Run tests and linting before submitting changes.

```bash
pnpm lint
pnpm test
```

## License

This project is part of the CBE Pathway Initiative.
