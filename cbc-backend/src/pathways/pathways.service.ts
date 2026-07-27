import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Pathway, PathwayDocument } from './entities/pathway.schema';
import { StudentPathway, StudentPathwayDocument } from './entities/student-pathway.schema';
import { Performance, PerformanceDocument } from '../performance/entities/performance.schema';
import { Student, StudentDocument } from '../students/entities/student.schema';
import { StudentSubject, StudentSubjectDocument } from '../students/entities/student-subject.schema';
import { Class, ClassDocument } from '../classes/entities/class.schema';
import { GradingService } from '../grading/grading.service';
import { Role } from '../auth/roles.enum';
import { CreatePathwayDto } from './dto/create-pathway.dto';
import { UpdatePathwayDto } from './dto/update-pathway.dto';
import { PathwayQueryDto } from './dto/pathway-query.dto';
import { AssignPathwayDto, ApprovePathwayDto, ChangePathwayDto } from './dto/assign-pathway.dto';

@Injectable()
export class PathwaysService {
  private getCurrentAcademicYear(): string {
    return new Date().getFullYear().toString();
  }

  constructor(
    @InjectModel(Pathway.name) private pathwayModel: Model<PathwayDocument>,
    @InjectModel(StudentPathway.name) private studentPathwayModel: Model<StudentPathwayDocument>,
    @InjectModel(Performance.name) private performanceModel: Model<PerformanceDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(StudentSubject.name) private studentSubjectModel: Model<StudentSubjectDocument>,
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
    private gradingService: GradingService,
  ) {}

  /**
   * Create a new pathway
   */
  async create(dto: CreatePathwayDto): Promise<PathwayDocument> {
    const existing = await this.pathwayModel.findOne({ code: dto.code, isDeleted: false });
    if (existing) {
      throw new ConflictException('Pathway with this code already exists');
    }
    return this.pathwayModel.create(dto as any);
  }

