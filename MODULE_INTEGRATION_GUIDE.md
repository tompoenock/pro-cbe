# Module Integration Guide

## Overview

This guide documents how the new CBE Pathway modules (Pathways, Reports, and Parent Portal) integrate with existing modules and communicate with each other.

---

## 1. Module Dependencies Map

### Pathways Module
**Dependencies:**
- `Students` - Links to student records
- `Subjects` - Contains subject information
- `Grading` - Used for pathway recommendations based on grades

**Integrations:**
- Stores pathway selection for students
- Used by Reports module for pathway recommendations
- Used by Parent Portal for student's current pathway

### Reports Module
**Dependencies:**
- `Students` - Links to student records
- `Pathways` - Includes pathway recommendations
- `Performance` - Fetches performance data for reports
- `Staff` - Tracks who generated/approved reports

**Integrations:**
- Generates comprehensive reports combining pathway and performance data
- Data accessed by Parent Portal (read-only)
- Communicates with Pathways service for recommendation data

### Parent Portal
**Dependencies:**
- `Students` - Fetches student data
- `Performance` - Views child's grades
- `Pathways` - Views child's pathway
- `Reports` - Views generated reports
- `Auth` - Parent role verification

**Integration Points:**
- Read-only access to all student data
- Cannot modify student data or pathways
- Bidirectional messaging with Teachers

---

## 2. Data Flow Diagrams

### Pathway Assignment Flow
```
Student Selection
    ↓
Pathways Module (Validates & Stores)
    ↓
Teacher Approval
    ↓
StudentPathway Status: 'approved'
    ↓
Reports Module (Uses for recommendations)
    ↓
Parent Portal (Displays to parent)
```

### Report Generation Flow
```
Teacher Initiates Report
    ↓
Reports Service (Fetches data from)
    ├── Performance Service (scores, POINTSS)
    ├── Pathways Service (pathway recommendations)
    └── Students Service (student info)
    ↓
Report Created with Combined Data
    ↓
Parent Portal (Read-only access)
    ↓
Teacher/Admin (Can modify/delete)
```

### Parent Access Flow
```
Parent Logs In (PARENT role)
    ↓
Parent Portal Service
    ├── GET /api/students/{id} → Student info
    ├── GET /api/performance/student/{id} → Grades
    ├── GET /api/pathways/student/{id} → Pathway
    ├── GET /api/reports/student/by-student/{id} → Reports
    └── GET /api/students/{id}/attendance → Attendance
    ↓
Display in Parent Portal Components
    ↓
No Write Access (Except messaging)
```

---

## 3. API Communication Patterns

### Between Backend Modules

#### Pathways → Performance (for recommendations)
```typescript
// This would be done in Reports Service when generating comprehensive reports
// Get performance data for pathway recommendations

Example:
GET /api/performance/student/{studentId}

Response includes:
- Scores by subject
- Overall POINTSS
- Grade trends
- Subject performance
```

#### Reports → Pathways (for including pathway in report)
```typescript
// Get current pathway assignment
GET /api/pathways/student/{studentId}

Response includes:
- Current pathway
- Confidence score
- Alternative pathways
- Selection date
```

#### Parent Portal → All Modules (read-only)
```typescript
// Parent can view but not modify

Example Calls:
GET /api/students/{id} → Child's info
GET /api/performance/student/{id} → Grades
GET /api/pathways/student/{id} → Current pathway
GET /api/reports/student/by-student/{id} → Reports
GET /api/students/{id}/attendance → Attendance

All return 403 if:
- Student is not child of parent
- Parent lacks PARENT role
- Data is not marked parentViewable=true
```

---

## 4. Cross-Module Service Calls

### In ReportsService (reports.service.ts)

When generating comprehensive reports, the service needs to:

1. **Get student info** from Students module
```typescript
// This is handled through database references
studentModel.find().populate('studentId', 'firstName lastName admissionNumber')
```

2. **Get performance data** (should be done in controller with injected PerformanceService)
```typescript
// Controller injects: PerformanceService
const performance = await this.performanceService.getStudentPerformance(studentId);
report.performanceSummary = {
  overallPOINTSS: performance.POINTSS,
  subjectScores: performance.scores,
  gradeDistribution: performance.distribution,
  trends: performance.trends
};
```

3. **Get pathway recommendation** (should be done in controller with injected PathwaysService)
```typescript
// Controller injects: PathwaysService
const pathway = await this.pathwaysService.getStudentPathway(studentId);
report.pathwayRecommendation = {
  recommendedPathway: pathway.pathwayId,
  confidenceScore: calculateConfidence(performance), // Calculate based on POINTSS
  alternativePathways: getAlternativePathways(performance) // Based on scores
};
```

