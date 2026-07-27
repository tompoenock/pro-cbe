# Pathway-Based Reporting Module

## Overview

The new pathway-based reporting module enables comprehensive analysis and visualization of student progress grouped by pathway and class. It provides detailed insights into pathway performance, student progress tracking, and class-level statistics.

## Features

### 1. **Pathway-Grouped Reports**
Reports organized by pathway showing:
- Pathway details and requirements
- All students enrolled in the pathway
- Individual student progress metrics
- Pathway-level statistics and analytics

### 2. **Class-Specific Pathway Views**
Display all pathways within a specific class showing:
- All pathways with class students
- Student performance grouped by pathway
- Class-level aggregated statistics

### 3. **Student Progress Tracking**
Detailed progress for individual students showing:
- Subject-wise performance
- Overall pathway progress
- Grade distribution
- Completion rates

## API Endpoints

### Get Pathway Report (Grouped by Pathway and Class)

```
GET /api/reports/pathway/report
```

**Query Parameters:**
- `pathwayId` (optional): Filter by specific pathway (MongoDB ObjectId)
- `classId` (optional): Filter by specific class (MongoDB ObjectId)
- `academicYear` (optional): Filter by academic year (string, e.g., "2024")
- `term` (optional): Filter by term (string, e.g., "Term 1")
- `limit` (optional): Number of records per page (default: 50, max: 100)
- `page` (optional): Page number for pagination (default: 1)
- `sortBy` (optional): Sort field ('name', 'pathway', 'performance')
- `sortOrder` (optional): Sort direction ('asc', 'desc')

**Response:**
```json
{
  "generatedDate": "2024-06-03T10:30:00Z",
  "filters": {
    "pathwayId": "all|specific-id",
    "classId": "all|specific-id",
    "academicYear": "all|2024",
    "term": "all|Term 1"
  },
  "totalPathways": 5,
  "data": [
    {
      "pathway": {
        "id": "pathway-id",
        "code": "STEM",
        "name": "Science, Technology, Engineering, Mathematics",
        "description": "...",
        "pathwayType": "marks-based",
        "requiredSubjects": [...]
      },
      "statistics": {
        "totalStudents": 45,
        "averageCompletionRate": 92.5,
        "averageScore": 78.3,
        "highPerformers": 18,
        "averagePerformers": 20,
        "needsSupport": 7
      },
      "students": [
        {
          "studentId": "id",
          "studentName": "John Doe",
          "admissionNumber": "ADM001",
          "class": "Form 4A",
          "enrolledSubjects": 8,
          "performanceRecords": 8,
          "completionRate": 100,
          "averageScore": 85.5,
          "highestScore": 95,
          "lowestScore": 78,
          "gradeDistribution": {
            "A": 5,
            "B": 3
          },
          "lastUpdated": "2024-06-03T..."
        },
        ...
      ]
    },
    ...
  ]
}
```

---

### Get Class Pathway Report

```
GET /api/reports/pathway/class/:classId
```

**Parameters:**
- `classId` (required): Class ID (MongoDB ObjectId)

