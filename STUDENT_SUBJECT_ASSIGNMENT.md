# Student-Subject Assignment System

## 📋 Overview

A comprehensive system for managing which subjects each student takes within their assigned class. **Not all students need to take all subjects**, and admins can flexibly assign subjects to individual students or groups.

## ✨ Key Features

✅ **Per-Student Assignment** - Assign subjects individually to students  
✅ **Flexible Selection** - Students don't have to take all class subjects  
✅ **Bulk Management** - Easy subject removal if needed  
✅ **Search & Filter** - Find students quickly by name or ID  
✅ **Current Status View** - See what subjects each student is taking  
✅ **Academic Year Tracking** - Assignments tracked by year  

---

## 🏗️ Architecture

### Database Schema
```
StudentSubject Collection
├── studentId (ref: Student)
├── subjectId (ref: Subject)
├── classId (ref: Class)
├── academicYear (string)
├── enrollmentDate (Date)
├── status (active|completed|dropped)
├── isDeleted (boolean)
└── timestamps (createdAt, updatedAt)

Unique Index: { studentId, subjectId, academicYear }
```

### Data Flow
```
Classes Module
    ↓
Click "Subjects" Button
    ↓
Subject Management Modal Opens
    ↓
Select Student from Class
    ↓
View Current Subjects / Available Subjects
    ↓
Check/Uncheck Subject Checkboxes
    ↓
Click "Assign Subjects"
    ↓
POST /api/students/subjects/assign
    ↓
StudentSubject Records Created/Updated
    ↓
Success Message
```

---

## 🔌 Backend Endpoints

### 1. Assign Subjects to Student
```
POST /api/students/subjects/assign
Content-Type: application/json

Request Body:
{
  "studentId": "507f1f77bcf86cd799439011",
  "classId": "507f1f77bcf86cd799439012",
  "academicYear": "2026",
  "subjectIds": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"]
}

Response:
[
  {
    "_id": "507f1f77bcf86cd799439015",
    "studentId": "507f1f77bcf86cd799439011",
    "subjectId": "507f1f77bcf86cd799439013",
    "classId": "507f1f77bcf86cd799439012",
    "academicYear": "2026",
    "status": "active",
    "enrollmentDate": "2026-06-18T10:30:00Z"
  }
]
```

### 2. Get Student's Subjects
```
GET /api/students/{studentId}/subjects?classId={classId}&academicYear={year}

Response:
[
  {
    "_id": "507f1f77bcf86cd799439015",
    "studentId": { _id, firstName, lastName },
    "subjectId": { _id, name, code },
    "classId": "507f1f77bcf86cd799439012",
    "academicYear": "2026",
    "status": "active"
  }
]
```

### 3. Get All Class Student-Subject Assignments
```
GET /api/students/class/{classId}/subjects?academicYear={year}

Response:
[
  { studentId, subjectId, classId, academicYear, status, ... }
]
```

### 4. Query Student Subjects
```
GET /api/students/subjects/query?studentId={id}&classId={id}&academicYear={year}&status={status}

Response:
{
  "data": [ ... ],
  "total": 45
}
```

### 5. Update Subject Status
```
PUT /api/students/subjects/{studentSubjectId}/status?status=completed

Response:
{ "success": true }
```

### 6. Remove Student from Subject
```
DELETE /api/students/subjects/{studentSubjectId}

Response:
{ "success": true }
```

---

## 💻 Frontend Components

### StudentService Methods Added

```typescript
// Assign subjects to a student
assignSubjects(studentId: string, classId: string, academicYear: string, 
               subjectIds: string[]): Observable<any>

// Get student's enrolled subjects
getStudentSubjects(studentId: string, classId: string, academicYear: string): Observable<any[]>

// Get all student-subject enrollments for a class
getClassStudentSubjects(classId: string, academicYear: string): Observable<any[]>

// Query with filters
queryStudentSubjects(filters: any): Observable<any>

// Remove student from subject
removeFromSubject(studentSubjectId: string): Observable<any>

// Update enrollment status
updateSubjectStatus(studentSubjectId: string, status: string): Observable<any>
```

### Classes Component Features

**New Properties:**
```typescript
showSubjectModal = false;
selectedClass: any = null;
classStudents: any[] = [];
allSubjects: any[] = [];
selectedStudent: any = null;
studentSubjects: any[] = [];
selectedSubjectIds: string[] = [];
assigningSubjects = false;
studentSearchText = '';
filteredStudents: any[] = [];
```

**New Methods:**
```typescript
// Modal Management
openSubjectModal(cls: any)        // Open assignment modal
closeSubjectModal()               // Close modal

// Data Loading
loadClassStudents()               // Load students in class
loadAllSubjects()                 // Load all available subjects

// Student Selection
searchStudents()                  // Filter students by search text
selectStudent(student: any)       // Select & load their subjects

// Subject Management
toggleSubject(subjectId: string)  // Toggle checkbox
isSubjectAssigned(subjectId: string): boolean
assignSubjectsToStudent()         // Save assignments
removeFromSubject(studentSubject: any)  // Remove from subject
```