  /**
   * Get all pathways with pagination and search
   */
  async findAll(query: PathwayQueryDto): Promise<{ data: PathwayDocument[]; total: number }> {
    const filter: any = { isDeleted: false };
    
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { code: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.pathwayType) {
      filter.pathwayType = query.pathwayType;
    }

    // Filter by GPA range if minimumGPA or maximumGPA is specified
    if (query.minimumGPA !== undefined || query.maximumGPA !== undefined) {
      filter.$or = filter.$or || [];
      
      const gpaFilter: any = {};
      if (query.minimumGPA !== undefined) {
        gpaFilter['gpaRange.maximumGPA'] = { $gte: query.minimumGPA };
      }
      if (query.maximumGPA !== undefined) {
        gpaFilter['gpaRange.minimumGPA'] = { $lte: query.maximumGPA };
      }
      
      filter.$and = filter.$and || [];
      filter.$and.push(gpaFilter);
    }

    const limit = Math.min(query.limit || 50, 100);
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.pathwayModel
        .find(filter)
        .populate('requiredSubjects', 'name code')
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 })
        .exec(),
      this.pathwayModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  /**
   * Get a single pathway by ID
   */
  async findById(id: string): Promise<PathwayDocument> {
    const pathway = await this.pathwayModel
      .findById(id)
      .populate('requiredSubjects', 'name code')
      .exec();
    
    if (!pathway || pathway.isDeleted) {
      throw new NotFoundException('Pathway not found');
    }
    return pathway;
  }

  /**
   * Update a pathway
   */
  async update(id: string, dto: UpdatePathwayDto): Promise<PathwayDocument> {
    const pathway = await this.pathwayModel.findByIdAndUpdate(id, dto, { returnDocument: 'after' })
      .populate('requiredSubjects', 'name code')
      .exec();
    
    if (!pathway || pathway.isDeleted) {
      throw new NotFoundException('Pathway not found');
    }
    return pathway;
  }

  /**
   * Delete (soft delete) a pathway
   */
  async remove(id: string): Promise<void> {
    const result = await this.pathwayModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { returnDocument: 'after' }
    ).exec();
    if (!result) {
      throw new NotFoundException('Pathway not found');
    }
  }

  /**
   * Get all active pathways (for student selection)
   */
  async getActivePathways(): Promise<PathwayDocument[]> {
    return this.pathwayModel
      .find({ isActive: true, isDeleted: false })
      .populate('requiredSubjects', 'name code')
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Assign a pathway to a student
   */
  async assignPathwayToStudent(
    studentId: string,
    dto: AssignPathwayDto,
    recommendedDate?: Date,
  ): Promise<StudentPathwayDocument> {
    // Validate student ID
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    // Validate pathway ID
    if (!Types.ObjectId.isValid(dto.pathwayId)) {
      throw new BadRequestException('Invalid pathway ID');
    }

    // Check if pathway exists
    const pathway = await this.pathwayModel.findById(dto.pathwayId).exec();
    if (!pathway || pathway.isDeleted) {
      throw new NotFoundException('Pathway not found');
    }

    // Check if student already has an active pathway
    const existingPathway = await this.studentPathwayModel.findOne({
      studentId: studentId as any,
      status: { $in: ['approved', 'active'] },
      isDeleted: false,
    });

    if (existingPathway) {
      throw new ConflictException('Student already has an active pathway. Change pathway to assign a new one.');
    }

    // Create student pathway record
    const studentPathway = new this.studentPathwayModel({
      studentId: new Types.ObjectId(studentId),
      pathwayId: new Types.ObjectId(dto.pathwayId),
      selectedDate: new Date(),
      recommendedDate: recommendedDate || new Date(),
      status: 'pending',
      notes: dto.notes,
    });

    return studentPathway.save();
  }

  /**
   * Get student's current pathway
   */
  async getStudentPathway(studentId: string, user?: any): Promise<StudentPathwayDocument | null> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    if (user?.role === Role.Parent) {
      const student = await this.studentModel.findById(studentId).exec();
      if (!student || !student.parentUserId || student.parentUserId.toString() !== user.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    return this.studentPathwayModel
      .findOne({
        studentId: studentId as any,
        isDeleted: false,
      })
      .populate('pathwayId')
      .populate('approvedBy', 'firstName lastName')
      .exec();
  }

  /**
   * Approve student pathway (by teacher/admin)
   */
  async approvePathway(
    studentPathwayId: string,
    teacherId: string,
    dto?: ApprovePathwayDto,
  ): Promise<StudentPathwayDocument> {
    if (!Types.ObjectId.isValid(studentPathwayId)) {
      throw new BadRequestException('Invalid student pathway ID');
    }

    const studentPathway = await this.studentPathwayModel.findByIdAndUpdate(
      studentPathwayId,
      {
        status: 'approved',
        approvedBy: new Types.ObjectId(teacherId),
        approvalDate: new Date(),
        notes: dto?.notes || undefined,
      },
      { returnDocument: 'after' }
    )
      .populate('pathwayId')
      .populate('approvedBy', 'firstName lastName')
      .exec();

    if (!studentPathway) {
      throw new NotFoundException('Student pathway not found');
    }

    return studentPathway;
  }

  /**
   * Change student pathway
   */
  async changeStudentPathway(
    studentId: string,
    dto: ChangePathwayDto,
    teacherId: string,
  ): Promise<StudentPathwayDocument> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    // Check if new pathway exists
    const newPathway = await this.pathwayModel.findById(dto.newPathwayId).exec();
    if (!newPathway || newPathway.isDeleted) {
      throw new NotFoundException('New pathway not found');
    }

    // Get current pathway
    const currentPathway = await this.studentPathwayModel.findOne({
      studentId: studentId as any,
      isDeleted: false,
    });

    if (!currentPathway) {
      throw new NotFoundException('Student has no current pathway');
    }

    // Update current pathway to mark as changed
    await this.studentPathwayModel.findByIdAndUpdate(
      currentPathway._id,
      {
        status: 'changed',
        isDeleted: true,
      }
    ).exec();

    // Create new pathway assignment
    const newStudentPathway = new this.studentPathwayModel({
      studentId: new Types.ObjectId(studentId),
      pathwayId: new Types.ObjectId(dto.newPathwayId),
      previousPathwayId: currentPathway.pathwayId,
      selectedDate: new Date(),
      status: 'pending',
      changeReason: dto.changeReason,
      notes: dto.notes,
      approvedBy: new Types.ObjectId(teacherId),
      approvalDate: new Date(),
    });

    return newStudentPathway.save();
  }

  /**
   * Get students by pathway
   */
  async getStudentsByPathway(pathwayId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(pathwayId)) {
      throw new BadRequestException('Invalid pathway ID');
    }

    return this.studentPathwayModel
      .find({
        pathwayId: pathwayId as any,
        status: { $in: ['approved', 'active'] },
        isDeleted: false,
      })
      .populate('studentId', 'firstName lastName admissionNumber')
      .populate('pathwayId', 'name code')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get pathway distribution (analytics)
   */
  async getPathwayDistribution(): Promise<any[]> {
    return this.studentPathwayModel.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'active'] },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$pathwayId',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'pathways',
          localField: '_id',
          foreignField: '_id',
          as: 'pathway',
        },
      },
      {
        $unwind: '$pathway',
      },
      {
        $project: {
          pathwayId: '$_id',
          pathwayName: '$pathway.name',
          pathwayCode: '$pathway.code',
          studentCount: '$count',
          _id: 0,
        },
      },
      {
        $sort: { studentCount: -1 },
      },
    ]);
  }

  /**
   * Get pathway results tracking summary
   */
  async getPathwayTracking(pathwayId: string, academicYear?: string, term?: string): Promise<any> {
    if (!Types.ObjectId.isValid(pathwayId)) {
      throw new BadRequestException('Invalid pathway ID');
    }

    const pathway = await this.pathwayModel
      .findById(pathwayId)
      .populate('requiredSubjects', 'name code')
      .exec();

    if (!pathway || pathway.isDeleted) {
      throw new NotFoundException('Pathway not found');
    }

    const studentPathways = await this.studentPathwayModel
      .find({
        pathwayId: pathwayId as any,
        status: { $in: ['approved', 'active'] },
        isDeleted: false,
      })
      .populate('studentId', 'firstName lastName admissionNumber')
      .exec();

    const requiredSubjects = (pathway.requiredSubjects || []).map((subject: any) => ({
      id: subject._id.toString(),
      name: subject.name,
      code: subject.code,
    }));

    const studentIds = studentPathways
      .map((studentPathway) => (studentPathway.studentId as any)?._id?.toString?.() || (studentPathway.studentId as any)?.toString?.())
      .filter(Boolean);

    const performanceQuery: any = {
      studentId: { $in: studentIds },
      subjectId: { $in: requiredSubjects.map((subject) => new Types.ObjectId(subject.id)) },
      isDeleted: false,
    };

    performanceQuery.academicYear = academicYear || this.getCurrentAcademicYear();

    if (term) {
      performanceQuery.term = term;
    }

    const performances = await this.performanceModel.find(performanceQuery).exec();
    const performanceMap = new Map<string, Map<string, number[]>>();

    for (const performance of performances) {
      const studentKey = (performance.studentId as any).toString();
      const subjectKey = (performance.subjectId as any).toString();

      if (!performanceMap.has(studentKey)) {
        performanceMap.set(studentKey, new Map());
      }

      const studentPerformanceMap = performanceMap.get(studentKey)!;
      if (!studentPerformanceMap.has(subjectKey)) {
        studentPerformanceMap.set(subjectKey, []);
      }

      studentPerformanceMap.get(subjectKey)!.push(performance.score);
    }

    const students = studentPathways.map((studentPathway) => {
      const student = studentPathway.studentId as any;
      const studentKey = student?._id?.toString?.() || student?.toString?.();
      const studentPerformanceMap = performanceMap.get(studentKey) || new Map();

      const subjectBreakdown = requiredSubjects.map((subject) => {
        const scores = studentPerformanceMap.get(subject.id) || [];
        const average = scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : null;

        return {
          subjectId: subject.id,
          subjectName: subject.name,
          subjectCode: subject.code,
          scoreCount: scores.length,
          averageScore: average !== null ? Math.round(average * 100) / 100 : null,
        };
      });

      const completedSubjects = subjectBreakdown.filter((subject) => subject.scoreCount > 0).length;
      const scoredSubjects = subjectBreakdown.filter((subject) => subject.averageScore !== null);
      const averageScore = scoredSubjects.length > 0
        ? scoredSubjects.reduce((sum, subject) => sum + (subject.averageScore || 0), 0) / scoredSubjects.length
        : 0;

      return {
        studentId: student?._id?.toString?.(),
        studentName: `${student?.firstName || ''} ${student?.lastName || ''}`.trim(),
        admissionNumber: student?.admissionNumber || '',
        status: studentPathway.status,
        completedRequiredSubjects: completedSubjects,
        requiredSubjects: requiredSubjects.length,
        completionRate: requiredSubjects.length > 0 ? Math.round((completedSubjects / requiredSubjects.length) * 100) : 0,
        averageScore: Math.round(averageScore * 100) / 100,
        subjectBreakdown,
      };
    });

    return {
      pathway: {
        id: pathway._id,
        name: pathway.name,
        code: pathway.code,
      },
      academicYear: academicYear || null,
      term: term || null,
      totalStudents: students.length,
      averageCompletionRate: students.length > 0
        ? Math.round((students.reduce((sum, student) => sum + student.completionRate, 0) / students.length) * 100) / 100
        : 0,
      averageScore: students.length > 0
        ? Math.round((students.reduce((sum, student) => sum + student.averageScore, 0) / students.length) * 100) / 100
        : 0,
      students,
    };
  }

  /**
   * Get students by pathway filtered by class
   */
  async getStudentsByPathwayAndClass(pathwayId: string, classId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(pathwayId)) {
      throw new BadRequestException('Invalid pathway ID');
    }

    if (!Types.ObjectId.isValid(classId)) {
      throw new BadRequestException('Invalid class ID');
    }

    // Verify class exists
    const classDoc = await this.classModel.findById(classId);
    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    return this.studentPathwayModel
      .find({
        pathwayId: pathwayId as any,
        status: { $in: ['approved', 'active'] },
        isDeleted: false,
      })
      .populate({
        path: 'studentId',
        match: { classId: classId as any },
        select: 'firstName lastName admissionNumber classId',
      })
      .populate('pathwayId', 'name code')
      .sort({ createdAt: -1 })
      .exec()
      .then((results) => results.filter((r) => r.studentId !== null));
  }

  /**
   * Determine pathway based on student's marks and subjects
   */
  async determinePathwayByMarks(studentId: string, academicYear: string, term: string): Promise<PathwayDocument | null> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    // Get student's performance records for the given term
    const performances = await this.performanceModel.find({
      studentId,
      academicYear,
      term,
      isDeleted: false,
    } as any);

    if (performances.length === 0) {
      return null;
    }

    // Get the default grading template
    const defaultGradingTemplate = await this.gradingService.findDefault();
    if (!defaultGradingTemplate) {
      return null;
    }

    // Calculate GPA from performance scores
    // Standardized formula: score / 20 (0-5.0 scale)
    let totalGPA = 0;
    for (const performance of performances) {
      const score = performance.score || 0;
      const gpa = score / 20;
      totalGPA += gpa;
    }
    const averageGPA = totalGPA / performances.length;

    // Get all marks-based pathways
    const markBasedPathways = await this.pathwayModel.find({
      pathwayType: 'marks-based',
      isActive: true,
      isDeleted: false,
    } as any);

    // Find matching pathway based on GPA
    for (const pathway of markBasedPathways) {
      if (pathway.gpaRange) {
        // Check if average GPA falls within range
        if (
          averageGPA >= pathway.gpaRange.minimumGPA &&
          averageGPA <= pathway.gpaRange.maximumGPA
        ) {
          // If subject criteria exist, verify student meets them
          if (pathway.gpaRange.subjectCriteria && pathway.gpaRange.subjectCriteria.length > 0) {
            const meetsSubjectCriteria = pathway.gpaRange.subjectCriteria.every((criteria) => {
              const subjectPerformance = performances.find((p) =>
                (p.subjectId as any).equals(criteria.subjectId),
              );
              return (
                subjectPerformance &&
                subjectPerformance.score >= (criteria.minimumMarks || 0)
              );
            });

            if (meetsSubjectCriteria) {
              return pathway;
            }
          } else {
            return pathway;
          }
        }
      }
    }

    return null;
  }

  /**
   * Determine pathway based on subject selection
   */
  async determinePathwayBySubjects(studentId: string, classId: string, academicYear?: string, user?: any): Promise<PathwayDocument | null> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    if (!Types.ObjectId.isValid(classId)) {
      throw new BadRequestException('Invalid class ID');
    }

    // If request from a teacher, ensure the teacher is assigned to the class
    if (user?.role === Role.Teacher) {
      const cls = await this.classModel.findById(classId).exec();
      if (!cls || String(cls.teacher) !== String(user._id ?? user.id)) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Get student's subject enrollments
    const studentSubjects = await this.studentSubjectModel.find({
      studentId,
      classId,
      academicYear,
      isDeleted: false,
    } as any);

    if (studentSubjects.length === 0) {
      return null;
    }

    const enrolledSubjectIds = studentSubjects.map((ss) => (ss.subjectId as any).toString());

    // Get all subject-based pathways
    const subjectBasedPathways = await this.pathwayModel
      .find({
        pathwayType: 'subject-based',
        isActive: true,
        isDeleted: false,
      } as any)
      .populate('requiredSubjects');

    // Find matching pathway based on subject overlap
    let bestMatch: PathwayDocument | null = null;
    let bestMatchCount = 0;

    for (const pathway of subjectBasedPathways) {
      const requiredSubjectIds = (pathway.requiredSubjects || []).map((s: any) =>
        s._id ? (s._id as any).toString() : (s as any).toString(),
      );

      const matchCount = enrolledSubjectIds.filter((id) =>
        requiredSubjectIds.includes(id),
      ).length;

      if (matchCount > bestMatchCount) {
        bestMatch = pathway;
        bestMatchCount = matchCount;
      }
    }

    return bestMatch;
  }

  /**
   * Auto-assign pathway to student based on marks or subjects
   */
  async autoAssignPathway(
    studentId: string,
    classId: string,
    academicYear: string,
    term: string,
    user?: any,
  ): Promise<StudentPathwayDocument | null> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    // Check if student already has active pathway
    const existingPathway = await this.studentPathwayModel.findOne({
      studentId: studentId as any,
      status: { $in: ['approved', 'active'] },
      isDeleted: false,
    });

    if (existingPathway) {
      return null; // Student already has pathway
    }

    // If request is from a teacher, ensure they are assigned to the class for which we're auto-assigning
    if (user?.role === Role.Teacher && classId) {
      const cls = await this.classModel.findById(classId).exec();
      if (!cls || String(cls.teacher) !== String(user._id ?? user.id)) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Try to determine pathway by marks first
    let determinedPathway = await this.determinePathwayByMarks(studentId, academicYear, term);

    // If no marks-based pathway, try subject-based
    if (!determinedPathway) {
      determinedPathway = await this.determinePathwayBySubjects(
        studentId,
        classId,
        academicYear,
      );
    }

    if (!determinedPathway) {
      return null; // No matching pathway found
    }

    // Create student pathway record
    const studentPathway = new this.studentPathwayModel({
      studentId: new Types.ObjectId(studentId),
      pathwayId: new Types.ObjectId((determinedPathway as any)._id),
      selectedDate: new Date(),
      status: 'approved',
      notes: `Auto-assigned based on ${determinedPathway.pathwayType} criteria`,
    });

    return studentPathway.save();
  }

  /**
   * Get pathway suggestions for a student
   */
  async getPathwaySuggestions(
    studentId: string,
    classId: string,
    academicYear: string,
    term: string,
  ): Promise<PathwayDocument[]> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    const suggestions: Map<string, PathwayDocument> = new Map();

    // Get pathways by marks
    try {
      const markBasedPathway = await this.determinePathwayByMarks(
        studentId,
        academicYear,
        term,
      );
      if (markBasedPathway) {
        suggestions.set((markBasedPathway as any)._id.toString(), markBasedPathway);
      }
    } catch {
      // Continue if no marks data
    }

    // Get pathways by subjects
    try {
      const subjectBasedPathway = await this.determinePathwayBySubjects(
        studentId,
        classId,
        academicYear,
      );
      if (subjectBasedPathway) {
        suggestions.set((subjectBasedPathway as any)._id.toString(), subjectBasedPathway);
      }
    } catch {
      // Continue if no subject data
    }

    return Array.from(suggestions.values());
  }

  /**
   * Calculate student's overall GPA based on performance across subjects
   */
  async calculateStudentGPA(
    studentId: string,
    academicYear?: string,
    term?: string,
  ): Promise<{
    overallGPA: number;
    subjectGPAs: { subjectId: string; subjectName: string; gpa: number; avgScore: number }[];
    totalPoints: number;
    totalGradeWeight: number;
  }> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    const performanceQuery: any = {
      studentId: new Types.ObjectId(studentId),
      isDeleted: false,
    };

    performanceQuery.academicYear = academicYear || this.getCurrentAcademicYear();

    if (term) {
      performanceQuery.term = term;
    }

    const performances = await this.performanceModel
      .find(performanceQuery)
      .populate('subjectId', 'name code')
      .exec();

    if (performances.length === 0) {
      throw new NotFoundException('No performance data found for this student');
    }

    // Group by subject
    const subjectMap = new Map<string, { scores: number[]; name: string; code: string; points: number[] }>();

    for (const performance of performances) {
      const subjectId = (performance.subjectId as any)?._id?.toString?.() || '';
      const subjectName = (performance.subjectId as any)?.name || 'Unknown';
      const subjectCode = (performance.subjectId as any)?.code || '';

      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, { scores: [], name: subjectName, code: subjectCode, points: [] });
      }

      const subject = subjectMap.get(subjectId)!;
      subject.scores.push(performance.score);
      subject.points.push(performance.points || 0);
    }

    // Calculate GPA for each subject
    const subjectGPAs: { subjectId: string; subjectName: string; gpa: number; avgScore: number }[] = [];
    let totalPoints = 0;
    let totalWeight = 0;

    for (const [subjectId, subjectData] of subjectMap.entries()) {
      const avgScore = subjectData.scores.reduce((a, b) => a + b, 0) / subjectData.scores.length;
      const avgPoints = subjectData.points.reduce((a, b) => a + b, 0) / subjectData.points.length;
      const gpaSource = avgPoints > 0 ? avgPoints : avgScore / 20;
      const gpa = Math.round((gpaSource / 5) * 100) / 100; // Normalize to 5.0 scale

      subjectGPAs.push({
        subjectId,
        subjectName: subjectData.name,
        gpa: Math.min(gpa, 5.0),
        avgScore,
      });

      totalPoints += gpaSource;
      totalWeight += 1;
    }

    const overallGPA = totalWeight > 0 ? Math.round((totalPoints / totalWeight) * 100) / 100 : 0;

    return {
      overallGPA: Math.min(overallGPA, 5.0),
      subjectGPAs,
      totalPoints,
      totalGradeWeight: totalWeight,
    };
  }

  /**
   * Get pathway recommendations with GPA-based grouping
   */
  async getPathwayRecommendationsByGPA(
    studentId: string,
    academicYear?: string,
    term?: string,
    user?: any,
  ): Promise<{
    studentGPA: number;
    recommendedPathways: any[];
    groupedBySubjectPerformance: Map<string, any[]>;
  }> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    if (user?.role === Role.Parent) {
      const student = await this.studentModel.findById(studentId).exec();
      if (!student || !student.parentUserId || student.parentUserId.toString() !== user.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    const resolvedAcademicYear = academicYear || this.getCurrentAcademicYear();

    // Calculate GPA
    const gpaData = await this.calculateStudentGPA(studentId, resolvedAcademicYear, term);

    // Get all active pathways
    const allPathways = await this.pathwayModel
      .find({ isActive: true, isDeleted: false })
      .populate('requiredSubjects', 'name code')
      .sort({ name: 1 })
      .exec();

    // Filter pathways based on GPA — check both min and max bounds
    const recommendedPathways = allPathways.filter((pathway) => {
      const minGPA = pathway.gpaRange?.minimumGPA ?? pathway.minimumGPA ?? 0;
      const maxGPA = pathway.gpaRange?.maximumGPA ?? null;
      if (gpaData.overallGPA < minGPA) {
        return false;
      }
      if (maxGPA !== null && maxGPA !== undefined && gpaData.overallGPA > maxGPA) {
        return false;
      }
      return true;
    });

    // Group pathways by subject performance
    const groupedBySubjectPerformance = new Map<string, any[]>();

    for (const pathway of recommendedPathways) {
      const requiredSubjectIds = (pathway.requiredSubjects || []).map((s: any) => s._id?.toString?.() || '');

      // Find student's performance in these subjects
      const matchingSubjectGPAs = gpaData.subjectGPAs.filter((sg) =>
        requiredSubjectIds.includes(sg.subjectId),
      );

      if (matchingSubjectGPAs.length > 0) {
        const avgSubjectGPA = Math.round(
          (matchingSubjectGPAs.reduce((sum, sg) => sum + sg.gpa, 0) / matchingSubjectGPAs.length) * 100,
        ) / 100;

        const groupKey = `${pathway.name} (Required: ${requiredSubjectIds.join(', ')})`;

        if (!groupedBySubjectPerformance.has(groupKey)) {
          groupedBySubjectPerformance.set(groupKey, []);
        }

        // Add metadata
        const pathwayWithMetadata = {
          ...pathway.toObject(),
          studentMatchScore: avgSubjectGPA,
          matchingSubjectGPAs,
          totalRequiredSubjects: requiredSubjectIds.length,
          matchedSubjectsCount: matchingSubjectGPAs.length,
        };

        groupedBySubjectPerformance.get(groupKey)!.push(pathwayWithMetadata);
      }
    }

    return {
      studentGPA: gpaData.overallGPA,
      recommendedPathways: recommendedPathways.map((p) => ({
        id: p._id,
        name: p.name,
        code: p.code,
        minimumGPA: p.minimumGPA,
        requiredSubjects: p.requiredSubjects,
        description: p.description,
      })),
      groupedBySubjectPerformance,
    };
  }

  /**
   * Place student in pathway based on subject performance and GPA
   */
  async autoPlaceStudentByPerformance(
    studentId: string,
    academicYear?: string,
    term?: string,
    teacherId?: string,
  ): Promise<{
    studentId: string;
    selectedPathway: PathwayDocument;
    reason: string;
    studentGPA: number;
    subjectPerformance: any[];
  }> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    const resolvedAcademicYear = academicYear || this.getCurrentAcademicYear();

    const recommendations = await this.getPathwayRecommendationsByGPA(
      studentId,
      resolvedAcademicYear,
      term,
    );

    if (recommendations.recommendedPathways.length === 0) {
      throw new BadRequestException(
        'No suitable pathways available based on student performance and GPA',
      );
    }

    // Select pathway with highest match score
    let bestPathway: any = null;
    let highestScore = 0;

    for (const [, pathways] of recommendations.groupedBySubjectPerformance) {
      for (const pathway of pathways) {
        if (pathway.studentMatchScore > highestScore) {
          highestScore = pathway.studentMatchScore;
          bestPathway = pathway;
        }
      }
    }

    if (!bestPathway) {
      bestPathway = (await this.pathwayModel.findById(recommendations.recommendedPathways[0].id).exec());
    }

    // Auto-assign the pathway
    const assignmentData: AssignPathwayDto = {
      pathwayId: bestPathway._id.toString(),
      notes: `Auto-placement based on GPA ${recommendations.studentGPA} and subject performance in Term ${term || 'Current'}`,
    };

    const studentPathway = await this.assignPathwayToStudent(
      studentId,
      assignmentData,
      new Date(),
    );

    // Auto-approve if teacher ID is provided
    if (teacherId) {
      await this.approvePathway(studentPathway._id.toString(), teacherId, {
        notes: `Auto-approved placement for student with GPA ${recommendations.studentGPA}`,
      });
    }

    const gpaData = await this.calculateStudentGPA(studentId, resolvedAcademicYear, term);

    return {
      studentId,
      selectedPathway: bestPathway,
      reason: `Selected based on match score of ${highestScore} in required subjects`,
      studentGPA: recommendations.studentGPA,
      subjectPerformance: gpaData.subjectGPAs,
    };
  }
}
