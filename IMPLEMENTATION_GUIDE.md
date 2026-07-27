# Implementation Guide - CBE Pathway System

## Overview
This guide outlines the step-by-step implementation requirements to fully realize the CBE Pathway proposal objectives. The system is 60% complete with core modules in place. This document covers the remaining 40% implementation.

## Part 1: Pathway Module Implementation

### 1.1 Backend Pathway Module Structure

#### Create the pathways module directory structure:
```
CBE-backend/src/pathways/
├── pathways.controller.ts
├── pathways.service.ts
├── pathways.module.ts
├── dto/
│   ├── create-pathway.dto.ts
│   ├── update-pathway.dto.ts
│   └── pathway-query.dto.ts
├── entities/
│   └── pathway.entity.ts
└── schemas/
    └── pathway.schema.ts
```

#### Key Components to Implement:

**1. Pathway Schema (MongoDB)**
```typescript
// pathway.schema.ts
interface Pathway {
  _id: ObjectId;
  name: string;              // e.g., 'STEM', 'Arts', 'Social Sciences', 'Sports Science'
  code: string;              // Unique pathway code
  description: string;
  requiredSubjects: ObjectId[];    // Reference to Subject entities
  careerPaths: string[];           // Career options in this pathway
  requiredCompetencies: string[];  // Required student competencies
  minimumPOINTSS: number;              // Minimum POINTSS threshold
  interestProfile: {
    keywords: string[];
    skillsRequired: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**2. Student-Pathway Schema**
```typescript
interface StudentPathway {
  _id: ObjectId;
  studentId: ObjectId;
  pathway: ObjectId;
  selectedDate: Date;
  recommendedDate: Date;
  status: 'pending' | 'approved' | 'active' | 'changed';
  approvedBy: ObjectId;      // Teacher/Admin who approved
  approvalDate: Date;
  notes: string;
  changeReason: string;      // If pathway was changed
  createdAt: Date;
  updatedAt: Date;
}
```

**3. Service Methods Required**
```typescript
// pathways.service.ts

// Pathway Management
async createPathway(data: CreatePathwayDto): Promise<Pathway>;
async updatePathway(id: string, data: UpdatePathwayDto): Promise<Pathway>;
async getPathwayById(id: string): Promise<Pathway>;
async getAllPathways(): Promise<Pathway[]>;
async deletePathway(id: string): Promise<void>;

// Student Pathway
async assignPathwayToStudent(studentId: string, pathwayId: string): Promise<StudentPathway>;
async recommendPathway(studentId: string): Promise<Pathway>;
async getStudentPathway(studentId: string): Promise<StudentPathway>;
async approveStudentPathway(studentPathwayId: string, teacherId: string): Promise<StudentPathway>;
async changeStudentPathway(studentId: string, newPathwayId: string, reason: string): Promise<StudentPathway>;

// Analytics
async getPathwayDistribution(): Promise<object>;
async getStudentsByPathway(pathwayId: string): Promise<Student[]>;
```

**4. Controller Endpoints**
```typescript
// pathways.controller.ts

// Pathway Management (Admin/Teacher)
@Post('/')
async create(@Body() createPathwayDto: CreatePathwayDto) { }

@Get('/')
async findAll(@Query() query: PathwayQueryDto) { }

@Get('/:id')
async findOne(@Param('id') id: string) { }

@Patch('/:id')
async update(@Param('id') id: string, @Body() updatePathwayDto: UpdatePathwayDto) { }

@Delete('/:id')
async remove(@Param('id') id: string) { }

// Student Pathway Assignment
@Post('/:pathwayId/assign/:studentId')
async assignPathway(@Param('pathwayId') pathwayId: string, @Param('studentId') studentId: string) { }

@Get('/student/:studentId')
async getStudentPathway(@Param('studentId') studentId: string) { }

// Pathway Recommendation
@Post('/recommend/:studentId')
async recommendPathway(@Param('studentId') studentId: string) { }

// Pathway Approval
@Post('/:studentPathwayId/approve')
async approvePathway(@Param('studentPathwayId') id: string, @Body() data: any) { }

