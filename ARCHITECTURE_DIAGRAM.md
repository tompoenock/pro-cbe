# CBE Pathway System Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CBE PATHWAY SYSTEM ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────────────────┐     ┌─────────────────────────────┐ │
│  │       CLIENT LAYER (Angular)       │     │    EXTERNAL SERVICES        │ │
│  ├────────────────────────────────────┤     ├─────────────────────────────┤ │
│  │                                    │     │                             │ │
│  │ ┌──────────────────────────────┐   │     │  ┌─────────────────────┐   │ │
│  │ │ Student Dashboard            │   │     │  │ Gmail OAuth 2.0     │   │ │
│  │ │ - My Pathway                 │   │     │  │ - Authentication    │   │ │
│  │ │ - Performance                │   │     │  │ - User verification │   │ │
│  │ │ - Recommendations            │   │     │  └─────────────────────┘   │ │
│  │ └──────────────────────────────┘   │     │                             │ │
│  │                                    │     │  ┌─────────────────────┐   │ │
│  │ ┌──────────────────────────────┐   │     │  │ PDF/Export Services │   │ │
│  │ │ Teacher Portal               │   │     │  │ - Report generation │   │ │
│  │ │ - Student Mgmt               │   │     │  └─────────────────────┘   │ │
│  │ │ - Pathway Approval           │   │     │                             │ │
│  │ │ - Performance Review         │   │     └─────────────────────────────┘ │
│  │ └──────────────────────────────┘   │                                      │
│  │                                    │     ┌─────────────────────────────┐ │
│  │ ┌──────────────────────────────┐   │     │  Analytics Engine           │ │
│  │ │ Parent Portal                │   │     │  - Pathway distribution     │ │
│  │ │ - Child Progress             │   │     │  - Performance analysis     │ │
│  │ │ - Pathway Info               │   │     │  - Trend detection          │ │
│  │ │ - Reports                    │   │     └─────────────────────────────┘ │
│  │ └──────────────────────────────┘   │                                      │
│  │                                    │                                      │
│  │ ┌──────────────────────────────┐   │                                      │
│  │ │ Admin Dashboard              │   │                                      │
│  │ │ - User Management            │   │                                      │
│  │ │ - System Settings            │   │                                      │
│  │ │ - Audit Logs                 │   │                                      │
│  │ └──────────────────────────────┘   │                                      │
│  │                                    │                                      │
│  └────────────────────────────────────┘                                      │
│                        │                                                     │
│                        │ HTTP/REST API                                       │
│                        │ (JWT Authentication)                                │
│                        ▼                                                     │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │         API LAYER (NestJS Backend - Port 3000)                        │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                         │ │
│  │  Core Modules (Implemented ✅):                                        │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │ AUTH              STUDENT          PERFORMANCE                 │  │ │
│  │  │ - JWT Tokens      - Registration   - Grade Tracking            │  │ │
│  │  │ - OAuth Login     - Profiles       - Trend Analysis            │  │ │
│  │  │ - Roles/Perms     - Interests      - POINTSS Calculation           │  │ │
│  │  │ - Session Mgmt    - Admission No   - Subject Scores            │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │ STAFF           CLASSES        SUBJECTS     EXAMS              │  │ │
│  │  │ - Teacher Data  - Class Mgmt   - Curriculum - Exam Records    │  │ │
│  │  │ - Guidance      - Assignment   - Mapping    - Results         │  │ │
│  │  │ - Credentials   - Timetable    - Links      - Timetable       │  │ │
│  │  │ - Subjects      - Students     - Subject I  - Questions       │  │ │
│  │  │ - Performance   - Groups       - Codes      - Marking         │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │ GRADING         TIMETABLE      LEAVE       AUDIT-LOG           │  │ │
│  │  │ - Score Entry   - Class Times  - Records   - Activity Logs     │  │ │
│  │  │ - Grade Calc    - Exam Times   - Approval  - User Actions      │  │ │
│  │  │ - Transcripts   - Room Assign  - Balance   - Data Changes      │  │ │
│  │  │ - Reports       - Scheduling   - Request   - Timestamps        │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  │  System Management (Implemented ✅):                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │ SYSTEM-SETTINGS             AUDIT-LOG                         │  │ │
│  │  │ - Configuration             - Event Logging                   │  │ │
│  │  │ - Parameters                - Activity Tracking                │  │ │
│  │  │ - School Info               - Compliance                       │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  │  Pathway Modules (Planned 🔄):                                        │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │ PATHWAYS (Phase 2)      REPORTS (Phase 3)  PARENT (Phase 4)    │  │ │
│  │  │ - Recommendations       - Student Reports  - Parent Access     │  │ │
│  │  │ - Selection             - School Analytics - Child Progress    │  │ │
│  │  │ - Assignment            - Export (PDF/XL)  - Notifications     │  │ │
│  │  │ - Tracking              - Trends           - Messaging         │  │ │
│  │  │ - Approval Workflow     - Analytics        - Read-only Access  │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    │ Mongoose ODM                            │
│                                    ▼                                         │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │         DATA LAYER (MongoDB)                                          │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                         │ │
│  │  Collections (Existing ✅):                                            │ │
│  │  ┌────────────────────────────────────────────────────────────────┐   │ │
│  │  │ Students      │ Staff       │ Classes    │ Subjects          │   │ │
│  │  │ Exams         │ Performance │ Grading    │ Timetable         │   │ │
│  │  │ Leave         │ Audit-Logs  │ Settings   │                   │   │ │
│  │  └────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                         │ │
│  │  Collections (New 🔄):                                                 │ │
│  │  ┌────────────────────────────────────────────────────────────────┐   │ │
│  │  │ Pathways       │ StudentPathways │ Reports     │ SchoolReports │   │ │
│  │  │ ReportTemplates│ ParentAccess    │ Analytics   │               │   │ │
│  │  └────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Interaction Diagram

