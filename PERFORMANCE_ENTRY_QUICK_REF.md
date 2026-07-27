# Performance Entry - Quick Reference

## Three Modes Overview

| Mode | Purpose | When to Use |
|------|---------|-----------|
| **View Records** | Review & audit entries | Checking historical data, quality assurance |
| **Bulk Entry** | Enter marks for multiple students | Regular marks entry day, exam marking |
| **Overall Results** | Summary & analytics | Class meetings, progress monitoring, intervention planning |

---

## Bulk Entry Mode - Step by Step

### 1. Select Class
- Click dropdown, choose class (e.g., "Form 4A")
- → System loads all subjects for that class

### 2. Select Subject  
- Click subject dropdown
- → Only appears subjects available in selected class
- → System loads students taking that subject
- → Pre-fills any existing scores

### 3. Enter Marks
- Click score input field for each student
- Type mark (0-100)
- → Grade updates instantly
  - **A** (Green): 90-100
  - **B** (Green): 80-89
  - **C** (Yellow): 70-79
  - **D** (Yellow): 60-69
  - **E** (Red): 0-59

### 4. Review Before Saving
- Check all marks are entered
- Verify grades are correct
- Scan for any missing entries

### 5. Save All Scores
- Click "Save All Scores" button
- → Shows "Saving..." while processing
- → Success message: "Saved! X created, Y updated"

---

## Overall Results Mode - Step by Step

### 1. Select Filters
- **Class**: Required - choose the class
- **Academic Year**: Leave as current or change (default: 2024)
- **Term**: Leave as current or change (default: Term 1)

### 2. Click "Overall Results" Tab
- → System loads all performance data
- → Displays class summary cards

### 3. Read Class Summary Cards
```
┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  ┌──────────────┐
│   Total     │  │ Avg Class    │  │ High Performers │  │ Needs Support│
│  Students   │  │   Score      │  │ (≥80)           │  │   (<60)      │
│     45      │  │    78.3      │  │       18        │  │       7      │
└─────────────┘  └──────────────┘  └─────────────────┘  └──────────────┘
```

**What it means**:
- **Total Students**: All students in class
- **Avg Score**: Average of all student averages
- **High Performers**: Students doing well (potential for advanced stream)
- **Needs Support**: Students struggling (intervention needed)

### 4. Review Student Results Table
```
| Student Name | Adm No | Avg Score | Grade | Subjects | List | Status |
```

**Columns**:
- **Student Name**: Full name
- **Adm No**: Admission number
- **Avg Score**: Average across all enrolled subjects (0-100)
- **Grade**: Overall grade (A-E)
- **Subjects**: Number of subjects enrolled
- **List**: First 3 subject names
- **Status**: Excellent / Good / Needs Support

### 5. Expand Student for Details
- Click any student row to expand
- Shows all subjects with:
  - Subject name
  - Score in that subject
  - Grade in that subject

### 6. Identify Action Items
- **Excellent (≥80)**: Monitor, consider advanced track
- **Good (60-79)**: Continue regular support
- **Needs Support (<60)**: Plan intervention

---

## Subject Filtering Feature

### Why Filter by Subject?

Instead of scrolling through all students, select the specific subject:

**❌ WITHOUT Filter**:
- Shows 45 students (all in class)
- Scroll to find the 8 taking Math
- Confusing, error-prone

**✅ WITH Filter**:
- Shows only 8 students taking Math
- Focused, efficient entry
- Easier to verify

### How It Works

1. Select Class → "Form 4A"
2. Select Subject → "Mathematics"
   - → Only shows 8 students taking Math
   - → Shows their current scores (if any)
3. Enter marks for these 8 students
4. Save

---

## Grade Scale

| Grade | Range | Color | Interpretation |
|-------|-------|-------|-----------------|
| **A** | 90-100 | 🟢 Green | Excellent - Top performer |
| **B** | 80-89 | 🟢 Green | Good - Above average |
| **C** | 70-79 | 🟡 Yellow | Satisfactory - Average |
| **D** | 60-69 | 🟡 Yellow | Adequate - Below average |
| **E** | 0-59 | 🔴 Red | Poor - Struggling |

---

## Common Tasks

### Task 1: Enter Marks for English - Form 4A
```
1. Click "Bulk Entry" tab
2. Select Class: "Form 4A"
3. Select Subject: "English"
4. Enter scores for each student
5. Review grades
6. Click "Save All Scores"
```

### Task 2: Check Overall Class Performance
```
1. Click "Overall Results" tab
2. Class: "Form 4A", Year: "2024", Term: "Term 1"
3. Check class summary cards
4. Look at "Needs Support" count
5. Click those students to see weak areas
```

### Task 3: Identify Students Struggling in Math
```
1. Go to "Overall Results"
2. Look at "Needs Support" students
3. Expand each row
4. Find which have low Math scores
5. Plan tutoring intervention
```