// Pathway Change
@Patch('/student/:studentId/change')
async changePathway(@Param('studentId') studentId: string, @Body() data: any) { }

// Analytics
@Get('/analytics/distribution')
async getDistribution() { }
```

### 1.2 Pathway Recommendation Algorithm

#### Location: `CBE-backend/src/pathways/recommendation.service.ts`

```typescript
async recommendPathway(studentId: string): Promise<{
  pathway: Pathway;
  confidenceScore: number;
  reasoning: string;
}> {
  // Step 1: Get student data
  const student = await this.studentsService.findById(studentId);
  const performance = await this.performanceService.getStudentPerformance(studentId);
  const interests = student.interests || [];

  // Step 2: Calculate subject performance
  const subjectScores = this.calculateSubjectPerformance(performance);

  // Step 3: Match with pathways
  const recommendations = await this.getAllPathways().then(pathways =>
    pathways.map(pathway => ({
      pathway,
      score: this.calculateMatchScore(
        student,
        subjectScores,
        interests,
        pathway
      )
    }))
  );

  // Step 4: Sort and return top recommendation
  return recommendations
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 1)
    .map(r => ({
      pathway: r.pathway,
      confidenceScore: r.score.total,
      reasoning: this.generateRecommendationReasoning(r.score)
    }))[0];
}

private calculateMatchScore(
  student: Student,
  subjectScores: Record<string, number>,
  interests: string[],
  pathway: Pathway
): {
  performanceScore: number;
  interestScore: number;
  skillScore: number;
  total: number;
} {
  // Performance Score (40%)
  const performanceScore = this.scorePerformance(subjectScores, pathway) * 0.4;

  // Interest Score (30%)
  const interestScore = this.scoreInterests(interests, pathway) * 0.3;

  // Skill Assessment Score (30%)
  const skillScore = this.scoreSkills(student, pathway) * 0.3;

  return {
    performanceScore,
    interestScore,
    skillScore,
    total: performanceScore + interestScore + skillScore
  };
}

private scorePerformance(
  subjectScores: Record<string, number>,
  pathway: Pathway
): number {
  // Calculate average score in pathway-related subjects
  let totalScore = 0;
  let count = 0;

  for (const subjectId of pathway.requiredSubjects) {
    if (subjectScores[subjectId]) {
      totalScore += subjectScores[subjectId];
      count++;
    }
  }

  return count > 0 ? (totalScore / count) / 100 : 0;
}

private scoreInterests(interests: string[], pathway: Pathway): number {
  const keywordMatches = interests.filter(interest =>
    pathway.interestProfile.keywords.some(keyword =>
      interest.toLowerCase().includes(keyword.toLowerCase())
    )
  ).length;

  return Math.min(keywordMatches / interests.length, 1);
}

private scoreSkills(student: Student, pathway: Pathway): number {
  // Assess if student has required competencies
  const hasSkills = pathway.requiredCompetencies.every(skill =>
    student.competencies?.includes(skill) || false
  );

  return hasSkills ? 1 : 0.6;
}
```

### 1.3 Frontend Pathway Components

#### Create Angular components:
```
CBE-frontend/src/app/pages/pathways/
├── pathways.component.ts
├── pathways.component.html
├── pathway-detail.component.ts
├── pathway-detail.component.html
├── pathway-recommendation.component.ts
├── pathway-recommendation.component.html
├── pathway-selection.component.ts
├── pathway-selection.component.html
└── services/
    └── pathways.service.ts
```

**Key Components:**

1. **Pathways List Component** - Display all available pathways
2. **Pathway Detail Component** - Show pathway details, career options, required subjects
3. **Pathway Recommendation Component** - Display AI-recommended pathway
4. **Pathway Selection Component** - Allow student to select/confirm pathway
5. **Pathway Management Component** (Admin) - Create/edit pathways

---

## Part 2: Reports Module Implementation

### 2.1 Backend Reports Module Structure

```
CBE-backend/src/reports/
├── reports.controller.ts
├── reports.service.ts
├── reports.module.ts
├── dto/
│   ├── create-report.dto.ts
│   └── report-query.dto.ts
├── entities/
│   └── report.entity.ts
└── schemas/
    └── report.schema.ts