```
                           ┌─────────────────────────┐
                           │      AUTH MODULE        │
                           │ (JWT + Google OAuth 2.0)│
                           └────────┬────────────────┘
                                    │ Authorizes
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
            │ STUDENT ROLE  │ │ TEACHER ROLE │ │ ADMIN ROLE   │
            └───────────────┘ └──────────────┘ └──────────────┘
                    │               │               │
        ┌───────────┴───────────┐   │   ┌───────────┴────────┐
        │                       │   │   │                    │
        ▼                       ▼   ▼   ▼                    ▼
    ┌────────────┐          ┌──────────────────┐      ┌────────────┐
    │ STUDENTS   │          │ PERFORMANCE      │      │ STAFF      │
    │ Module     │◄─────────│ Module           │─────►│ Module     │
    └────────────┘          └──────────────────┘      └────────────┘
        │                        │                          │
        │ has_interest           │ tracks                   │ provides
        │ selects                │ monitors                 │ guidance
        ▼                        ▼                          │
    ┌────────────┐          ┌──────────────────┐          │
    │ PATHWAYS   │          │ GRADING          │          │
    │ Module(🔄) │          │ Module           │          │
    └────────────┘          └──────────────────┘          │
        │ recommends           │                           │
        │ tracks               │ feeds into                │
        │ approves             │                           │
        ▼                      ▼                           │
    ┌──────────────────────────────────┐                   │
    │ REPORTS MODULE (🔄)              │                   │
    │ - Student Pathway Reports        │◄──────────────────┘
    │ - Performance Analytics          │
    │ - School-Level Reports           │
    │ - PDF/Excel Export               │
    └──────────────────────────────────┘
            │ distributes
            ├─────┬──────────┐
            │     │          │
            ▼     ▼          ▼
        ┌────┐ ┌───┐    ┌──────────┐
        │STU │ │TEA│    │ PARENT   │
        │DENT│ │CHR│    │ PORTAL   │
        └────┘ └───┘    │ Module(🔄)
                        └──────────┘

Legend:
═══════════════════════════════════════════════════════════
✅ Implemented (12 modules complete)
🔄 Planned (3 modules to implement)
◄──────────► Dependency/Integration
```

---

## Data Flow: Pathway Recommendation