---

## 5. Required Controller Updates

To complete the integration, update the ReportsController:

```typescript
@Injectable()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly performanceService: PerformanceService,
    private readonly pathwaysService: PathwaysService,
    private readonly studentsService: StudentsService,
  ) {}

  @Post('student/comprehensive')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  async generateComprehensiveReport(
    @Body() dto: CreateStudentReportDto,
    @Req() req: any
  ) {
    // Step 1: Create base report
    const report = await this.reportsService.generateStudentReport(dto);

    // Step 2: Get performance data
    const performance = await this.performanceService.getStudentPerformance(dto.studentId);
    
    // Step 3: Get pathway data
    const pathway = await this.pathwaysService.getStudentPathway(dto.studentId);
    
    // Step 4: Get student info
    const student = await this.studentsService.findOne(dto.studentId);

    // Step 5: Update report with combined data
    const updatedReport = await this.reportsService.updateReport(report._id, {
      performanceSummary: {
        overallPOINTSS: performance?.overallPOINTSS,
        subjectScores: performance?.scores,
        gradeDistribution: performance?.distribution,
        trends: performance?.trends
      },
      pathwayRecommendation: {
        recommendedPathway: pathway?.pathwayId,
        confidenceScore: this.calculateConfidenceScore(performance),
        alternativePathways: this.getAlternativePathways(performance)
      }
    });

    return updatedReport;
  }

  private calculateConfidenceScore(performance: any): number {
    // Calculate based on POINTSS consistency and subject performance
    if (!performance) return 0;
    const POINTSS = performance.overallPOINTSS || 0;
    const consistency = this.getConsistency(performance.trends);
    return Math.round((POINTSS / 4) * consistency * 100);
  }

  private getAlternativePathways(performance: any): string[] {
    // Get pathways that fit student's profile
    // This requires querying pathways where minimumPOINTSS <= student's POINTSS
    return [];
  }
}
```

---

## 6. Kindly Communication Patterns

### Error Handling Between Modules

**Pathways → Reports:**
```typescript
// If pathway lookup fails, don't fail entire report
try {
  const pathway = await this.pathwaysService.getStudentPathway(studentId);
  report.pathwayRecommendation = pathway;
} catch (error) {
  console.warn(`Pathway data unavailable for student ${studentId}:`, error);
  // Continue without pathway data
}
```

### Data Validation at Module Boundaries

**When accepting data from other modules:**
```typescript
// Validate that references are valid
if (!Types.ObjectId.isValid(studentId)) {
  throw new BadRequestException('Invalid student ID from Pathways module');
}

// Validate required fields exist
if (!pathway.pathwayId || !pathway.status) {
  throw new BadRequestException('Incomplete pathway data');
}
```

### Graceful Degradation

**Parent Portal accessing restricted data:**
```typescript
// If performance data is unavailable, still show pathway
async getStudentData(studentId: string) {
  const student = await this.getStudentBasicInfo(studentId); // Always available
  
  try {
    const performance = await this.getPerformance(studentId);
    return { ...student, performance };
  } catch {
    return student; // Return without performance
  }
}
```

---

## 7. Database References Between Modules

### Schema Relationships

**StudentPathway references:**
```typescript
{
  studentId: ObjectId, // ref: 'Student'
  pathwayId: ObjectId, // ref: 'Pathway'
  approvedBy: ObjectId, // ref: 'Staff' (not 'User')
}
```

**StudentReport references:**
```typescript
{
  studentId: ObjectId, // ref: 'Student'
  createdBy: ObjectId, // ref: 'User'
  pathwayRecommendation: {
    recommendedPathway: ObjectId, // ref: 'Pathway'
    alternativePathways: [ObjectId] // ref: 'Pathway'
  }
}
```

### Populate Pattern (Mongoose)
```typescript
// Always include related data from other modules
report
  .populate('studentId', 'firstName lastName admissionNumber')
  .populate({
    path: 'pathwayRecommendation.recommendedPathway',
    select: 'name code'
  })
  .exec()
```

---

## 8. Common Integration Issues & Solutions

### Issue 1: Module Not Injected
**Problem:** Reports controller can't access Performance data
**Solution:**
```typescript
// In reports.module.ts, import required modules
@Module({
  imports: [
    MongooseModule.forFeature([...]),
    PerformanceModule, // Add this
    PathwaysModule,    // Add this
  ],
})
```

### Issue 2: Circular Dependencies
**Problem:** Pathways imports Reports, Reports imports Pathways
**Solution:** Only import what's needed, use services not modules
```typescript
// ❌ WRONG: Creates circular dependency
imports: [ReportsModule] // In pathways.module

// ✅ CORRECT: Each module independent, integration in controller
// No module-level imports of dependent modules
```