**Query Parameters:**
- `academicYear` (optional): Filter by academic year
- `term` (optional): Filter by term
- `limit` (optional): Records per page (default: 50, max: 100)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "generatedDate": "2024-06-03T10:30:00Z",
  "class": {
    "id": "class-id",
    "name": "Form 4",
    "section": "A",
    "academicYear": "2024"
  },
  "filters": {
    "academicYear": "all|2024",
    "term": "all|Term 1"
  },
  "totalPathways": 5,
  "totalClassStudents": 60,
  "studentsWithPerformance": 55,
  "data": [
    {
      "pathway": {
        "id": "pathway-id",
        "code": "STEM",
        "name": "Science, Technology, Engineering, Mathematics",
        "description": "...",
        "pathwayType": "marks-based",
        "requiredSubjects": [...]
      },
      "statistics": {
        "totalStudents": 28,
        "averageScore": 79.2,
        "highPerformers": 12,
        "averagePerformers": 14,
        "needsSupport": 2
      },
      "students": [
        {
          "studentId": "id",
          "studentName": "Jane Smith",
          "admissionNumber": "ADM002",
          "performanceRecords": 8,
          "averageScore": 88.5,
          "highestScore": 98,
          "lowestScore": 82,
          "gradeDistribution": {
            "A": 6,
            "B": 2
          }
        },
        ...
      ]
    },
    ...
  ]
}
```

---

### Get Student Pathway Progress

```
GET /api/reports/pathway/student/:studentId/:pathwayId
```

**Parameters:**
- `studentId` (required): Student ID (MongoDB ObjectId)
- `pathwayId` (required): Pathway ID (MongoDB ObjectId)

**Query Parameters:**
- `academicYear` (optional): Filter by academic year

**Response:**
```json
{
  "student": {
    "id": "student-id",
    "name": "John Doe",
    "admissionNumber": "ADM001",
    "class": "Form 4A"
  },
  "pathway": {
    "id": "pathway-id",
    "code": "STEM",
    "name": "Science, Technology, Engineering, Mathematics",
    "type": "marks-based"
  },
  "enrollmentInfo": {
    "totalEnrolledSubjects": 8,
    "subjectsWithPerformance": 8,
    "totalPerformanceRecords": 32
  },
  "overallProgress": {
    "averageScore": 85.5,
    "highestScore": 98,
    "lowestScore": 78,
    "gradeDistribution": {
      "A": 18,
      "B": 12,
      "C": 2
    },
    "completionRate": 100
  },
  "subjectProgress": [
    {
      "subjectId": "subject-id",
      "subjectName": "Mathematics",
      "subjectCode": "MTH",
      "recordCount": 4,
      "averageScore": 92.5,
      "highestScore": 98,
      "lowestScore": 87,
      "gradeDistribution": {
        "A": 4
      }
    },
    {
      "subjectId": "subject-id",
      "subjectName": "Physics",
      "subjectCode": "PHY",
      "recordCount": 4,
      "averageScore": 85.0,
      "highestScore": 90,
      "lowestScore": 80,
      "gradeDistribution": {
        "A": 3,
        "B": 1
      }
    },
    ...
  ],
  "generatedDate": "2024-06-03T10:30:00Z"
}
```

---

## Report Metrics Explained

### Student-Level Metrics

| Metric | Description |
|--------|-------------|
| `enrolledSubjects` | Total subjects the student is enrolled in for the pathway |
| `performanceRecords` | Number of performance entries (exam results) |
| `completionRate` | Percentage of enrolled subjects with performance data |
| `averageScore` | Mean of all performance scores |
| `highestScore` | Best score across all subjects |
| `lowestScore` | Lowest score across all subjects |
| `gradeDistribution` | Count of each grade received |

### Pathway-Level Statistics

| Metric | Description |
|--------|-------------|
| `totalStudents` | Number of students in the pathway |
| `averageCompletionRate` | Average completion rate across all students |
| `averageScore` | Mean performance score for the pathway |
| `highPerformers` | Students with average score ≥ 80 |
| `averagePerformers` | Students with average score 60-79 |
| `needsSupport` | Students with average score < 60 |

### Class-Level Statistics

| Metric | Description |
|--------|-------------|
| `totalClassStudents` | All students in the class |
| `studentsWithPerformance` | Students who have at least one performance record |
| `totalPathways` | Number of pathways with students in the class |

---

## Usage Examples

### Example 1: Get All Pathways Report for a Class

```bash
GET /api/reports/pathway/report?classId=classId123&academicYear=2024&term=Term%201

Response: {
  "filters": {
    "pathwayId": "all",
    "classId": "classId123",
    "academicYear": "2024",
    "term": "Term 1"
  },
  "totalPathways": 5,
  "data": [
    { "pathway": {...}, "statistics": {...}, "students": [...] },
    ...
  ]
}
```

### Example 2: Get Specific Pathway Report

```bash
GET /api/reports/pathway/report?pathwayId=pathwayId123&academicYear=2024

Response: {
  "filters": {
    "pathwayId": "pathwayId123",
    "classId": "all",
    "academicYear": "2024",
    "term": "all"
  },
  "totalPathways": 1,
  "data": [
    { 
      "pathway": {
        "code": "STEM",
        "name": "Science, Technology, Engineering, Mathematics",
        ...
      },
      "statistics": {...},
      "students": [...]
    }
  ]
}
```

### Example 3: Get Class-Level Pathway Distribution

```bash
GET /api/reports/pathway/class/classId123?academicYear=2024&term=Term%201

Response: {
  "class": {
    "name": "Form 4",
    "section": "A",
    "academicYear": "2024"
  },
  "totalPathways": 5,
  "totalClassStudents": 60,
  "studentsWithPerformance": 55,
  "data": [
    { "pathway": {...}, "statistics": {...}, "students": [...] },
    ...
  ]
}
```

### Example 4: Get Student Pathway Progress

```bash
GET /api/reports/pathway/student/studentId123/pathwayId456?academicYear=2024