```
┌─────────────────────────────────────────────────────────────────────┐
│           PATHWAY RECOMMENDATION DATA FLOW                           │
└─────────────────────────────────────────────────────────────────────┘

                    STUDENT REGISTERS
                           │
                           ▼
            ┌──────────────────────────────────┐
            │ STUDENT PROFILE CREATED          │
            │ - Admission Number               │
            │ - Basic Info                     │
            │ - Interests (optional)           │
            └──────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────────┐
            │ PERFORMANCE DATA TRACKED         │
            │ - Subject Scores                 │
            │ - POINTSS Calculation                │
            │ - Grade Distribution             │
            │ (By Teachers/Performance Mgmt)   │
            └──────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────────┐
    │ REQUEST PATHWAY RECOMMENDATION                       │
    │ (By Student/Teacher)                                │
    └──────────────────────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────────┐
    │ PATHWAYS SERVICE - RECOMMENDATION ENGINE             │
    │                                                      │
    │  1. Fetch Student Data:                            │
    │     - Profile info                                 │
    │     - Interests                                    │
    │     - Competencies                                │
    │                                                    │
    │  2. Fetch Performance:                             │
    │     - Subject Scores                              │
    │     - POINTSS                                          │
    │     - Grade Distribution                          │
    │                                                    │
    │  3. Calculate Scores:                              │
    │     ┌────────────────────────────────────────┐    │
    │     │ For Each Pathway:                      │    │
    │     │ ┌─────────────────────────────────┐   │    │
    │     │ │ Performance Score (40%)         │   │    │
    │     │ │ = Avg(subject_scores_in_path)  │   │    │
    │     │ └─────────────────────────────────┘   │    │
    │     │ ┌─────────────────────────────────┐   │    │
    │     │ │ Interest Score (30%)            │   │    │
    │     │ │ = Keyword matches / Total       │   │    │
    │     │ │   interests                      │   │    │
    │     │ └─────────────────────────────────┘   │    │
    │     │ ┌─────────────────────────────────┐   │    │
    │     │ │ Skill Score (30%)               │   │    │
    │     │ │ = Has competencies ? 1.0 : 0.6 │   │    │
    │     │ └─────────────────────────────────┘   │    │
    │     │ ┌─────────────────────────────────┐   │    │
    │     │ │ TOTAL SCORE =                   │   │    │
    │     │ │ (Perf * 0.4) +                  │   │    │
    │     │ │ (Int * 0.3) +                   │   │    │
    │     │ │ (Skill * 0.3)                   │   │    │
    │     │ └─────────────────────────────────┘   │    │
    │     └────────────────────────────────────────┘    │
    │                                                    │
    │  4. Rank Pathways by Score                       │
    │  5. Return Top Recommendation                    │
    │                                                  │
    └──────────────────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────────┐
    │ RECOMMENDATION RETURNED                              │
    │ - Recommended Pathway                               │
    │ - Confidence Score                                  │
    │ - Reasoning                                         │
    │ - Alternative Pathways                              │
    └──────────────────────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────────┐
    │ STUDENT/TEACHER REVIEWS RECOMMENDATION              │
    │ (Angular UI)                                        │
    │ - View recommendation details                       │
    │ - See confidence score                              │
    │ - Review reasoning                                  │
    │ - See alternative options                           │
    └──────────────────────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
            ┌────────────────┐ ┌──────────────────┐
            │ ACCEPT         │ │ DECLINE/REVIEW   │
            │                │ │                  │
            └────────────────┘ └──────────────────┘
                    │                     │
                    ▼                     ▼
        ┌──────────────────────────────────────────────┐
        │ PATHWAY ASSIGNMENT CREATED                   │
        │ - StudentId                                  │
        │ - PathwayId                                  │
        │ - Status: 'pending'                          │
        │ - Selected Date                              │
        └──────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────────────┐
        │ TEACHER REVIEWS & APPROVES                   │
        │ - Verify appropriateness                     │
        │ - Add comments/guidance                      │
        │ - Approve or suggest change                  │
        └──────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────────────┐
        │ STUDENT-PATHWAY ASSOCIATION FINALIZED        │
        │ - Status: 'approved' or 'active'             │
        │ - Approved By: Teacher ID                    │
        │ - Approval Date                              │
        │ - Subjects automatically assigned            │
        └──────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────────────┐
        │ MONITORING BEGINS                            │
        │ - Track performance in pathway               │
        │ - Monitor subject progress                   │
        │ - Alert if change needed                     │
        │ - Generate progress reports                  │
        └──────────────────────────────────────────────┘
```

---

## Request/Response Flow: User Types

