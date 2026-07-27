# CBE-Pathway: Class-based Student and Subject Management Implementation Guide

## Overview

This document outlines the new features implemented for managing students by class, subject selection, marks-based pathways, and auto-grading functionality.

## Key Features Implemented

### 1. **Class-Based Student Enrollment**

Students are now grouped by class and can be bulk-assigned to classes. This provides a structured way to manage student groups.

#### Endpoints:

```
POST /api/students/bulk/assign-to-class
- Bulk assign multiple students to a class
- Request Body:
  {
    "classId": "string (MongoDB ObjectId)",
    "studentIds": ["string (MongoDB ObjectId)", ...],
    "academicYear": "2024"
  }
- Response: { "assigned": number, "failed": number }
```

### 2. **Subject Selection and Enrollment**

Students can now be selectively assigned to subjects within their class. A class may have ~13 subjects, but each student is only enrolled in ~8 subjects.

#### Data Model:

**StudentSubject Schema** tracks enrollment with fields:
- `studentId`: Reference to Student
- `subjectId`: Reference to Subject
- `classId`: Reference to Class
- `academicYear`: Academic year of enrollment
- `enrollmentDate`: Date of enrollment
- `status`: 'active' | 'completed' | 'dropped'

#### Endpoints:

```
POST /api/students/subjects/assign
- Assign subjects to a student
- Request Body:
  {
    "studentId": "string (MongoDB ObjectId)",
    "classId": "string (MongoDB ObjectId)",
    "academicYear": "2024",
    "subjectIds": ["string (MongoDB ObjectId)", ...]
  }
- Response: StudentSubject[] (array of enrollment records)

GET /api/students/:studentId/subjects?classId=&academicYear=
- Get all subjects enrolled by a student
- Query Parameters:
  - classId: string (MongoDB ObjectId)
  - academicYear: string

GET /api/students/class/:classId/subjects?academicYear=
- Get all student-subject enrollments for a class
- Query Parameters:
  - academicYear: string

GET /api/students/subjects/query
- Query student subjects with filters
- Query Parameters:
  - studentId (optional): string (MongoDB ObjectId)
  - classId (optional): string (MongoDB ObjectId)
  - academicYear (optional): string
  - status (optional): 'active' | 'completed' | 'dropped'
  - limit (optional): number (default: 50, max: 100)
  - page (optional): number (default: 1)
- Response: { "data": StudentSubject[], "total": number }

PUT /api/students/subjects/:studentSubjectId/status?status=
- Update enrollment status
- Query Parameters:
  - status: 'active' | 'completed' | 'dropped'
- Response: StudentSubject

DELETE /api/students/subjects/:studentSubjectId
- Remove student from subject
```

### 3. **Auto-Grading on Mark Entry**

When marks are entered in the performance module, grades are automatically assigned based on the configured grading scale.

#### Implementation:

The Performance Service automatically:
1. Checks the default grading scale
2. Looks up the mark range
3. Assigns the corresponding grade, remark, and points

#### Example Grading Scale:

```json
{
  "name": "Standard Grading Scale",
  "grades": [
    { "grade": "A", "minScore": 80, "maxScore": 100, "points": 4, "remark": "Excellent" },
    { "grade": "B", "minScore": 70, "maxScore": 79, "points": 3, "remark": "Very Good" },
    { "grade": "C", "minScore": 60, "maxScore": 69, "points": 2, "remark": "Good" },
    { "grade": "D", "minScore": 50, "maxScore": 59, "points": 1, "remark": "Fair" },
    { "grade": "E", "minScore": 0, "maxScore": 49, "points": 0, "remark": "Poor" }
  ]
}
```

#### Endpoints (Existing):

```
POST /api/performance
- Create performance record with automatic grading
- Request Body:
  {
    "studentId": "string",
    "subjectId": "string",
    "classId": "string",
    "academicYear": "2024",
    "term": "Term 1",
    "examType": "End-Term",
    "score": 85
  }
- Response: Performance (with auto-assigned grade)

POST /api/performance/bulk
- Bulk create/update performance records
- Request Body:
  {
    "classId": "string",
    "subjectId": "string",
    "academicYear": "2024",
    "term": "Term 1",
    "examType": "End-Term",
    "scores": [
      { "studentId": "string", "score": 85 },
      ...
    ]
  }
- Response: { "created": number, "updated": number }
```