```

### 2.2 Report Schema

```typescript
interface StudentReport {
  _id: ObjectId;
  studentId: ObjectId;
  reportType: 'pathway' | 'performance' | 'comprehensive';
  generatedDate: Date;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  pathwayRecommendation: {
    recommendedPathway: Pathway;
    confidenceScore: number;
    alternativePathways: Pathway[];
  };
  performanceSummary: {
    overallPOINTSS: number;
    subjectScores: Record<string, number>;
    gradeDistribution: object;
    trends: object;
  };
  interests: string[];
  teacherNotes: string;
  parentViewable: boolean;
  createdBy: ObjectId;
  lastModified: Date;
}

interface SchoolReport {
  _id: ObjectId;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  totalStudents: number;
  pathwayDistribution: Record<string, number>;
  performanceStatistics: object;
  trends: object;
  generatedDate: Date;
  generatedBy: ObjectId;
}
```

### 2.3 Service Methods

```typescript
// reports.service.ts

// Student Reports
async generateStudentReport(studentId: string, reportType: string): Promise<StudentReport>;
async getStudentReport(reportId: string): Promise<StudentReport>;
async getStudentReports(studentId: string, limit?: number): Promise<StudentReport[]>;

// School Reports
async generateSchoolReport(startDate: Date, endDate: Date): Promise<SchoolReport>;
async getSchoolReports(query: ReportQuery): Promise<SchoolReport[]>;

// Export
async exportReportPDF(reportId: string): Promise<Buffer>;
async exportReportExcel(reportId: string): Promise<Buffer>;

// Analytics
async getPathwayAnalytics(): Promise<object>;
async getPerformanceTrends(): Promise<object>;
```

### 2.4 Report Generation Implementation

```typescript
async generateStudentReport(studentId: string, reportType: string = 'comprehensive'): Promise<StudentReport> {
  // Fetch student data
  const student = await this.studentsService.findById(studentId);
  const performance = await this.performanceService.getStudentPerformance(studentId);
  const pathway = await this.pathwaysService.getStudentPathway(studentId);

  // Calculate POINTSS
  const POINTSS = this.calculatePOINTSS(performance);

  // Get recommendation
  const recommendation = await this.pathwaysService.recommendPathway(studentId);

  // Build report
  const report = new StudentReport({
    studentId,
    reportType,
    generatedDate: new Date(),
    pathwayRecommendation: {
      recommendedPathway: recommendation.pathway,
      confidenceScore: recommendation.confidenceScore,
      alternativePathways: [] // Get alternative pathways
    },
    performanceSummary: {
      overallPOINTSS: POINTSS,
      subjectScores: performance.subjectScores,
      gradeDistribution: this.getGradeDistribution(performance),
      trends: this.calculateTrends(performance)
    },
    interests: student.interests || [],
    parentViewable: true,
    createdBy: this.getCurrentUserId()
  });

  return this.reportsRepository.save(report);
}

private calculatePOINTSS(performance: StudentPerformance): number {
  const scores = Object.values(performance.subjectScores);
  return scores.length > 0 
    ? scores.reduce((a, b) => a + b, 0) / scores.length / 100 * 4
    : 0;
}
```

### 2.5 Frontend Reports Components

```
CBE-frontend/src/app/pages/reports/
├── reports.component.ts
├── reports.component.html
├── report-viewer.component.ts
├── report-viewer.component.html
├── report-generation.component.ts
├── report-generation.component.html
├── school-analytics.component.ts
├── school-analytics.component.html
└── services/
    └── reports.service.ts
```

---

## Part 3: Parent Portal Implementation

### 3.1 Parent Access Control

Update the `auth.module.ts` to support parent role:

```typescript
// roles.enum.ts
export enum Role {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent'  // ADD THIS
}

// permissions.enum.ts
export enum Permission {
  // Student permissions
  MANAGE_STUDENTS = 'manage:students',
  VIEW_STUDENTS = 'view:students',
  