```
╔═══════════════════════════════════════════════════════════════════╗
║              USER TYPES & SYSTEM INTERACTION                       ║
╚═══════════════════════════════════════════════════════════════════╝

1. STUDENT USER
   ════════════════════════════════════════════════════════════════
   Login Flow:
   Student → [Student Admission Number + Password]
      → AUTH Module (student@admission.no)
      → Generate JWT Token
      → Redirect to Student Dashboard
   
   Actions Available:
   • View Personal Profile
   • View Performance Data
   • View Pathway Recommendations
   • Select Pathway (after recommendation)
   • Download Progress Reports
   • View Assigned Subjects & Timetable
   • Check Exam Schedules


2. TEACHER USER
   ════════════════════════════════════════════════════════════════
   Login Flow:
   Teacher → [Gmail Account]
      → AUTH Module (Google OAuth 2.0)
      → Generate JWT Token + Teacher Role
      → Redirect to Teacher Dashboard
   
   Actions Available:
   • View Assigned Student List
   • Enter/Update Student Performance Data
   • Review Student Pathway Recommendations
   • Approve/Modify Student Pathways
   • Provide Guidance & Comments
   • View Student Performance Trends
   • Generate Student Reports
   • Access Teaching Resources
   • View Class Timetable
   • Manage Exam Data
   

3. PARENT USER
   ════════════════════════════════════════════════════════════════
   Login Flow:
   Parent → [Gmail Account + Child Admission Number]
      → AUTH Module (Google OAuth 2.0)
      → Generate JWT Token + Parent Role
      → Verify Child Relationship
      → Redirect to Parent Portal
   
   Actions Available (READ-ONLY):
   • View Child's Profile
   • View Child's Performance Data
   • View Child's Pathway Selection
   • Download Child's Progress Reports
   • View Child's Current Subjects
   • View Child's Exam Schedules
   • Receive Notifications (new)
   • Message Teachers (new)


4. ADMIN USER
   ════════════════════════════════════════════════════════════════
   Login Flow:
   Admin → [Gmail Account]
      → AUTH Module (Google OAuth 2.0)
      → Generate JWT Token + Admin Role
      → Redirect to Admin Dashboard
   
   Actions Available:
   • Manage All Users (Create/Edit/Delete)
   • Assign Roles & Permissions
   • Create/Edit Pathways
   • Create/Edit Subjects
   • Create/Edit Classes
   • Configure System Settings
   • View Audit Logs
   • Generate School-Level Reports
   • Export System Data
   • Backup & Recovery
   • User Activity Monitoring
```

---

