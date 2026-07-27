import * as mongoose from 'mongoose';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/CBE-pathway';

async function seedPathwayAssignments() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db!;

    // Get all students
    const students = await (db.collection('students').find({}) as any).toArray();
    console.log(`Found ${students.length} students`);

    // Get all pathways
    const pathways = await (db.collection('pathways').find({ isDeleted: false }) as any).toArray();
    console.log(`Found ${pathways.length} pathways`);

    if (students.length === 0 || pathways.length === 0) {
      console.log('No students or pathways found. Cannot create assignments.');
      await mongoose.connection.close();
      return;
    }

    // Create student-pathway assignments
    const assignments: any[] = [];
    const now = new Date();

    // Assign students to pathways based on their index
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const pathwayIndex = i % pathways.length; // Distribute students across pathways
      const pathway = pathways[pathwayIndex];

      // Check if assignment already exists
      const existing = await (db.collection('studentpathways').findOne({
        studentId: new mongoose.Types.ObjectId(student._id),
        pathwayId: new mongoose.Types.ObjectId(pathway._id),
        isDeleted: false,
      }) as any);

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
      const result = await (db.collection('studentpathways').insertMany(assignments) as any);
      console.log(`✅ Created ${result.insertedCount} student-pathway assignments`);
    } else {
      console.log('All assignments already exist.');
    }

    await mongoose.connection.close();
    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedPathwayAssignments();