Response: {
  "student": {
    "name": "John Doe",
    "admissionNumber": "ADM001",
    "class": "Form 4A"
  },
  "pathway": {
    "code": "STEM",
    "name": "Science, Technology, Engineering, Mathematics"
  },
  "overallProgress": {
    "averageScore": 85.5,
    "completionRate": 100,
    ...
  },
  "subjectProgress": [
    {
      "subjectName": "Mathematics",
      "averageScore": 92.5,
      ...
    },
    ...
  ]
}
```

---

## Frontend Integration Examples

### Example 1: Display All Pathway Groups in a Class

```typescript
async getClassPathwayReport() {
  const response = await this.http.get(
    `/api/reports/pathway/class/${this.selectedClassId}`,
    {
      params: {
        academicYear: '2024',
        term: 'Term 1'
      }
    }
  ).toPromise();

  // response.data contains array of pathways with their students
  this.pathwayGroups = response.data;
  this.totalClassStudents = response.totalClassStudents;
}
```

### Example 2: Display Pathway Performance Comparison

```typescript
async getPathwayReport() {
  const response = await this.http.get(
    `/api/reports/pathway/report`,
    {
      params: {
        classId: this.selectedClassId,
        academicYear: '2024',
        limit: 10,
        page: this.currentPage
      }
    }
  ).toPromise();

  // Compare pathway statistics
  response.data.forEach(pathwayGroup => {
    console.log(`${pathwayGroup.pathway.name}: ${pathwayGroup.statistics.averageScore}`);
  });
}
```

### Example 3: Student Performance Dashboard

```typescript
async getStudentProgress() {
  const response = await this.http.get(
    `/api/reports/pathway/student/${studentId}/${pathwayId}`,
    {
      params: {
        academicYear: '2024'
      }
    }
  ).toPromise();

  // Display subject-wise progress
  response.subjectProgress.forEach(subject => {
    console.log(`${subject.subjectName}: ${subject.averageScore}`);
  });

  // Show overall completion rate
  console.log(`Completion: ${response.overallProgress.completionRate}%`);
}
```

---

## Report Generation Flow

1. **Select Filters** → Choose pathway, class, academic year, term
2. **Generate Report** → Call appropriate endpoint
3. **Process Data** → System aggregates:
   - Student performance records
   - Subject enrollments
   - Grades and marks
   - Pathway assignments
4. **Calculate Metrics** → Compute averages, completion rates, distributions
5. **Group & Display** → Organize by pathway and class
6. **Present Results** → Show statistics and student details

---

## Performance Considerations

- Reports are generated on-demand (not pre-cached)
- Use `limit` and `page` parameters for large datasets
- Filter by specific pathway or class to reduce data volume
- Academic year and term filters can significantly improve performance
- For large classes (>500 students), consider paginating the results

---

## Access Control

All pathway report endpoints require authentication and specific roles:
- `Admin` - Full access to all reports
- `SuperAdmin` - Full access to all reports
- `Teacher` - Access to class and pathway reports for their students
- Students/Parents - Can only access their own progress reports (future enhancement)

---

## Report Data Structure Summary

### Pathway Report Response
- Contains array of pathway groups
- Each pathway has: details, statistics, and student list
- Statistics include averages, performance categories, and trends
- Student list has individual metrics and subject breakdown

### Class Report Response
- Shows all pathways within a class
- Aggregates students by pathway
- Provides class-level statistics
- Useful for class-based analysis and monitoring

### Student Progress Response
- Detailed view of individual student
- Subject-wise breakdown of performance
- Overall completion metrics
- Grade distribution and trends

---

## Best Practices

1. ✅ **Filter by class** to get class-specific insights
2. ✅ **Use academic year and term** to narrow time range
3. ✅ **Paginate large datasets** using limit and page
4. ✅ **Use student progress** for individual consultations
5. ✅ **Use class reports** for class meetings and monitoring
6. ✅ **Use pathway reports** for curriculum planning
7. ✅ **Check completion rates** before assigning pathways
8. ✅ **Monitor "needsSupport"** students for interventions

---

## Troubleshooting

### Issue: No students appearing in pathway report
**Solution**: Verify:
1. Students have performance records in the specified term
2. Class filter matches student enrollment
3. Academic year matches student enrollment year

### Issue: High "needsSupport" count
**Solution**:
1. Check if marks are entered correctly
2. Verify grading scale is properly configured
3. Consider additional support programs

### Issue: Incomplete performance data
**Solution**:
1. Ensure all exams have been marked
2. Verify all students have records for the term
3. Use completion rate metrics to identify gaps