  // Parent permissions
  VIEW_OWN_CHILD = 'view:ownchild',      // ADD THIS
  VIEW_CHILD_PROGRESS = 'view:progress',  // ADD THIS
  VIEW_CHILD_REPORTS = 'view:reports',    // ADD THIS
  // ...
}
```

### 3.2 Parent Portal Components

```
CBE-frontend/src/app/pages/parent-portal/
├── parent-dashboard.component.ts
├── parent-dashboard.component.html
├── child-progress.component.ts
├── child-progress.component.html
├── child-reports.component.ts
├── child-reports.component.html
├── pathway-overview.component.ts
├── pathway-overview.component.html
└── services/
    └── parent.service.ts
```

### 3.3 Backend Parent Endpoints

```typescript
// auth.controller.ts - Add parent login
@Post('parent/login')
async parentLogin(@Body() credentials: ParentLoginDto) {
  // Authenticate parent using email
  // Return JWT token with parent role
}

// new parent.controller.ts
@Controller('api/parent')
@UseGuards(AuthGuard, RoleGuard)
@Roles(Role.PARENT)
export class ParentController {
  @Get('/:parentId/children')
  async getChildren(@Param('parentId') parentId: string) { }

  @Get('/child/:childId/progress')
  async getChildProgress(@Param('childId') childId: string) { }

  @Get('/child/:childId/reports')
  async getChildReports(@Param('childId') childId: string) { }

  @Get('/child/:childId/pathway')
  async getChildPathway(@Param('childId') childId: string) { }
}
```

---

## Part 4: Database Schema Updates

### 4.1 Student Schema Extension

```typescript
// Add to Student schema:
interests?: string[];              // Student interests
selectedPathway?: ObjectId;        // Reference to Pathway
parentEmail?: string;              // Parent email for portal access
competencies?: string[];           // Student competencies
```

### 4.2 Create Indexes

```typescript
// pathway.schema.ts
pathwaySchema.index({ code: 1 }, { unique: true });
pathwaySchema.index({ name: 1 });

// student-pathway.schema.ts
studentPathwaySchema.index({ studentId: 1, status: 1 });
studentPathwaySchema.index({ pathway: 1 });

// report.schema.ts
reportSchema.index({ studentId: 1, generatedDate: -1 });
reportSchema.index({ reportPeriod.startDate: 1, reportPeriod.endDate: 1 });
```

---

## Part 5: Testing Requirements

### 5.1 Unit Tests

```
CBE-backend/src/pathways/
├── pathways.service.spec.ts
├── pathways.controller.spec.ts
└── recommendation.service.spec.ts

