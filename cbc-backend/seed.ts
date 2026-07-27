/**
 * Seed script for initial CBE pathway and subject data.
 * Run with: pnpm seed
 */

import { hash } from 'bcryptjs';
import { connect, connection, ObjectId } from 'mongoose';
import { Role } from './src/auth/roles.enum';

type PathwayDocument = {
  code: string;
  name: string;
  description: string;
  careerPaths: string[];
  requiredCompetencies: string[];
  minimumGPA: number;
  requiredSubjects: any[];
  isActive: boolean;
};

type ClassSeed = {
  name: string;
  section?: string;
  academicYear: string;
};

type SubjectSeed = {
  name: string;
  code: string;
};

const PATHWAYS_DATA: PathwayDocument[] = [
  {
    code: 'STEM',
    name: 'Science Technology Engineering Mathematics',
    description:
      'A comprehensive pathway focusing on scientific and technical disciplines. Students develop skills in mathematics, physics, chemistry, and technology to prepare for careers in engineering, science, and technology sectors.',
    careerPaths: ['Software Engineer', 'Data Scientist', 'Civil Engineer', 'Research Scientist'],
    requiredCompetencies: ['Problem Solving', 'Critical Thinking', 'Mathematical Reasoning', 'Technical Skills', 'Research Methodology'],
    minimumGPA: 3.0,
    requiredSubjects: [],
    isActive: true,
  },
  {
    code: 'ARTS',
    name: 'Arts and Humanities',
    description:
      'A pathway dedicated to the study of human culture, history, literature, and languages. Students develop communication, analytical, and creative skills to pursue careers in education, writing, and cultural sectors.',
    careerPaths: ['Teacher', 'Author', 'Journalist', 'Historian', 'Cultural Analyst'],
    requiredCompetencies: ['Communication', 'Critical Analysis', 'Creativity', 'Research Skills', 'Writing'],
    minimumGPA: 2.5,
    requiredSubjects: [],
    isActive: true,
  },
  {
    code: 'SOCSCI',
    name: 'Social Sciences',
    description:
      'An interdisciplinary pathway studying human society, economics, politics, and psychology. Students gain insights into social structures and human behavior to pursue careers in business, government, and social services.',
    careerPaths: ['Economist', 'Psychologist', 'Policy Analyst', 'Social Worker', 'Business Analyst'],
    requiredCompetencies: ['Data Analysis', 'Research', 'Communication', 'Critical Thinking', 'Human Understanding'],
    minimumGPA: 2.5,
    requiredSubjects: [],
    isActive: true,
  },
  {
    code: 'SPORTS',
    name: 'Sports Science',
    description:
      'A specialized pathway combining physical education with scientific principles. Students study human physiology, sports psychology, and athletic development to prepare for careers in sports management, coaching, and fitness.',
    careerPaths: ['Sports Coach', 'Fitness Trainer', 'Sports Manager', 'Athletic Director', 'Physiotherapist'],
    requiredCompetencies: ['Physical Fitness', 'Leadership', 'Motivation', 'Team Management', 'Health Knowledge'],
    minimumGPA: 2.0,
    requiredSubjects: [],
    isActive: true,
  },
];

const CLASS_SEEDS: ClassSeed[] = [
  { name: 'Grade 1', academicYear: '2026' },
  { name: 'Grade 2', academicYear: '2026' },
  { name: 'Grade 3', academicYear: '2026' },
  { name: 'Grade 4', academicYear: '2026' },
  { name: 'Grade 5', academicYear: '2026' },
  { name: 'Grade 6', academicYear: '2026' },
  { name: 'Grade 7', academicYear: '2026' },
  { name: 'Grade 8', academicYear: '2026' },
  { name: 'Grade 9', academicYear: '2026' },
  { name: 'Form 1', academicYear: '2026' },
  { name: 'Form 2', academicYear: '2026' },
  { name: 'Form 3', academicYear: '2026' },
  { name: 'Form 4', academicYear: '2026' },
];

const LOWER_PRIMARY_SUBJECTS: SubjectSeed[] = [
  { name: 'English', code: 'ENG' },
  { name: 'Kiswahili', code: 'KIS' },
  { name: 'Mathematics', code: 'MATH' },
  { name: 'Environmental Activities', code: 'ENV' },
  { name: 'Creative Arts', code: 'ART' },
  { name: 'Religious Education', code: 'REL' },
  { name: 'Physical and Health Education', code: 'PHE' },
  { name: 'ICT', code: 'ICT' },
];

const UPPER_PRIMARY_SUBJECTS: SubjectSeed[] = [
  { name: 'English', code: 'ENG' },
  { name: 'Kiswahili', code: 'KIS' },
  { name: 'Mathematics', code: 'MATH' },
  { name: 'Science and Technology', code: 'SCI' },
  { name: 'Social Studies', code: 'SOC' },
  { name: 'Religious Education', code: 'REL' },
  { name: 'Creative Arts', code: 'ART' },
  { name: 'Physical and Health Education', code: 'PHE' },
  { name: 'ICT', code: 'ICT' },
  { name: 'Agriculture', code: 'AGR' },
];

const JUNIOR_SECONDARY_SUBJECTS: SubjectSeed[] = [
  { name: 'English', code: 'ENG' },
  { name: 'Kiswahili', code: 'KIS' },
  { name: 'Mathematics', code: 'MATH' },
  { name: 'Integrated Science', code: 'SCI' },
  { name: 'Health Education', code: 'HEA' },
  { name: 'Pre-Technical Studies', code: 'PTS' },
  { name: 'Social Studies', code: 'SOC' },
  { name: 'Business Studies', code: 'BUS' },
  { name: 'Agriculture and Nutrition', code: 'AGR' },
  { name: 'Computer Science', code: 'CSC' },
  { name: 'Creative Arts', code: 'ART' },
  { name: 'Physical Education', code: 'PHE' },
  { name: 'Religious Education', code: 'REL' },
];