### Task 4: Monitor High Performers
```
1. Go to "Overall Results"
2. Note "High Performers" count
3. Expand those students
4. Verify consistent A/B grades
5. Consider advanced pathways
```

---

## Tips & Tricks

✅ **Do**:
- Use Bulk Entry for fast marks input
- Use Overall Results for monitoring
- Filter by subject to reduce clutter
- Review class stats before parent meetings
- Focus on "Needs Support" category

❌ **Don't**:
- Enter all class students when you only need one subject
- Save without reviewing grades
- Skip dark mode if your eyes prefer it (toggle in settings)
- Forget to check pre-filled scores (might be old)

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save marks | Click button (no shortcut yet) |
| Next student | Tab key |
| Previous student | Shift + Tab |
| Toggle mode | Click tab buttons |

---

## Error Messages

### "Select a class and subject"
- **Cause**: Tried to save without choosing class/subject
- **Fix**: Select both before saving

### "Select a class"
- **Cause**: Tried to view results without class
- **Fix**: Choose class in dropdown

### "Enter at least one score"
- **Cause**: No marks entered in any field
- **Fix**: Enter at least one mark before saving

### No students showing in Bulk Entry
- **Cause**: No students in class, or no students taking selected subject
- **Fix**: Verify class has students and they're enrolled in subject

---

## FAQ

**Q: Why don't all class students show in Bulk Entry?**
A: When you select a subject, only students taking that subject appear (saves time, reduces errors)

**Q: Can I edit the grade?**
A: No, grades calculate automatically from marks (0-59=E, 60-69=D, etc.)

**Q: Where does it show which student is failing?**
A: In Overall Results mode, "Needs Support" category shows students with average <60

**Q: Can I see a student's subject breakdown?**
A: Yes! In Overall Results, click on any student row to expand and see all their subjects

**Q: How do I see trends over time?**
A: Run the "Overall Results" report for different terms to compare progress

**Q: Can I export the data?**
A: Currently exports via browser print/PDF. Full export coming soon.

**Q: What's the difference between "Bulk Entry" and "View Records"?**
A: Bulk Entry = input new marks fast. View Records = review/audit what was entered

**Q: Why is "Overall Results" separate mode?**
A: Different purpose - bulk entry is for data input, overall results are for analysis

---

## Workflow Diagram

```
DAILY MARKS ENTRY
│
├─→ Click "Bulk Entry"
│   ├─→ Select Class
│   ├─→ Select Subject
│   ├─→ Enter Marks (shows only students in that subject)
│   ├─→ Review Grades (auto-calculated)
│   └─→ Save All Scores
│       └─→ Marks saved, auto-grading applied
│
WEEKLY PROGRESS CHECK
│
└─→ Click "Overall Results"
    ├─→ Select Filters
    ├─→ Review Class Stats Cards
    ├─→ Scan Student Table
    ├─→ Expand students needing support
    └─→ Plan interventions
```

---

## Performance Tips

1. **Bulk Entry**
   - Filter by subject reduces students shown
   - Pre-filled scores save time
   - Real-time grade calculation prevents errors

2. **Overall Results**
   - Single class load reduces processing time
   - Client-side aggregation = instant updates
   - Summary cards give quick insights

3. **Dark Mode**
   - Easier on eyes for extended work
   - Toggle anytime in settings
   - Applied to all tables and inputs

---

## Integration Checklist

- [ ] Frontend component loads (no errors)
- [ ] StudentService has `getByClassAndSubject` method
- [ ] Backend endpoint `/students/class/:classId/subject/:subjectId` works
- [ ] Bulk Entry filters by subject correctly
- [ ] Grades calculate real-time as marks entered
- [ ] Save bulk scores creates/updates records
- [ ] Overall Results loads class data
- [ ] Class statistics calculate correctly
- [ ] Student table displays properly
- [ ] Expand student shows subject breakdown
- [ ] Dark mode toggles properly
- [ ] Mobile responsive (if needed)

---

## Support & Troubleshooting

### Marks won't save?
1. Check if subject is selected
2. Verify at least one mark is entered
3. Check browser console for errors
4. Try refreshing page

### Students not showing?
1. Verify class has students
2. Check students are enrolled in subject
3. Try selecting class again
4. Check StudentSubject records in database

### Grades not calculating?
1. Ensure you're entering numbers (0-100)
2. Try refreshing page
3. Check if feature needs rebuild

### Overall Results not loading?
1. Verify class selected
2. Check database has performance data
3. Try selecting different term/year

---

## Related Documentation

- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Technical details
- [PERFORMANCE_ENTRY_IMPROVEMENTS.md](./PERFORMANCE_ENTRY_IMPROVEMENTS.md) - Feature overview
- [QUICK_START.md](./QUICK_START.md) - System setup