### Issue 3: Parent Accessing Student Data
**Problem:** Parent can modify student's pathway
**Solution:** Check role and StudentId ownership in controller
```typescript
@Get('pathways/student/:studentId')
async getStudentPathway(@Param('studentId') studentId: string, @Req() req) {
  // Check if parent requesting own child's data
  if (req.user.role === Role.Parent) {
    const isOwnChild = await this.studentService.isParentOfStudent(
      req.user.id,
      studentId
    );
    if (!isOwnChild) {
      throw new ForbiddenException('Cannot access this student');
    }
  }
  
  return this.pathwaysService.getStudentPathway(studentId);
}
```

---

## 9. Testing Integration Points

### Test: Reports includes Pathway Data
```typescript
describe('ReportsService - Pathway Integration', () => {
  it('should include pathway in comprehensive report', async () => {
    const studentId = '123';
    const pathway = { pathwayId: '456', status: 'approved' };
    
    jest.spyOn(pathwaysService, 'getStudentPathway')
      .mockResolvedValue(pathway);
    
    const report = await reportsController.generateComprehensiveReport(
      { studentId, reportType: 'comprehensive' },
      { user: { id: 'teacher1' } }
    );
    
    expect(report.pathwayRecommendation).toBeDefined();
    expect(pathwaysService.getStudentPathway).toHaveBeenCalledWith(studentId);
  });
});
```

### Test: Parent Can Only Access Own Child
```typescript
describe('ParentPortal - Access Control', () => {
  it('should deny parent access to other students', async () => {
    const otherStudentId = 'not-my-child';
    const parentId = 'parent1';
    
    await expect(
      service.getStudentData(otherStudentId, parentId)
    ).rejects.toThrow(ForbiddenException);
  });
});
```

---

## 10. Deployment Checklist

- [ ] PathwaysModule registered in AppModule
- [ ] ReportsModule registered in AppModule
- [ ] PerformanceService injected in ReportsController
- [ ] PathwaysService injected in ReportsController
- [ ] Parent role added to roles.enum.ts
- [ ] Parent permissions added to permissions.enum.ts
- [ ] PARENT role guard implemented
- [ ] Parent access control tested
- [ ] Module populate patterns verified
- [ ] Circular dependencies resolved
- [ ] Error handling between modules tested
- [ ] Frontend services created for all APIs
- [ ] Frontend components handle missing data gracefully

---

## 11. Quick Reference: Which Modules Talk to Which

| From | To | Purpose | Via |
|------|-----|---------|-----|
| Reports | Performance | Get student scores | Service injection |
| Reports | Pathways | Get pathway recommendations | Service injection |
| Reports | Students | Get student info | Database populate |
| Pathways | Students | Validate student exists | Database populate |
| Parent Portal | All | Read student data | API calls (RO) |
| Pathways | Grading | Minimum POINTSS validation | Database populate |

---

## 12. API Endpoints Summary

### Pathways Endpoints
```
GET    /api/pathways                              - Get all pathways
GET    /api/pathways/:id                         - Get pathway
POST   /api/pathways                              - Create pathway
PATCH  /api/pathways/:id                         - Update pathway
DELETE /api/pathways/:id                         - Delete pathway
POST   /api/pathways/:pathwayId/assign/:studentId - Assign to student
GET    /api/pathways/student/:studentId          - Get student's pathway
```

### Reports Endpoints
```
POST   /api/reports/student                      - Generate student report
GET    /api/reports/student/all                  - Get all reports
GET    /api/reports/student/:reportId            - Get single report
GET    /api/reports/student/by-student/:studentId - Get student's reports
POST   /api/reports/school                       - Generate school report
GET    /api/reports/school/all                   - Get all school reports
```

### Parent Portal Access (Read-Only)
```
GET    /api/students/{id}                        - Child's profile
GET    /api/performance/student/{id}             - Child's grades
GET    /api/pathways/student/{id}                - Child's pathway
GET    /api/reports/student/by-student/{id}     - Child's reports
GET    /api/students/{id}/attendance             - Child's attendance
```

---

## Summary

The three new modules work together harmoniously:

1. **Pathways** - Manages student pathway selection and approval
2. **Reports** - Combines data from pathways and performance into comprehensive reports
3. **Parent Portal** - Provides parents read-only access to child's pathway, performance, and reports

All modules maintain kindly communication through:
- Proper error handling
- Graceful degradation
- Clear role-based access control
- Service injection for internal integration
- API calls for cross-workspace communication
