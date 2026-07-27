import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Student, StudentDocument } from './entities/student.schema';
import { User, UserDocument } from '../auth/entities/user.schema';
import { StudentSubject, StudentSubjectDocument } from './entities/student-subject.schema';
import { Class, ClassDocument } from '../classes/entities/class.schema';
import { Subject, SubjectDocument } from '../subjects/entities/subject.schema';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { AssignSubjectsDto, BulkAssignClassStudentsDto, StudentSubjectQueryDto } from './dto/student-subject.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(StudentSubject.name) private studentSubjectModel: Model<StudentSubjectDocument>,
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateStudentDto): Promise<StudentDocument> {
    const existing = await this.studentModel.findOne({
      admissionNumber: dto.admissionNumber,
      isDeleted: false,
    } as any);
    if (existing) {
      throw new ConflictException('Student with this admission number already exists');
    }

    if (!dto.parentUserId) {
      throw new BadRequestException('Parent user account is required for a student');
    }

    if (!Types.ObjectId.isValid(dto.parentUserId)) {
      throw new BadRequestException('Invalid parent user ID');
    }

    const parent = await this.userModel.findById(dto.parentUserId).exec();
    if (!parent) {
      throw new BadRequestException('Parent user not found');
    }
    // allow either string roles or enum; ensure role name equals 'parent'
    if ((parent as any).role !== 'parent') {
      throw new BadRequestException('Provided user is not a parent');
    }

    return this.studentModel.create(dto as any);
  }

  async findByParent(parentId: string): Promise<StudentDocument[]> {
    if (!Types.ObjectId.isValid(parentId)) {
      throw new BadRequestException('Invalid parent ID');
    }

    return this.studentModel
      .find({ parentUserId: new Types.ObjectId(parentId) as any, isDeleted: false } as any)
      .populate('classId', 'name section academicYear')
      .sort({ lastName: 1, firstName: 1 })
      .exec();
  }

  async findAll(classId?: string, search?: string): Promise<StudentDocument[]> {
    const filter: any = { isDeleted: false };
    if (classId) filter.classId = classId;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { admissionNumber: { $regex: search, $options: 'i' } },
      ];
    }
    return this.studentModel.find(filter)
      .populate('classId', 'name section academicYear')
      .sort({ lastName: 1, firstName: 1 })
      .exec();
  }

  async findOne(id: string): Promise<StudentDocument> {
    const doc = await this.studentModel.findById(id)
      .populate('classId', 'name section academicYear')
      .exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Student not found');
    return doc;
  }

  async findByClass(classId: string): Promise<StudentDocument[]> {
    return this.studentModel.find({ classId, isActive: true, isDeleted: false } as any)
      .sort({ lastName: 1, firstName: 1 })
      .exec();
  }

  async update(id: string, dto: UpdateStudentDto): Promise<StudentDocument> {
    const doc = await this.studentModel.findByIdAndUpdate(id, dto, { returnDocument: 'after' })
      .populate('classId', 'name section academicYear')
      .exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Student not found');
    return doc;
  }

  async remove(id: string): Promise<void> {
    const result = await this.studentModel.findByIdAndUpdate(id, { isDeleted: true }, { returnDocument: 'after' }).exec();
    if (!result) throw new NotFoundException('Student not found');
  }

  async count(classId?: string): Promise<number> {
    const filter: any = { isDeleted: false };
    if (classId) filter.classId = classId;
    return this.studentModel.countDocuments(filter).exec();
  }

  // ===== StudentSubject Management Methods =====

  /**
   * Bulk assign students to a class
   */
  async bulkAssignStudentsToClass(dto: BulkAssignClassStudentsDto): Promise<{ assigned: number; failed: number }> {
    if (!Types.ObjectId.isValid(dto.classId)) {
      throw new BadRequestException('Invalid class ID');
    }

    // Verify class exists
    const classDoc = await this.classModel.findById(dto.classId);
    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    let assigned = 0;
    let failed = 0;

    for (const studentId of dto.studentIds) {
      try {
        if (!Types.ObjectId.isValid(studentId)) {
          failed++;
          continue;
        }

        const student = await this.studentModel.findById(studentId);
        if (!student || student.isDeleted) {
          failed++;
          continue;
        }

        // Update student's classId
        await this.studentModel.findByIdAndUpdate(studentId, {
          classId: dto.classId,
        });

        assigned++;
      } catch {
        failed++;
      }
    }

    return { assigned, failed };
  }

  /**
   * Assign subjects to a student
   */
  async assignSubjectsToStudent(dto: AssignSubjectsDto): Promise<StudentSubjectDocument[]> {
    if (!Types.ObjectId.isValid(dto.studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    if (!Types.ObjectId.isValid(dto.classId)) {
      throw new BadRequestException('Invalid class ID');
    }

    // Verify student exists
    const student = await this.studentModel.findById(dto.studentId);
    if (!student || student.isDeleted) {
      throw new NotFoundException('Student not found');
    }

    // Verify class exists
    const classDoc = await this.classModel.findById(dto.classId);
    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    // Verify all subjects exist
    const subjects = await this.subjectModel.find({
      _id: { $in: dto.subjectIds },
      isDeleted: false,
    });

    if (subjects.length !== dto.subjectIds.length) {
      throw new BadRequestException('One or more subjects not found');
    }

    // Remove existing enrollments for this student
    await this.studentSubjectModel.deleteMany({
      studentId: dto.studentId,
      classId: dto.classId,
      academicYear: dto.academicYear,
    } as any);

    // Create new enrollments
    const enrollments = await this.studentSubjectModel.insertMany(
      dto.subjectIds.map((subjectId) => ({
        studentId: dto.studentId,
        subjectId,
        classId: dto.classId,
        academicYear: dto.academicYear,
        enrollmentDate: new Date(),
        status: 'active',
      })),
    ) as any;

    return enrollments;
  }

  /**
   * Get student's enrolled subjects
   */
  async getStudentSubjects(
    studentId: string,
    classId: string,
    academicYear: string,
  ): Promise<StudentSubjectDocument[]> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    return this.studentSubjectModel
      .find({
        studentId,
        classId,
        academicYear,
        isDeleted: false,
      } as any)
      .populate('subjectId', 'name code')
      .exec();
  }

  /**
   * Get class subjects enrolled by specific student
   */
  async getClassStudentSubjects(classId: string, academicYear: string): Promise<StudentSubjectDocument[]> {
    if (!Types.ObjectId.isValid(classId)) {
      throw new BadRequestException('Invalid class ID');
    }

    return this.studentSubjectModel
      .find({
        classId,
        academicYear,
        isDeleted: false,
      } as any)
      .populate('studentId', 'firstName lastName admissionNumber')
      .populate('subjectId', 'name code')
      .exec();
  }

  /**
   * Query student subjects with filters
   */
  async queryStudentSubjects(
    query: StudentSubjectQueryDto,
  ): Promise<{ data: StudentSubjectDocument[]; total: number }> {
    const filter: any = { isDeleted: false };

    if (query.studentId) filter.studentId = query.studentId;
    if (query.classId) filter.classId = query.classId;
    if (query.academicYear) filter.academicYear = query.academicYear;
    if (query.status) filter.status = query.status;

    const limit = Math.min(query.limit || 50, 100);
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.studentSubjectModel
        .find(filter)
        .populate('studentId', 'firstName lastName admissionNumber')
        .populate('subjectId', 'name code')
        .populate('classId', 'name section')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.studentSubjectModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  /**
   * Update student subject status
   */
  async updateStudentSubjectStatus(
    studentSubjectId: string,
    status: 'active' | 'completed' | 'dropped',
  ): Promise<StudentSubjectDocument> {
    const doc = await this.studentSubjectModel.findByIdAndUpdate(
      studentSubjectId,
      { status },
      { returnDocument: 'after' },
    ).exec();

    if (!doc) {
      throw new NotFoundException('Student subject enrollment not found');
    }

    return doc;
  }

  /**
   * Remove student subject enrollment
   */
  async removeStudentSubject(studentSubjectId: string): Promise<void> {
    const result = await this.studentSubjectModel.findByIdAndUpdate(
      studentSubjectId,
      { isDeleted: true },
      { returnDocument: 'after' },
    ).exec();

    if (!result) {
      throw new NotFoundException('Student subject enrollment not found');
    }
  }

  /**
   * Get all enrollments for a specific class and subject, with populated student info
   */
  async getStudentsByClassAndSubject(
    classId: string,
    subjectId: string,
    academicYear?: string,
  ): Promise<StudentSubjectDocument[]> {
    const classExists = await this.classModel.findById(classId).exec();
    if (!classExists) {
      throw new NotFoundException('Class not found');
    }

    const subjectExists = await this.subjectModel.findById(subjectId).exec();
    if (!subjectExists) {
      throw new NotFoundException('Subject not found');
    }

    const filter: any = {
      classId: classId as any,
      subjectId: subjectId as any,
      status: 'active',
      isDeleted: false,
    };
    if (academicYear) {
      filter.academicYear = academicYear;
    }

    return this.studentSubjectModel
      .find(filter)
      .populate('studentId', 'firstName lastName admissionNumber')
      .sort({ createdAt: -1 })
      .exec();
  }
}
