# Quick Reference: New API Endpoints

## Class & Student Management

### Bulk Assign Students to Class
```
POST /api/students/bulk/assign-to-class
Body: { classId, studentIds[], academicYear }
Returns: { assigned, failed }
```

### Assign Subjects to Student
```
POST /api/students/subjects/assign
Body: { studentId, classId, academicYear, subjectIds[] }
Returns: StudentSubject[]
```

### Get Student's Enrolled Subjects
```
GET /api/students/:studentId/subjects?classId=&academicYear=
Returns: StudentSubject[]
```

### Get Class Subject Enrollments
```
GET /api/students/class/:classId/subjects?academicYear=
Returns: StudentSubject[] (all students' enrollments in class)
```

### Query Student Subjects (Flexible)
```
GET /api/students/subjects/query?studentId=&classId=&academicYear=&status=&limit=50&page=1
Returns: { data: StudentSubject[], total }
```

### Update Enrollment Status
```
PUT /api/students/subjects/:studentSubjectId/status?status=active|completed|dropped
Returns: StudentSubject
```

### Remove Student from Subject
```
DELETE /api/students/subjects/:studentSubjectId
```

---

## Pathway Management

### Determine Pathway by Marks
```
POST /api/pathways/determine-marks?studentId=&academicYear=&term=
Returns: Pathway | null
Logic: Finds marks-based pathway matching student's average marks
```

### Determine Pathway by Subjects
```
POST /api/pathways/determine-subjects?studentId=&classId=&academicYear=
Returns: Pathway | null
Logic: Finds subject-based pathway with best subject overlap
```

### Auto-Assign Pathway
```
POST /api/pathways/auto-assign/:studentId?classId=&academicYear=&term=
Returns: StudentPathway | null
Logic: Tries marks-based first, then subject-based
```

### Get Pathway Suggestions
```
GET /api/pathways/suggestions/:studentId?classId=&academicYear=&term=
Returns: Pathway[]
Logic: Returns all matching pathways (both marks and subject-based)
```

### Get Students in Pathway (by Class)
```
GET /api/pathways/:pathwayId/students/class/:classId
Returns: StudentPathway[] (filtered by class)
```

---

## Performance & Grading

### Create Performance (Auto-Grades)
```
POST /api/performance
Body: { studentId, subjectId, classId, academicYear, term, examType, score }
Returns: Performance (with auto-assigned grade, remark, points)
```

### Bulk Create Performance (Auto-Grades)
```
POST /api/performance/bulk
Body: { 
  classId, subjectId, academicYear, term, examType,
  scores: [{ studentId, score }, ...]
}
Returns: { created, updated }
```

---

## Create Marks-Based Pathway

```
POST /api/pathways
Body: {
  "code": "STEM",
  "name": "STEM Pathway",
  "description": "For high performers",
  "pathwayType": "marks-based",
  "requiredSubjects": ["subjectId1", "subjectId2"],
  "marksRange": {
    "minMarks": 70,
    "maxMarks": 100,
    "subjectCriteria": [
      { "subjectId": "subjectId1", "minimumMarks": 65 }
    ]
  }
}
Returns: Pathway
```

---

## Sample Workflow

### Step 1: Setup Classes and Students
```
1. Create classes
2. Create students
3. POST /api/students/bulk/assign-to-class (assign students to class)
```

### Step 2: Configure Subjects
```
1. Create subjects for each class
```

### Step 3: Subject Selection
```
1. FOR EACH STUDENT:
   POST /api/students/subjects/assign (select 8 out of 13 subjects)
```

### Step 4: Enter Marks
```
1. FOR EACH SUBJECT AND EXAM:
   POST /api/performance/bulk (bulk enter marks)
   - Grades are auto-assigned
```

### Step 5: Pathway Assignment
```
1. FOR EACH STUDENT:
   POST /api/pathways/auto-assign/:studentId
   OR
   GET /api/pathways/suggestions/:studentId (get suggestions first)
   THEN
   POST /api/pathways/:pathwayId/assign/:studentId (manual assign)
```

### Step 6: View Results
```
1. GET /api/pathways/:pathwayId/tracking (performance summary)
2. GET /api/pathways/:pathwayId/students/class/:classId (class-filtered students)
3. GET /api/pathways/analytics/distribution (pathway distribution)
```

---

## Key Query Parameters

| Parameter | Used In | Values |
|-----------|---------|--------|
| `classId` | Most endpoints | MongoDB ObjectId |
| `studentId` | Most endpoints | MongoDB ObjectId |
| `subjectId` | Performance endpoints | MongoDB ObjectId |
| `academicYear` | All endpoints | String (e.g., "2024") |
| `term` | Performance endpoints | "Term 1" \| "Term 2" \| "Term 3" |
| `examType` | Performance endpoints | "CAT 1" \| "CAT 2" \| "Mid-Term" \| "End-Term" \| "Final" |
| `status` | StudentSubject endpoints | "active" \| "completed" \| "dropped" |
| `pathwayType` | Pathway query | "subject-based" \| "marks-based" |
| `limit` | All list endpoints | 1-100 (default: 50) |
| `page` | All list endpoints | 1+ (default: 1) |

---

## Key Validation Rules

- **marks**: 0-100 (required for Performance)
- **academicYear**: Required (string format)
- **classId**: Must be valid MongoDB ObjectId
- **studentId**: Must be valid MongoDB ObjectId
- **Enrollment Status**: 'active', 'completed', or 'dropped'
- **Mark Ranges**: minMarks < maxMarks
- **Subject Limit**: No hard limit, but recommended ~8 per student

---

## Common Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 400 | Invalid student ID | Verify student ID is valid MongoDB ObjectId |
| 404 | Student not found | Check student exists in database |
| 409 | Student already has active pathway | Use change pathway endpoint if needed |
| 400 | Invalid class ID | Verify class ID is valid MongoDB ObjectId |
| 404 | Class not found | Check class exists in database |
| 400 | One or more subjects not found | Verify all subject IDs are valid |
| 404 | Pathway not found | Check pathway exists in database |

---

## Best Practices ✅

1. ✅ Always include `classId` and `academicYear` in queries
2. ✅ Use bulk endpoints for mass operations (faster)
3. ✅ Configure default grading scale before entering marks
4. ✅ Call auto-assign after marks entry for automatic pathway assignment
5. ✅ Use marks-based pathways for performance tracking
6. ✅ Use subject-based pathways for interest-based selection
7. ✅ Validate subject count before enrollment (8 recommended)
8. ✅ Use suggestions endpoint before assigning pathways
9. ✅ Always verify class exists before student assignment
10. ✅ Use query endpoint for flexible filtering needs