## Technology Stack Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TECHNOLOGY STACK                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              FRONTEND LAYER                          │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │ Angular 17+                                 │    │  │
│  │  │ - TypeScript                                │    │  │
│  │  │ - RxJS (Reactive Programming)               │    │  │
│  │  │ - Angular Material (UI Components)          │    │  │
│  │  │ - Angular Forms                             │    │  │
│  │  │ - HTTP Client                               │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │ Styling:                                    │    │  │
│  │  │ - SCSS/CSS3                                 │    │  │
│  │  │ - CSS Grid & Flexbox                        │    │  │
│  │  │ - Responsive Design                         │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │ Build Tools:                                │    │  │
│  │  │ - Angular CLI                               │    │  │
│  │  │ - Webpack                                   │    │  │
│  │  │ - ESLint                                    │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ║ HTTP/REST                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API LAYER                              │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │ NestJS 10+                                  │    │  │
│  │  │ - TypeScript                                │    │  │
│  │  │ - Dependency Injection                      │    │  │
│  │  │ - Decorators                                │    │  │
│  │  │ - Guards & Interceptors                     │    │  │
│  │  │ - Validation Pipes                          │    │  │
│  │  │ - Module System                             │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │ Authentication:                             │    │  │
│  │  │ - JWT (jsonwebtoken)                        │    │  │
│  │  │ - Passport.js                               │    │  │
│  │  │ - Google OAuth 2.0                          │    │  │
│  │  │ - bcrypt (password hashing)                 │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │ Validation & Testing:                       │    │  │
│  │  │ - class-validator                           │    │  │
│  │  │ - Jest (Unit Tests)                         │    │  │
│  │  │ - Supertest (E2E Tests)                     │    │  │
│  │  │ - @nestjs/testing                           │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ║ Mongoose ODM                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              DATA LAYER                             │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │ MongoDB                                     │    │  │
│  │  │ - Document Database                        │    │  │
│  │  │ - NoSQL                                     │    │  │
│  │  │ - Flexible Schema                          │    │  │
│  │  │ - BSON Format                               │    │  │
│  │  │ - Aggregation Pipeline                      │    │  │
│  │  │ - Indexing                                  │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │ ODM Layer:                                  │    │  │
│  │  │ - Mongoose                                  │    │  │
│  │  │ - Schema Definition                         │    │  │
│  │  │ - Model Management                          │    │  │
│  │  │ - Query Builder                             │    │  │
│  │  │ - Middleware Hooks                          │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           DEVELOPMENT & DEPLOYMENT                  │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │ Package Manager: pnpm                       │    │  │
│  │  │ - Monorepo support                          │    │  │
│  │  │ - Lock file (pnpm-lock.yaml)                │    │  │
│  │  │ - Workspace management                      │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │ Development Tools:                          │    │  │
│  │  │ - VS Code                                   │    │  │
│  │  │ - Chrome DevTools                           │    │  │
│  │  │ - MongoDB Compass                           │    │  │
│  │  │ - Postman / Thunder Client                  │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │ Code Quality:                               │    │  │
│  │  │ - ESLint                                    │    │  │
│  │  │ - Prettier                                  │    │  │
│  │  │ - Type Safety (TypeScript)                  │    │  │
│  │  │ - Test Coverage                             │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │ Deployment:                                 │    │  │
│  │  │ - Vercel (Frontend)                         │    │  │
│  │  │ - Cloud Platform (Backend)                  │    │  │
│  │  │ - Docker (Containerization)                 │    │  │
│  │  │ - Environment Management                    │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                            │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Layer 1: AUTHENTICATION
│  ═══════════════════════════════════════════════════════════
│  ┌────────────────────────────────────────────────────────┐
│  │ • Google OAuth 2.0 for Teachers/Admins/Parents        │
│  │ • Admission Number + Password for Students            │
│  │ • JWT Token Generation & Validation                   │
│  │ • Token Expiration & Refresh Mechanism                │
│  │ • Secure Password Hashing (bcrypt)                    │
│  │ • Session Management                                  │
│  └────────────────────────────────────────────────────────┘
│
│  Layer 2: AUTHORIZATION
│  ═══════════════════════════════════════════════════════════
│  ┌────────────────────────────────────────────────────────┐
│  │ RBAC (Role-Based Access Control):                     │
│  │ ├─ ADMIN: Full system access                          │
│  │ ├─ TEACHER: Class & student data access               │
│  │ ├─ STUDENT: Personal & academic data access           │
│  │ └─ PARENT: Child-specific data access (read-only)    │
│  │                                                         │
│  │ Permissions Matrix:                                    │
│  │ ├─ view:students, manage:students                     │
│  │ ├─ view:performance, manage:performance               │
│  │ ├─ view:pathways, manage:pathways                     │
│  │ ├─ view:reports, generate:reports                     │
│  │ ├─ view:ownchild, view:progress                       │
│  │ └─ more...                                             │
│  └────────────────────────────────────────────────────────┘
│
│  Layer 3: DATA PROTECTION
│  ═══════════════════════════════════════════════════════════
│  ┌────────────────────────────────────────────────────────┐
│  │ • Field-level encryption for sensitive data            │
│  │ • HTTPS/TLS for data in transit                        │
│  │ • Input validation & sanitization                      │
│  │ • SQL injection prevention (Mongoose)                  │
│  │ • XSS prevention (Angular built-in)                    │
│  │ • CSRF tokens for state-changing operations            │
│  │ • Rate limiting on API endpoints                       │
│  └────────────────────────────────────────────────────────┘
│
│  Layer 4: AUDIT & MONITORING
│  ═══════════════════════════════════════════════════════════
│  ┌────────────────────────────────────────────────────────┐
│  │ AUDIT-LOG Module:                                      │
│  │ ├─ User actions logged                                 │
│  │ ├─ Data modifications tracked                          │
│  │ ├─ Timestamp & user ID recorded                        │
│  │ ├─ Sensitive operations flagged                        │
│  │ └─ Compliance reporting available                      │
│  └────────────────────────────────────────────────────────┘
│
│  Layer 5: API SECURITY
│  ═══════════════════════════════════════════════════════════
│  ┌────────────────────────────────────────────────────────┐
│  │ • CORS Policy (origin validation)                      │
│  │ • API Key validation                                   │
│  │ • Request validation pipes                             │
│  │ • Response sanitization                                │
│  │ • Error message obfuscation                            │
│  │ • Helmet.js middleware (HTTP headers)                  │
│  └────────────────────────────────────────────────────────┘
│
└──────────────────────────────────────────────────────────────┘
```

---

**Last Updated**: May 27, 2026
**System Status**: 60% Complete | 40% To Implement
**Architecture Version**: 1.0