CBE-backend/src/reports/
├── reports.service.spec.ts
└── reports.controller.spec.ts
```

### 5.2 E2E Tests

```typescript
// pathways.e2e-spec.ts
describe('Pathways API (e2e)', () => {
  describe('POST /pathways', () => {
    it('should create a new pathway', () => { });
    it('should validate required fields', () => { });
  });

  describe('POST /pathways/:id/assign/:studentId', () => {
    it('should assign pathway to student', () => { });
    it('should approve pathway', () => { });
  });

  describe('POST /pathways/recommend/:studentId', () => {
    it('should generate pathway recommendation', () => { });
  });
});
```

---

## Part 6: Migration and Data Population

### 6.1 Create Initial Pathways

```typescript
// seed-pathways.ts
const pathwaysData = [
  {
    name: 'STEM',
    code: 'STEM001',
    description: 'Science, Technology, Engineering, and Mathematics pathway',
    requiredSubjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
    careerPaths: ['Engineering', 'Medicine', 'Computer Science', 'Architecture'],
    requiredCompetencies: ['Problem-solving', 'Analytical thinking', 'Critical thinking'],
    minimumPOINTSS: 3.0,
    interestProfile: {
      keywords: ['science', 'technology', 'engineering', 'innovation'],
      skillsRequired: ['numeracy', 'analytical skills']
    }
  },
  {
    name: 'Arts',
    code: 'ARTS001',
    description: 'Arts and Humanities pathway',
    requiredSubjects: ['Literature', 'History', 'Language', 'Geography'],
    careerPaths: ['Journalism', 'Law', 'Education', 'Diplomacy'],
    requiredCompetencies: ['Communication', 'Creativity', 'Critical thinking'],
    minimumPOINTSS: 2.5,
    interestProfile: {
      keywords: ['literature', 'culture', 'history', 'language'],
      skillsRequired: ['communication', 'writing']
    }
  },
  {
    name: 'Social Sciences',
    code: 'SOCSCI001',
    description: 'Social Sciences pathway',
    requiredSubjects: ['Economics', 'Geography', 'History', 'Government'],
    careerPaths: ['Economics', 'Business', 'Government', 'Social Work'],
    requiredCompetencies: ['Analysis', 'Research', 'Communication'],
    minimumPOINTSS: 2.5,
    interestProfile: {
      keywords: ['society', 'economics', 'politics', 'social'],
      skillsRequired: ['analysis', 'research']
    }
  },
  {
    name: 'Sports Science',
    code: 'SPORTS001',
    description: 'Sports Science pathway',
    requiredSubjects: ['Physical Education', 'Biology', 'Chemistry', 'Mathematics'],
    careerPaths: ['Coaching', 'Sports Medicine', 'Athletic Training', 'Physical Therapy'],
    requiredCompetencies: ['Teamwork', 'Leadership', 'Physical fitness'],
    minimumPOINTSS: 2.0,
    interestProfile: {
      keywords: ['sports', 'fitness', 'health', 'athletics'],
      skillsRequired: ['athletic ability', 'teamwork']
    }
  }
];
```

---

## Part 7: Implementation Checklist

### Phase 2: Pathways (Weeks 1-4)

- [ ] Create pathways module structure
- [ ] Design pathway schema
- [ ] Implement pathway CRUD operations
- [ ] Design student-pathway association schema
- [ ] Implement recommendation algorithm
- [ ] Create pathway assignment endpoints
- [ ] Create pathway approval workflow
- [ ] Implement pathway change tracking
- [ ] Create frontend pathway components
- [ ] Implement pathway UI forms
- [ ] Write unit tests
- [ ] Write E2E tests
- [ ] Seed initial pathways data

### Phase 3: Reports (Weeks 5-7)

- [ ] Create reports module structure
- [ ] Design report schemas
- [ ] Implement report generation logic
- [ ] Create report CRUD endpoints
- [ ] Implement PDF export functionality
- [ ] Implement Excel export functionality
- [ ] Create frontend report components
- [ ] Implement report viewer UI
- [ ] Create analytics dashboard
- [ ] Write unit tests
- [ ] Write E2E tests

### Phase 4: Parent Portal (Weeks 8-9)

- [ ] Add parent role and permissions
- [ ] Create parent authentication endpoints
- [ ] Implement parent-child relationship tracking
- [ ] Create parent dashboard component
- [ ] Implement child progress view
- [ ] Implement child reports view
- [ ] Create pathway overview for parents
- [ ] Implement notifications
- [ ] Write unit tests
- [ ] Write E2E tests

### Phase 5: Testing & Deployment (Week 10)

- [ ] Performance testing
- [ ] Security audit
- [ ] Load testing
- [ ] UAT with stakeholders
- [ ] Bug fixes
- [ ] Production deployment

---

## Environment Setup

### Backend Environment Variables

Add to `CBE-backend/.env`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/CBE-pathway
MONGODB_TEST_URI=mongodb://localhost:27017/CBE-pathway-test

# Authentication
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Reports
REPORT_TEMP_DIR=./temp/reports
PDF_LIBRARY=pdfkit  # or puppeteer

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## Success Criteria

- ✅ All proposal objectives addressed
- ✅ 100% test coverage for new modules
- ✅ API response time < 500ms
- ✅ All modules synchronized between frontend and backend
- ✅ Parent portal fully functional
- ✅ Report generation accurate and timely
- ✅ Pathway recommendations have 85%+ confidence

---

## Support & Maintenance

For implementation questions or issues:
1. Refer to module-specific README files
2. Check existing module implementations for patterns
3. Review test files for usage examples
4. Consult with the development team

---

**Last Updated**: May 2026
**Project Phase**: Implementation Roadmap