### 4. **Marks-Based Pathways**

Pathways can now be configured to automatically assign students based on their marks ranges.

#### Updated Pathway Schema:

```javascript
{
  "code": "STEM",
  "name": "Science, Technology, Engineering, Mathematics",
  "description": "...",
  "requiredSubjects": ["subjectId1", "subjectId2", ...],
  "pathwayType": "marks-based", // or "subject-based"
  "marksRange": {
    "minMarks": 70,
    "maxMarks": 100,
    "subjectCriteria": [
      {
        "subjectId": "subjectId1",
        "minimumMarks": 65  // Optional: specific subject requirement
      },
      ...
    ]
  }
}
```

#### Creating a Marks-Based Pathway:

```
POST /api/pathways
- Request Body:
  {
    "code": "STEM",
    "name": "STEM Pathway",
    "description": "For high-performing students in science subjects",
    "pathwayType": "marks-based",
    "requiredSubjects": ["subjectId1", "subjectId2"],
    "marksRange": {
      "minMarks": 70,
      "maxMarks": 100,
      "subjectCriteria": [
        {
          "subjectId": "subjectId1",
          "minimumMarks": 65
        }
      ]
    }
  }
```

### 5. **Pathway Determination and Auto-Assignment**

#### Endpoints:

```
POST /api/pathways/determine-marks
- Determine which pathway a student should be in based on marks
- Query Parameters:
  - studentId: string (MongoDB ObjectId)
  - academicYear: string
  - term: string
- Response: Pathway (or null if no match)
- Logic:
  1. Gets student's performance records for the term
  2. Calculates average marks
  3. Finds marks-based pathway with matching range
  4. Validates subject-specific criteria if present

POST /api/pathways/determine-subjects
- Determine pathway based on subject selection
- Query Parameters:
  - studentId: string (MongoDB ObjectId)
  - classId: string (MongoDB ObjectId)
  - academicYear: string
- Response: Pathway (or null if no match)
- Logic:
  1. Gets student's enrolled subjects
  2. Finds subject-based pathway with best match
  3. Returns pathway with highest subject overlap

POST /api/pathways/auto-assign/:studentId
- Auto-assign a pathway to a student
- Query Parameters:
  - classId: string (MongoDB ObjectId)
  - academicYear: string
  - term: string
- Response: StudentPathway (or null if already assigned or no match)
- Logic:
  1. Checks if student already has active pathway
  2. Tries marks-based determination first
  3. Falls back to subject-based determination
  4. Creates StudentPathway record with status 'approved'

GET /api/pathways/suggestions/:studentId
- Get pathway suggestions for a student
- Query Parameters:
  - classId: string (MongoDB ObjectId)
  - academicYear: string
  - term: string
- Response: Pathway[] (array of matching pathways)
- Returns both marks-based and subject-based matches
```

### 6. **Class-Based Pathway Views**

#### Endpoints:

```
GET /api/pathways/:pathwayId/students/class/:classId
- Get all students in a pathway for a specific class
- Response: StudentPathway[] (with student details populated)
- Filters students to only show those in the specified class

GET /api/pathways/:id
- Get pathway details
- Response: Pathway (includes populated requiredSubjects and marksRange)
```

## Frontend Integration Examples

### Example 1: Bulk Assign Students to Class

```typescript
// 1. Get all unassigned students
GET /api/students?classId=null // or use query for unassigned

// 2. Bulk assign selected students to class
POST /api/students/bulk/assign-to-class
{
  "classId": "classId123",
  "studentIds": ["studentId1", "studentId2", "studentId3"],
  "academicYear": "2024"
}

// 3. Response
{ "assigned": 3, "failed": 0 }
```

### Example 2: Manage Subject Selection

```typescript
// 1. Get all subjects for the class
GET /api/subjects?classId=classId123&academicYear=2024

// 2. Get student's current subjects (if any)
GET /api/students/:studentId/subjects?classId=classId123&academicYear=2024

// 3. Assign new subjects to student
POST /api/students/subjects/assign
{
  "studentId": "studentId1",
  "classId": "classId123",
  "academicYear": "2024",
  "subjectIds": ["subjectId1", "subjectId2", "subjectId3", "subjectId4", "subjectId5", "subjectId6", "subjectId7", "subjectId8"]
}

// 4. Response shows all enrolled subjects
```

