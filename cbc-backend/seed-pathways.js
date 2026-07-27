const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/CBE-pathway';

async function seedPathwayAssignments() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection;
    const studentsCollection = db.collection('students');
    const pathwaysCollection = db.collection('pathways');
    const studentPathwaysCollection = db.collection('studentpathways');

    // Get all students
    const students = await studentsCollection.find({}).toArray();
    console.log(`Found ${students.length} students`);

    // Get all pathways
    const pathways = await pathwaysCollection.find({ isDeleted: false }).toArray();
    console.log(`Found ${pathways.length} pathways`);

    if (students.length === 0 || pathways.length === 0) {
      console.log('No students or pathways found. Cannot create assignments.');
      await db.close();
      return;
    }

    // Create student-pathway assignments
    const assignments = [];
    const now = new Date();

    // Assign students to pathways based on their index
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const pathwayIndex = i % pathways.length; // Distribute students across pathways
      const pathway = pathways[pathwayIndex];

      // Check if assignment already exists
      const existing = await studentPathwaysCollection.findOne({
        studentId: new mongoose.Types.ObjectId(student._id),
        pathwayId: new mongoose.Types.ObjectId(pathway._id),
        isDeleted: false,
      });

      if (!existing) {
        assignments.push({
          studentId: new mongoose.Types.ObjectId(student._id),
          pathwayId: new mongoose.Types.ObjectId(pathway._id),
          selectedDate: now,
          status: 'active', // Set as active for demo
          approvalDate: now,
          notes: `Student assigned to ${pathway.name} pathway`,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        });

        console.log(`Assigned ${student.firstName} ${student.lastName} to ${pathway.name}`);
      }
    }

    if (assignments.length > 0) {
      const result = await studentPathwaysCollection.insertMany(assignments);
      console.log(`✅ Created ${result.insertedCount} student-pathway assignments`);
    } else {
      console.log('All assignments already exist.');
    }

    await db.close();
    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedPathwayAssignments();
