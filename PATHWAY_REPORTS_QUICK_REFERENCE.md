# Pathway Reports - Quick Reference

## Endpoints Overview

### 1. Pathway Report (Grouped by Pathway)
```
GET /api/reports/pathway/report
```
Shows all pathways with their students and progress metrics. Can be filtered by:
- `pathwayId` - Single pathway only
- `classId` - Specific class only
- `academicYear` - Academic year
- `term` - Term (Term 1, Term 2, Term 3)

**Best For**: Cross-class pathway analysis, pathway performance comparison

---

### 2. Class Pathway Report
```
GET /api/reports/pathway/class/:classId
```
Shows all pathways within a specific class with students grouped by pathway.

**Query Parameters**:
- `academicYear` - Filter by year
- `term` - Filter by term

**Best For**: Class-level monitoring, class meetings, understanding class composition

---

### 3. Student Pathway Progress
```
GET /api/reports/pathway/student/:studentId/:pathwayId
```
Detailed progress for one student in one pathway. Shows:
- Subject-wise performance
- Overall statistics
- Grade distribution
- Completion rates

**Query Parameters**:
- `academicYear` - Filter by year

**Best For**: Individual consultations, parent meetings, progress tracking

---

## Quick Usage Examples

### Example 1: Generate Class Report
```bash
# Get all pathways in Form 4A for Term 1, 2024
curl "http://localhost:3000/api/reports/pathway/class/classId123?academicYear=2024&term=Term%201"
```

### Example 2: Compare Pathways Performance
```bash
# Get STEM pathway report across all classes
curl "http://localhost:3000/api/reports/pathway/report?pathwayId=stemPathwayId&academicYear=2024"
```

### Example 3: Student Individual Report
```bash
# Get John's progress in STEM pathway
curl "http://localhost:3000/api/reports/pathway/student/studentId123/pathwayId456?academicYear=2024"
```

### Example 4: Class with Pagination
```bash
# Get class report page 2 with 25 records per page
curl "http://localhost:3000/api/reports/pathway/class/classId123?academicYear=2024&limit=25&page=2"
```

---

## Report Data at a Glance

### Pathway Group Report Shows:
- **Pathway Info**: code, name, type (marks-based/subject-based)
- **Statistics**: avg score, completion rate, performance categories
- **Students**: individual metrics, scores, grades, subjects enrolled

### Class Pathway Report Shows:
- **Class Info**: name, section, academic year
- **Pathways**: all pathways with students in the class
- **Student Count**: total class students vs. those with performance data

### Student Progress Shows:
- **Student Info**: name, admission number, class
- **Overall Progress**: average score, completion rate, grade distribution
- **Subject Breakdown**: performance per subject, trends

---

## Key Metrics Explained

| Metric | Range | What It Means |
|--------|-------|---------------|
| **Completion Rate** | 0-100% | % of enrolled subjects with marks |
| **Average Score** | 0-100 | Mean of all performance scores |
| **High Performers** | Count | Students with avg score ≥ 80 |
| **Needs Support** | Count | Students with avg score < 60 |

---

## Frontend Integration Pattern

```typescript
// 1. Get class pathway report
async loadClassReport() {
  const response = await api.get(`/api/reports/pathway/class/${classId}`, {
    params: { academicYear, term }
  });
  return response.data;
}

// 2. Process pathway groups
displayPathwayGroups(report) {
  report.data.forEach(pathwayGroup => {
    // Show pathway name and stats
    // List students in pathway
    // Display individual student progress
  });
}

// 3. Show student detail on click
async showStudentProgress(studentId, pathwayId) {
  const response = await api.get(
    `/api/reports/pathway/student/${studentId}/${pathwayId}`
  );
  return response.data;
}
```

---

## Common Queries

### "How many students in STEM pathway?"
```
GET /api/reports/pathway/report?pathwayId=stemId
→ Look at statistics.totalStudents
```

### "What's the average score in this class?"
```
GET /api/reports/pathway/class/classId
→ Average all pathway statistics.averageScore
```

### "Is student X progressing in their pathway?"
```
GET /api/reports/pathway/student/studentId/pathwayId
→ Check overallProgress.completionRate and averageScore
```

### "Which students need support in this pathway?"
```
GET /api/reports/pathway/report?pathwayId=id
→ Filter students with averageScore < 60
```

### "How does this pathway compare to others?"
```
GET /api/reports/pathway/report?classId=id
→ Compare statistics.averageScore across pathways
```

---

## Performance Tips

1. **Use filters** to reduce data volume
   - Filter by classId for class-specific reports
   - Filter by pathwayId for single pathway analysis

2. **Use pagination** for large result sets
   - Default limit is 50, maximum is 100
   - Use `page` parameter to navigate

3. **Specify time range** when possible
   - Include `academicYear` parameter
   - Include `term` parameter to narrow focus

4. **Cache results** on frontend
   - Reports don't change frequently
   - Reduce API calls for same filters

---

## Response Time Guidelines

| Query Type | Expected Time | Tips |
|-----------|---------------|------|
| Single pathway | < 1s | Fast, specific |
| Class all pathways | 1-3s | Medium, broader |
| Student detail | < 1s | Fast, very specific |
| All pathways | 3-5s | Slower, broadest |

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | Invalid ID | Verify IDs are valid ObjectIds |
| 404 Not Found | Class/Pathway not found | Check ID exists in database |
| 400 Invalid filters | Wrong parameter values | Use valid academicYear/term |

---

## Tips for Best Results

✅ Always include `classId` when reporting class performance
✅ Include `academicYear` to avoid mixing years
✅ Use `term` filter to focus on current term
✅ Use pagination for large datasets (100+ students)
✅ Check `studentsWithPerformance` vs `totalClassStudents` to identify gaps
✅ Monitor students in "needsSupport" category
✅ Use completion rates to identify data entry status

❌ Don't query all pathways without filters (slow)
❌ Don't mix academic years without filtering
❌ Don't assume all students have performance records
❌ Don't use high page limits (max 100)

---

## Integration Checklist

- [ ] Setup authentication (JWT required)
- [ ] Implement pathway report component
- [ ] Implement class report component
- [ ] Implement student progress component
- [ ] Add filters (classId, academicYear, term)
- [ ] Add pagination
- [ ] Handle loading/error states
- [ ] Display statistics clearly
- [ ] Show student details
- [ ] Add sorting options
- [ ] Cache results appropriately
- [ ] Test with various data sizes