### Example 3: Enter Marks with Auto-Grading

```typescript
// 1. Bulk enter marks for a subject in a class
POST /api/performance/bulk
{
  "classId": "classId123",
  "subjectId": "subjectId1",
  "academicYear": "2024",
  "term": "Term 1",
  "examType": "End-Term",
  "scores": [
    { "studentId": "studentId1", "score": 85 },
    { "studentId": "studentId2", "score": 92 },
    { "studentId": "studentId3", "score": 78 },
    ...
  ]
}

// 2. Response shows records created/updated with auto-assigned grades
{ "created": 3, "updated": 0 }

// 3. Grades were auto-assigned:
// score 85 -> grade "B" (70-79 range)
// score 92 -> grade "A" (80-100 range)
// score 78 -> grade "B" (70-79 range)
```

### Example 4: Pathway Workflow

```typescript
// Step 1: Get active pathways available for selection
GET /api/pathways/active/list

// Step 2: After marks are entered, get pathway suggestions
GET /api/pathways/suggestions/:studentId?classId=classId123&academicYear=2024&term=Term1

// Step 3: Either:
// Option A: Auto-assign pathway (automatic)
POST /api/pathways/auto-assign/:studentId?classId=classId123&academicYear=2024&term=Term1

// Option B: Manually assign pathway (if preferred)
POST /api/pathways/:pathwayId/assign/:studentId
{
  "pathwayId": "pathwayId123",
  "notes": "Student selected based on strong STEM marks"
}

// Step 4: Get students in pathway filtered by class
GET /api/pathways/:pathwayId/students/class/:classId

// Response shows students in that pathway who are in the specified class
```

### Example 5: View Pathway Performance Tracking

```typescript
// Get detailed performance of all students in a pathway
GET /api/pathways/:pathwayId/tracking?academicYear=2024&term=Term1

// Response includes:
{
  "pathway": { "id": "...", "name": "...", "code": "..." },
  "academicYear": "2024",
  "term": "Term 1",
  "totalStudents": 45,
  "averageCompletionRate": 92.5,
  "averageScore": 78.3,
  "students": [
    {
      "studentId": "...",
      "studentName": "John Doe",
      "admissionNumber": "ADM001",
      "status": "active",
      "completedRequiredSubjects": 5,
      "requiredSubjects": 5,
      "completionRate": 100,
      "averageScore": 82.5,
      "subjectBreakdown": [...]
    },
    ...
  ]
}
```

## Database Indexes

The following indexes are automatically created:

### StudentSubject:
- `{ studentId: 1, subjectId: 1, academicYear: 1 }` (unique)
- `{ classId: 1, academicYear: 1 }`
- `{ studentId: 1, classId: 1 }`

### Performance (updated):
- Grades automatically assigned based on default grading scale

## Best Practices

1. **Always set classId when querying students**: This ensures students are grouped properly
2. **Use bulk endpoints for mass operations**: More efficient than individual requests
3. **Call auto-assign after marks entry**: Automatically pathway assignment based on academic performance
4. **Validate subject count**: Ensure students don't exceed allowed subject limits (typically 8)
5. **Set proper grading scale**: Ensure a default grading scale is configured before entering marks
6. **Use marks-based pathways for performance tracking**: Better for identifying student trajectories
7. **Use subject-based pathways for interest-based selection**: Better for student preferences

## Migration Guide (if updating existing system)

1. All existing students should be assigned to their class using bulk endpoint
2. Create StudentSubject records for existing student-subject relationships
3. Update grading scale configuration
4. Create new marks-based pathways alongside existing subject-based ones
5. Run auto-assignment for existing students to establish pathway records

## Troubleshooting

### Issue: No grade assigned when marks entered
**Solution**: Ensure a default grading scale is configured via `/api/grading` endpoints

### Issue: Student can't be assigned to pathway
**Solution**: Check if student already has active pathway. Use change pathway endpoint if needed.

### Issue: Subject enrollment fails
**Solution**: Verify both student and subject exist and belong to the correct class

### Issue: Auto-assign returns null
**Solution**: Check if:
- Student has performance records for the specified term
- Marks fall within configured pathway ranges
- Student has enrolled subjects matching pathway requirements