**Updated Methods:**
```typescript
getClassActions()  // Now includes 'custom' action for "Subjects"
onClassAction()    // Handles new 'custom' action type
```

---

## 🎨 UI/UX Details

### Subject Management Modal

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Manage Student Subjects - Form 2N              [×]     │
├─────────────────────────────────────────────────────────┤
│ Select Student        │  Subject Selection             │
├───────────────────────┼────────────────────────────────┤
│ [Search box]          │ Current Subjects (if any)      │
│                       │ [Subject] [Remove] [Remove]    │
│ [Student List]        │                                │
│ • John Doe            │ Available Subjects             │
│   ADM-001             │ ☑ Mathematics                  │
│ • Jane Smith          │ ☐ English                      │
│   ADM-002 (selected)  │ ☑ Biology                      │
│ • ...                 │ ☐ Chemistry                    │
│                       │                                │
│                       │ Selected: 2                    │
│                       │              [Assign Subjects] │
└─────────────────────────────────────────────────────────┘
```

**Colors:**
- Selected subject: Purple/Blue background
- Available: Light gray/slate background
- Current subjects: Can remove with red button
- Buttons: Purple for custom actions

**Responsive:**
- On desktop: 3-column grid (1/3 search, 2/3 subjects)
- On tablet: Stacked layout
- Max modal width: 64rem (900px)

---

## 📊 Usage Example

### Scenario: Assign Subjects to Students in Form 2N

1. **Navigate to Classes**
   - Click "Classes" in sidebar
   - See list of classes

2. **Open Subject Management**
   - Find "Form 2N" class
   - Click "Subjects" button (purple text)
   - Modal opens with students and subjects

3. **Select a Student**
   - Search: Type "John" to find John Doe
   - Click "John Doe (ADM-001)"
   - His current subjects appear (if any)
   - Available subjects below

4. **Assign Subjects**
   - Check "Mathematics" ☑
   - Check "Biology" ☑
   - Leave "Chemistry" unchecked ☐
   - Click "Assign Subjects"
   - Success message: "Assigned 2 subject(s) to John Doe"

5. **Remove Subjects**
   - Student's current subjects show at top
   - Click "Remove" button next to a subject
   - Subject removed, counts update

6. **Move to Next Student**
   - Search and select another student
   - Repeat process
   - Current subjects auto-load

---

## 🔄 Data Consistency

### Unique Constraints
- Only ONE enrollment per: `{studentId, subjectId, academicYear}`
- Duplicate assignments overwrite previous selection
- Soft deletes (isDeleted = true) preserve history

### Cascading
- When assigning new subjects, old assignments deleted first
- Ensures clean state per academic year
- Prevents duplicate performance records

### Validation
- Student must exist and not be deleted
- Subject must exist and not be deleted
- Class must exist
- Academic year must be valid

---

## 🧪 Testing Checklist

### Backend Endpoints
- [ ] GET `/api/students/by-class/{classId}` returns students
- [ ] GET `/api/subjects` returns all subjects
- [ ] POST `/api/students/subjects/assign` creates enrollments
- [ ] GET `/api/students/{id}/subjects?classId=...&year=...` returns subjects
- [ ] DELETE `/api/students/subjects/{id}` removes enrollment

### Frontend Functionality
- [ ] Classes page loads with "Subjects" button
- [ ] Click "Subjects" opens modal
- [ ] Search filters students correctly
- [ ] Clicking student loads their subjects
- [ ] Checkboxes toggle correctly
- [ ] "Assign Subjects" button works
- [ ] Success message appears
- [ ] Remove button deletes from subject
- [ ] Modal closes properly
- [ ] Dark mode styling works

### Data Integrity
- [ ] StudentSubject records created
- [ ] studentId, subjectId, classId populated
- [ ] academicYear set correctly
- [ ] status = 'active'
- [ ] enrollmentDate set to now()
- [ ] isDeleted = false

### Performance
- [ ] Students list loads < 2 seconds
- [ ] Subjects list loads < 1 second
- [ ] Assigning subjects < 1 second
- [ ] Search filters instantly
- [ ] Remove subject < 1 second

---

## 🚀 Future Enhancements

1. **Bulk Assign** - Select multiple students at once
2. **Templates** - Save common subject combinations
3. **Validation Rules** - Ensure required subjects selected
4. **Reports** - Subject enrollment reports
5. **Approval Workflow** - Teachers approve assignments
6. **Notifications** - Alert when subjects assigned

---

## 📝 Notes

- Students can be assigned to 0-N subjects (no minimum)
- Assignments are independent per academic year
- Removing a student from subject soft-deletes enrollment
- Performance records tied to subject-student pair
- POINTSS calculated from assigned subjects only

