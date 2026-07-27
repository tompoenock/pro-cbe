/**
 * Seed script for grading templates
 * Run with: node seed-grading.js
 */

const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/CBE-pathway';

async function seedGrading() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // German Grading Scale (13-point system)
    const germanTemplate = {
      name: 'German Grade Scale (13-point)',
      isDefault: true,
      isActive: true,
      isDeleted: false,
      grades: [
        { grade: 'A', minScore: 80, maxScore: 100, points: 12, remark: 'Excellent' },
        { grade: 'A-', minScore: 75, maxScore: 79, points: 11, remark: 'Very Good' },
        { grade: 'B+', minScore: 70, maxScore: 74, points: 10, remark: 'Good' },
        { grade: 'B', minScore: 65, maxScore: 69, points: 9, remark: 'Good' },
        { grade: 'B-', minScore: 60, maxScore: 64, points: 8, remark: 'Satisfactory' },
        { grade: 'C+', minScore: 55, maxScore: 59, points: 7, remark: 'Satisfactory' },
        { grade: 'C', minScore: 50, maxScore: 54, points: 6, remark: 'Fair' },
        { grade: 'C-', minScore: 45, maxScore: 49, points: 5, remark: 'Fair' },
        { grade: 'D+', minScore: 40, maxScore: 44, points: 4, remark: 'Weak' },
        { grade: 'D', minScore: 35, maxScore: 39, points: 3, remark: 'Weak' },
        { grade: 'D-', minScore: 30, maxScore: 34, points: 2, remark: 'Poor' },
        { grade: 'E', minScore: 0, maxScore: 29, points: 1, remark: 'Poor' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Remove existing templates
    const result = await db.collection('gradingscales').deleteMany({});
    console.log(`📋 Removed ${result.deletedCount} existing grading templates`);

    // Insert German template
    const insertResult = await db.collection('gradingscales').insertOne(germanTemplate);
    console.log(`✅ Created German Grade Scale template with ID: ${insertResult.insertedId}`);
    console.log(`📌 Set as default: ${germanTemplate.isDefault}`);

    // Verify
    const verified = await db.collection('gradingscales').findOne({ isDefault: true });
    console.log(`\n✅ Verification - Default template name: ${verified?.name}`);
    console.log(`✅ Grade ranges:
  - A: 80-100 (12 pts)
  - A-: 75-79 (11 pts)  
  - B+: 70-74 (10 pts)
  - B: 65-69 (9 pts)
  - B-: 60-64 (8 pts)
  - C+: 55-59 (7 pts)
  - C: 50-54 (6 pts)
  - C-: 45-49 (5 pts)
  - D+: 40-44 (4 pts)
  - D: 35-39 (3 pts)
  - D-: 30-34 (2 pts)
  - E: 0-29 (1 pt)
    `);

    console.log('\n✅ Grading template seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding grading templates:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedGrading();