const SECONDARY_SUBJECTS: SubjectSeed[] = [
  { name: 'English', code: 'ENG' },
  { name: 'Kiswahili', code: 'KIS' },
  { name: 'Mathematics', code: 'MATH' },
  { name: 'Biology', code: 'BIO' },
  { name: 'Chemistry', code: 'CHE' },
  { name: 'Physics', code: 'PHY' },
  { name: 'Geography', code: 'GEO' },
  { name: 'History and Government', code: 'HIS' },
  { name: 'CRE', code: 'CRE' },
  { name: 'Business Studies', code: 'BUS' },
  { name: 'Computer Studies', code: 'CSC' },
  { name: 'Agriculture', code: 'AGR' },
  { name: 'Home Science', code: 'HSC' },
  { name: 'Art and Design', code: 'ART' },
  { name: 'Music', code: 'MUS' },
  { name: 'Physical Education', code: 'PHE' },
];

function getSubjectTemplate(className: string): SubjectSeed[] {
  const normalized = className.toLowerCase();

  if (normalized.startsWith('grade 1') || normalized.startsWith('grade 2') || normalized.startsWith('grade 3')) {
    return LOWER_PRIMARY_SUBJECTS;
  }

  if (normalized.startsWith('grade 4') || normalized.startsWith('grade 5') || normalized.startsWith('grade 6')) {
    return UPPER_PRIMARY_SUBJECTS;
  }

  if (normalized.startsWith('grade 7') || normalized.startsWith('grade 8') || normalized.startsWith('grade 9')) {
    return JUNIOR_SECONDARY_SUBJECTS;
  }

  return SECONDARY_SUBJECTS;
}

async function upsertPathways(db: any) {
  const collection = db.collection('pathways');
  const existing = await collection.countDocuments();

  if (existing > 0) {
    console.log(`⚠️  ${existing} pathways already exist in database`);
    return;
  }

  console.log('📥 Seeding pathways data...');
  const result = await collection.insertMany(PATHWAYS_DATA);
  console.log(`✅ Inserted ${result.insertedCount} pathways`);
}

async function upsertClasses(db: any): Promise<Array<{ _id: ObjectId; name: string; section?: string; academicYear: string }>> {
  const collection = db.collection('classes');
  const createdClasses: Array<{ _id: ObjectId; name: string; section?: string; academicYear: string }> = [];

  for (const classSeed of CLASS_SEEDS) {
    await collection.updateOne(
      { name: classSeed.name, section: classSeed.section ?? null, academicYear: classSeed.academicYear, isDeleted: { $ne: true } },
      {
        $setOnInsert: {
          name: classSeed.name,
          section: classSeed.section,
          academicYear: classSeed.academicYear,
          isActive: true,
          isDeleted: false,
        },
      },
      { upsert: true },
    );

    const doc = await collection.findOne({ name: classSeed.name, section: classSeed.section ?? null, academicYear: classSeed.academicYear, isDeleted: { $ne: true } });
    if (doc) {
      createdClasses.push({ _id: doc._id, name: doc.name, section: doc.section, academicYear: doc.academicYear });
    }
  }

  return createdClasses;
}

async function upsertSubjects(db: any, classes: Array<{ _id: ObjectId; name: string; section?: string; academicYear: string }>) {
  const collection = db.collection('subjects');
  let inserted = 0;

  for (const classDoc of classes) {
    const subjectSeeds = getSubjectTemplate(classDoc.name);

    for (const subjectSeed of subjectSeeds) {
      const result = await collection.updateOne(
        { classId: classDoc._id, code: subjectSeed.code, isDeleted: { $ne: true } },
        {
          $setOnInsert: {
            name: subjectSeed.name,
            code: subjectSeed.code,
            classId: classDoc._id,
            teacher: null,
            isActive: true,
            isDeleted: false,
          },
        },
        { upsert: true },
      );

      if (result.upsertedCount > 0) inserted += 1;
    }
  }

  console.log(`✅ Upserted ${inserted} subject records`);
}

async function upsertDefaultUser(db: any) {
  const collection = db.collection('users');
  const email = 'admin@cbc.com';
  const password = 'Admin@123';
  const hashedPassword = await hash(password, 10);

  const result = await collection.updateOne(
    { email },
    {
      $set: {
        username: 'admin',
        phone_no: '0700000000',
        password: hashedPassword,
        role: Role.SuperAdmin,
        isApproved: true,
        requirePasswordChange: false,
        temporaryPassword: null,
        organizationId: null,
        branchId: null,
      },
      $setOnInsert: {
        email,
      },
    },
    { upsert: true },
  );

  if (result.upsertedCount > 0) {
    console.log(`✅ Seeded default admin user (${email})`);
  } else {
    console.log(`ℹ️ Default admin user already exists (${email})`);
  }
}

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/CBE-pathway';
    console.log(`Connecting to MongoDB: ${mongoUri}`);

    await connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = connection.db;
    if (!db) {
      throw new Error('Database connection failed');
    }

    await upsertPathways(db);
    const classes = await upsertClasses(db);
    console.log(`✅ Upserted ${classes.length} CBE classes`);
    await upsertSubjects(db, classes);
    await upsertDefaultUser(db);

    console.log('\nSeed operation completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await connection.close();
    console.log('Database connection closed');
  }
}

seedDatabase();