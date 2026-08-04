import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role } from '../auth/roles.enum';
import { Performance, PerformanceDocument } from './entities/performance.schema';
import { Student, StudentDocument } from '../students/entities/student.schema';
import { Subject, SubjectDocument } from '../subjects/entities/subject.schema';
import { Class, ClassDocument } from '../classes/entities/class.schema';
import { User, UserDocument } from '../auth/entities/user.schema';
import { GradingService } from '../grading/grading.service';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { UpdatePerformanceDto, BulkPerformanceDto } from './dto/update-performance.dto';
import { PerformanceBatchFilterDto, ReturnPerformanceDto } from './dto/workflow-performance.dto';
import { NotificationsService } from '../notifications/notifications.service';

export const PERFORMANCE_STATUS = {
  DRAFT: 'draft',
  PENDING_CLASS_TEACHER: 'pending_class_teacher',
  PENDING_ADMIN: 'pending_admin',
  APPROVED: 'approved',
  RETURNED: 'returned',
} as const;

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(Performance.name) private performanceModel: Model<PerformanceDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly gradingService: GradingService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async applyGrade(score: number): Promise<{ grade: string; remark: string; points: number }> {
    const scale = await this.gradingService.findDefault();
    if (!scale) return { grade: 'N/A', remark: '', points: 0 };
    return this.gradingService.getGradeForScore(scale.grades, score);
  }

  private isSuperAdmin(user?: any): boolean {
    return user?.role === Role.SuperAdmin;
  }

  private isAdmin(user?: any): boolean {
    return user?.role === Role.Admin || user?.role === Role.SuperAdmin;
  }

  private isClassTeacher(user?: any): boolean {
    return user?.role === Role.ClassTeacher || user?.role === Role.Admin || user?.role === Role.SuperAdmin;
  }

  /**
   * Editing rules:
   * - Subject teachers may only edit while a record is `draft` or `returned`.
   * - Class teachers may also edit records while they are `pending_class_teacher`
   *   (their review stage) before submitting to the admin.
   * - Admins / super admins may edit records at any stage.
   */
  private assertCanEdit(perf: PerformanceDocument, user?: any, isSuperOverride = false): void {
    if (isSuperOverride && this.isAdmin(user)) return;
    if (this.isAdmin(user)) return;
    if (perf.status === PERFORMANCE_STATUS.DRAFT || perf.status === PERFORMANCE_STATUS.RETURNED) {
      return;
    }
    if (perf.status === PERFORMANCE_STATUS.PENDING_CLASS_TEACHER && user?.role === Role.ClassTeacher) {
      return;
    }
    throw new ForbiddenException(
      'These marks have already been submitted. Editing is locked. Only an admin can alter marks after submission.',
    );
  }

  private async assertSubjectTeacherOwns(subjectId: string | undefined, classId: string | undefined, user?: any): Promise<void> {
    if (this.isAdmin(user) || this.isClassTeacher(user)) return;
    if (!subjectId) {
      throw new BadRequestException('subjectId is required for subject teachers.');
    }
    const subject = await this.subjectModel.findById(subjectId).exec();
    if (!subject) throw new NotFoundException('Subject not found');
    const subjectTeacherId = (subject as any).teacher?.toString();
    if (subjectTeacherId && user && subjectTeacherId === user.id) return;
    throw new ForbiddenException('You can only enter marks for subjects assigned to you.');
  }

  private async buildBatch(
    filter: PerformanceBatchFilterDto,
    extraQuery: any = {},
  ): Promise<PerformanceDocument[]> {
    const query: any = { isDeleted: false, ...extraQuery };
    if (filter.classId) query.classId = filter.classId;
    if (filter.subjectId) query.subjectId = filter.subjectId;
    if (filter.academicYear) query.academicYear = filter.academicYear;
    if (filter.term) query.term = filter.term;
    if (filter.examType) query.examType = filter.examType;
    if (filter.performanceIds && filter.performanceIds.length) {
      query._id = { $in: filter.performanceIds.map((id) => new Types.ObjectId(id)) };
    }
    return this.performanceModel.find(query).exec();
  }

  async create(dto: CreatePerformanceDto, user?: any): Promise<PerformanceDocument> {
    const { grade, remark, points } = await this.applyGrade(dto.score);
    const filter: any = {
      studentId: dto.studentId,
      subjectId: dto.subjectId,
      academicYear: dto.academicYear,
      term: dto.term,
      examType: dto.examType,
      isDeleted: false,
    };
    const existing = await this.performanceModel.findOne(filter);
    if (existing) {
      this.assertCanEdit(existing, user);
      existing.score = dto.score;
      existing.grade = grade;
      existing.remark = remark;
      existing.points = points;
      existing.enteredBy = (user ? new Types.ObjectId(user.id) : existing.enteredBy) as any;
      existing.status = PERFORMANCE_STATUS.DRAFT;
      existing.returnedReason = undefined;
      return existing.save();
    }
    return this.performanceModel.create({
      ...dto,
      grade,
      remark,
      points,
      enteredBy: user ? new Types.ObjectId(user.id) : undefined,
      status: PERFORMANCE_STATUS.DRAFT,
    } as any);
  }

  async bulkCreate(dto: BulkPerformanceDto, user?: any): Promise<{ created: number; updated: number; locked: number }> {
    await this.assertSubjectTeacherOwns(dto.subjectId, dto.classId, user);
    let created = 0;
    let updated = 0;
    let locked = 0;
    for (const entry of dto.scores) {
      const { grade, remark, points } = await this.applyGrade(entry.score);
      const bulkFilter: any = {
        studentId: entry.studentId,
        subjectId: dto.subjectId,
        classId: dto.classId,
        academicYear: dto.academicYear,
        term: dto.term,
        examType: dto.examType,
        isDeleted: false,
      };
      const existing = await this.performanceModel.findOne(bulkFilter);
      if (existing) {
        try {
          this.assertCanEdit(existing, user);
        } catch (err) {
          locked++;
          continue;
        }
        existing.score = entry.score;
        existing.grade = grade;
        existing.remark = remark;
        existing.points = points;
        existing.enteredBy = (user ? new Types.ObjectId(user.id) : existing.enteredBy) as any;
        existing.status = PERFORMANCE_STATUS.DRAFT;
        existing.returnedReason = undefined;
        await existing.save();
        updated++;
      } else {
        await this.performanceModel.create({
          studentId: entry.studentId,
          subjectId: dto.subjectId,
          classId: dto.classId,
          academicYear: dto.academicYear,
          term: dto.term,
          examType: dto.examType,
          score: entry.score,
          grade,
          remark,
          points,
          enteredBy: user ? new Types.ObjectId(user.id) : undefined,
          status: PERFORMANCE_STATUS.DRAFT,
        } as any);
        created++;
      }
    }
    return { created, updated, locked };
  }

  async findAll(
    filters: {
      classId?: string;
      studentId?: string;
      subjectId?: string;
      academicYear?: string;
      term?: string;
      examType?: string;
      status?: string;
    },
    user?: any,
  ): Promise<PerformanceDocument[]> {
    const query: any = { isDeleted: false };
    if (filters.classId) query.classId = filters.classId;
    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.subjectId) query.subjectId = filters.subjectId;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.term) query.term = filters.term;
    if (filters.examType) query.examType = filters.examType;
    if (filters.status) query.status = filters.status;

    if (user) {
      if (this.isAdmin(user)) {
        // admins can see everything
      } else if (user.role === Role.ClassTeacher) {
        const myClasses = await this.classModel
          .find({ classTeacher: user.id, isDeleted: false } as any)
          .distinct('_id')
          .exec();
        if (!query.classId) {
          query.classId = { $in: myClasses };
        } else if (!myClasses.map((c) => c.toString()).includes(query.classId)) {
          throw new ForbiddenException('You can only view performance for classes you teach.');
        }
      } else if (user.role === Role.Teacher) {
        if (filters.subjectId) {
          const subject = await this.subjectModel.findById(filters.subjectId).exec();
          const subjectTeacherId = (subject as any)?.teacher?.toString();
          if (subjectTeacherId && subjectTeacherId !== user.id && !filters.studentId) {
            // Restrict to own subject only if the subject is assigned to another teacher.
            query.enteredBy = new Types.ObjectId(user.id);
          }
        }
        query.$or = [
          { enteredBy: new Types.ObjectId(user.id) },
          { enteredBy: { $exists: false } },
          { enteredBy: null },
        ];
      }
    }

    return this.performanceModel
      .find(query)
      .populate('studentId', 'firstName lastName admissionNumber')
      .populate('subjectId', 'name code')
      .populate('classId', 'name section')
      .populate('enteredBy', 'username email firstName lastName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<PerformanceDocument> {
    const doc = await this.performanceModel
      .findById(id)
      .populate('studentId', 'firstName lastName admissionNumber')
      .populate('subjectId', 'name code')
      .populate('classId', 'name section')
      .populate('enteredBy', 'username email firstName lastName')
      .exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Performance record not found');
    return doc;
  }

  async update(id: string, dto: UpdatePerformanceDto, user?: any): Promise<PerformanceDocument> {
    const perf = await this.performanceModel.findById(id);
    if (!perf || perf.isDeleted) throw new NotFoundException('Performance record not found');
    this.assertCanEdit(perf, user);
    if (dto.score !== undefined) {
      perf.score = dto.score;
      const { grade, remark, points } = await this.applyGrade(dto.score);
      perf.grade = grade;
      perf.remark = remark;
      perf.points = points;
    }
    return perf.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.performanceModel.findByIdAndUpdate(id, { isDeleted: true }, { returnDocument: 'after' }).exec();
    if (!result) throw new NotFoundException('Performance record not found');
  }

  // ===== WORKFLOW =====

  async getWorkflowOverview(filter: PerformanceBatchFilterDto): Promise<any> {
    const query: any = { isDeleted: false };
    if (filter.classId) query.classId = filter.classId;
    if (filter.subjectId) query.subjectId = filter.subjectId;
    if (filter.academicYear) query.academicYear = filter.academicYear;
    if (filter.term) query.term = filter.term;
    if (filter.examType) query.examType = filter.examType;

    const records = await this.performanceModel
      .find(query)
      .populate('subjectId', 'name code')
      .populate('enteredBy', 'username email firstName lastName')
      .populate('classId', 'name section')
      .sort({ createdAt: -1 })
      .exec();

    const bySubject = new Map<string, any>();
    for (const rec of records) {
      const subjectId = (rec.subjectId as any)?._id?.toString() || rec.subjectId?.toString() || 'unknown';
      const subjectName = (rec.subjectId as any)?.name || 'Unknown Subject';
      if (!bySubject.has(subjectId)) {
        bySubject.set(subjectId, {
          subjectId,
          subjectName,
          enteredBy: (rec.enteredBy as any)
            ? { id: (rec.enteredBy as any)._id, name: `${(rec.enteredBy as any).firstName || ''} ${(rec.enteredBy as any).lastName || ''}`.trim() || (rec.enteredBy as any).username || 'Unknown' }
            : null,
          recordCount: 0,
          statusCounts: { draft: 0, pending_class_teacher: 0, pending_admin: 0, approved: 0, returned: 0 },
          status: PERFORMANCE_STATUS.DRAFT,
          submittedToClassTeacherAt: null,
          submittedToAdminAt: null,
          approvedAt: null,
        });
      }
      const entry = bySubject.get(subjectId);
      entry.recordCount++;
      const st = rec.status || PERFORMANCE_STATUS.DRAFT;
      entry.statusCounts[st] = (entry.statusCounts[st] || 0) + 1;
      if (rec.submittedToClassTeacherAt) entry.submittedToClassTeacherAt = rec.submittedToClassTeacherAt;
      if (rec.submittedToAdminAt) entry.submittedToAdminAt = rec.submittedToAdminAt;
      if (rec.approvedAt) entry.approvedAt = rec.approvedAt;
    }

    for (const entry of bySubject.values()) {
      const counts = entry.statusCounts;
      if (entry.recordCount === 0) entry.status = PERFORMANCE_STATUS.DRAFT;
      else if (counts.approved === entry.recordCount) entry.status = PERFORMANCE_STATUS.APPROVED;
      else if (counts.pending_admin > 0) entry.status = PERFORMANCE_STATUS.PENDING_ADMIN;
      else if (counts.pending_class_teacher > 0) entry.status = PERFORMANCE_STATUS.PENDING_CLASS_TEACHER;
      else if (counts.returned > 0) entry.status = PERFORMANCE_STATUS.RETURNED;
      else entry.status = PERFORMANCE_STATUS.DRAFT;
    }

    return {
      classId: filter.classId,
      subjectId: filter.subjectId,
      academicYear: filter.academicYear,
      term: filter.term,
      examType: filter.examType,
      subjects: Array.from(bySubject.values()),
    };
  }

  /**
   * Step 1 â€” Subject teacher submits their entered marks to the class teacher.
   */
  async submitToClassTeacher(filter: PerformanceBatchFilterDto, user?: any): Promise<{ count: number }> {
    if (!user) throw new ForbiddenException('Authentication required');
    if (!filter.classId) throw new BadRequestException('classId is required');

    const classDoc = await this.classModel.findById(filter.classId).exec();
    if (!classDoc || classDoc.isDeleted) throw new NotFoundException('Class not found');

    await this.assertSubjectTeacherOwns(filter.subjectId, filter.classId, user);

    const records = await this.buildBatch(filter, {
      status: { $in: [PERFORMANCE_STATUS.DRAFT, PERFORMANCE_STATUS.RETURNED] },
      $or: [{ enteredBy: new Types.ObjectId(user.id) }, { enteredBy: { $exists: false } }, { enteredBy: null }],
    });

    if (!records.length) {
      throw new BadRequestException('No draft marks found to submit. Enter marks first.');
    }

    const now = new Date();
    for (const rec of records) {
      rec.status = PERFORMANCE_STATUS.PENDING_CLASS_TEACHER;
      rec.submittedToClassTeacherAt = now;
      rec.returnedReason = undefined;
      rec.enteredBy = new Types.ObjectId(user.id) as any;
      await rec.save();
    }

    // Notify the class teacher(s) of this class.
    const classTeacherIds: string[] = [];
    if (classDoc.classTeacher) classTeacherIds.push(classDoc.classTeacher.toString());
    if (classTeacherIds.length) {
      const label = `${classDoc.name}${classDoc.section ? ' - ' + classDoc.section : ''}`;
      await this.notificationsService.createMany(
        classTeacherIds.map((recipientId) => ({
          recipientId,
          title: 'Marks submitted for review',
          message: `${records.length} mark record(s) for ${label} (${filter.term || ''} ${filter.examType || ''} ${filter.academicYear || ''}) have been submitted by a subject teacher and are awaiting your approval.`,
          type: 'performance_submitted',
          classId: classDoc._id.toString(),
          performanceId: records[0]._id.toString(),
        })),
      );
    }

    return { count: records.length };
  }

  /**
   * Step 2 â€” Class teacher reviews and submits approved marks to the admin.
   */
  async submitToAdmin(filter: PerformanceBatchFilterDto, user?: any): Promise<{ count: number }> {
    if (!user) throw new ForbiddenException('Authentication required');
    if (!filter.classId) throw new BadRequestException('classId is required');

    const classDoc = await this.classModel.findById(filter.classId).exec();
    if (!classDoc || classDoc.isDeleted) throw new NotFoundException('Class not found');

    if (user.role === Role.ClassTeacher) {
      const isMyClass = classDoc.classTeacher && classDoc.classTeacher.toString() === user.id;
      if (!isMyClass) {
        throw new ForbiddenException('You are not the class teacher for this class.');
      }
    } else if (!this.isAdmin(user)) {
      throw new ForbiddenException('Only the class teacher can submit marks to the admin.');
    }

    const records = await this.buildBatch(filter, { status: PERFORMANCE_STATUS.PENDING_CLASS_TEACHER });
    if (!records.length) {
      throw new BadRequestException('No pending marks found to submit. Subject teachers must submit their marks first.');
    }

    const now = new Date();
    for (const rec of records) {
      rec.status = PERFORMANCE_STATUS.PENDING_ADMIN;
      rec.submittedToAdminAt = now;
      rec.reviewedAt = now;
      await rec.save();
    }

    // Notify all admins.
    const admins = await this.userModel.find({ role: { $in: [Role.Admin, Role.SuperAdmin] } }).select('_id').exec();
    const label = `${classDoc.name}${classDoc.section ? ' - ' + classDoc.section : ''}`;
    if (admins.length) {
      await this.notificationsService.createMany(
        admins.map((admin) => ({
          recipientId: admin._id.toString(),
          title: 'Marks pending admin approval',
          message: `Class teacher submitted ${records.length} mark record(s) for ${label} (${filter.term || ''} ${filter.examType || ''} ${filter.academicYear || ''}). Approve to finalize.`,
          type: 'performance_pending_admin',
          classId: classDoc._id.toString(),
          performanceId: records[0]._id.toString(),
        })),
      );
    }

    return { count: records.length };
  }

  /**
   * Step 3 â€” Admin approves the marks, finalizing them.
   */
  async approve(filter: PerformanceBatchFilterDto, user?: any): Promise<{ count: number }> {
    if (!user) throw new ForbiddenException('Authentication required');
    if (!this.isAdmin(user)) throw new ForbiddenException('Only an admin can approve marks.');

    const records = await this.buildBatch(filter, { status: PERFORMANCE_STATUS.PENDING_ADMIN });
    if (!records.length) {
      throw new BadRequestException('No marks pending admin approval found.');
    }

    const now = new Date();
    const classTeacherIds = new Set<string>();
    const subjectTeacherIds = new Set<string>();
    let classId: string | undefined;

    for (const rec of records) {
      rec.status = PERFORMANCE_STATUS.APPROVED;
      rec.approvedAt = now;
      await rec.save();
      if (rec.classId) classId = rec.classId.toString();
      if (rec.enteredBy) subjectTeacherIds.add(rec.enteredBy.toString());
    }

    // Approver display name (fall back to username / email).
    let approverName = user?.username || user?.email || 'Admin';
    if (user?.id) {
      const approver = await this.userModel.findById(user.id).select('firstName lastName username email').exec();
      if (approver) {
        const full = `${approver.firstName || ''} ${approver.lastName || ''}`.trim();
        approverName = full || approver.username || approver.email || approverName;
      }
    }

    // Unique subject names covered by this approval.
    const subjectIdSet = new Set<string>();
    for (const rec of records) {
      if (rec.subjectId) subjectIdSet.add(rec.subjectId.toString());
    }
    const subjects = await this.subjectModel
      .find({ _id: { $in: Array.from(subjectIdSet) } })
      .select('name code')
      .exec();
    const subjectNames = subjects.map((s: any) => s.name).join(', ') || 'the subject';

    if (classId) {
      const classDoc = await this.classModel.findById(classId).exec();
      if (classDoc?.classTeacher) classTeacherIds.add(classDoc.classTeacher.toString());
    }

    const recipients = new Set<string>([...classTeacherIds, ...subjectTeacherIds]);
    if (recipients.size) {
      await this.notificationsService.createMany(
        Array.from(recipients).map((recipientId) => ({
          recipientId,
          title: 'Marks approved',
          message: `${records.length} mark record(s) for ${subjectNames} were approved by ${approverName}. Marks are now final and locked.`,
          type: 'performance_approved',
          classId,
          performanceId: records[0]._id.toString(),
        })),
      );
    }

    return { count: records.length };
  }

  /**
   * Return marks back down the workflow for correction.
   * - Admin/SuperAdmin can return `pending_admin` marks back to the class teacher stage.
   * - Class teacher / admin can return `pending_class_teacher` marks back to the subject teacher (draft).
   */
  async returnMarks(dto: ReturnPerformanceDto, user?: any): Promise<{ count: number }> {
    if (!user) throw new ForbiddenException('Authentication required');

    let records: PerformanceDocument[];
    if (this.isAdmin(user)) {
      records = await this.buildBatch(dto, {
        status: { $in: [PERFORMANCE_STATUS.PENDING_ADMIN, PERFORMANCE_STATUS.PENDING_CLASS_TEACHER] },
      });
      if (!records.length) throw new BadRequestException('No pending marks found to return.');
    } else if (user.role === Role.ClassTeacher) {
      if (!dto.classId) throw new BadRequestException('classId is required');
      const classDoc = await this.classModel.findById(dto.classId).exec();
      if (!classDoc || classDoc.isDeleted) throw new NotFoundException('Class not found');
      if (!classDoc.classTeacher || classDoc.classTeacher.toString() !== user.id) {
        throw new ForbiddenException('You are not the class teacher for this class.');
      }
      records = await this.buildBatch(dto, { status: PERFORMANCE_STATUS.PENDING_CLASS_TEACHER });
      if (!records.length) throw new BadRequestException('No marks pending class teacher review found to return.');
    } else {
      throw new ForbiddenException('You do not have permission to return marks.');
    }

    const now = new Date();
    for (const rec of records) {
      if (rec.status === PERFORMANCE_STATUS.PENDING_ADMIN) {
        rec.status = PERFORMANCE_STATUS.PENDING_CLASS_TEACHER;
      } else {
        rec.status = PERFORMANCE_STATUS.RETURNED;
      }
      rec.returnedAt = now;
      rec.returnedReason = dto.reason || 'Returned for correction';
      await rec.save();
    }

    // Notify the relevant reviewer/entrant.
    const first = records[0];
    const targetRole = first.status === PERFORMANCE_STATUS.PENDING_CLASS_TEACHER ? 'class teacher' : 'subject teacher';
    if (first.classId) {
      const classDoc = await this.classModel.findById(first.classId).exec();
      if (classDoc) {
        // Who returned the marks.
        let returnedByName = user?.username || user?.email || 'A reviewer';
        if (user?.id) {
          const returner = await this.userModel.findById(user.id).select('firstName lastName username email').exec();
          if (returner) {
            const full = `${returner.firstName || ''} ${returner.lastName || ''}`.trim();
            returnedByName = full || returner.username || returner.email || returnedByName;
          }
        }

        // Subject name(s).
        const subjectIdSet = new Set<string>();
        for (const rec of records) {
          if (rec.subjectId) subjectIdSet.add(rec.subjectId.toString());
        }
        const subjects = await this.subjectModel
          .find({ _id: { $in: Array.from(subjectIdSet) } })
          .select('name')
          .exec();
        const subjectNames = subjects.map((s: any) => s.name).join(', ') || 'the subject';

        const recipients: string[] = [];
        if (first.status === PERFORMANCE_STATUS.PENDING_CLASS_TEACHER && classDoc.classTeacher) {
          recipients.push(classDoc.classTeacher.toString());
        }
        if (first.status === PERFORMANCE_STATUS.RETURNED && first.enteredBy) {
          recipients.push(first.enteredBy.toString());
        }
        if (recipients.length) {
          await this.notificationsService.createMany(
            recipients.map((recipientId) => ({
              recipientId,
              title: 'Marks returned for correction',
              message: `${records.length} mark record(s) for ${subjectNames} were returned to the ${targetRole} by ${returnedByName} for correction: ${dto.reason || 'No reason provided'}`,
              type: 'performance_returned',
              classId: classDoc._id.toString(),
              performanceId: first._id.toString(),
            })),
          );
        }
      }
    }

    return { count: records.length };
  }

  // ===== REPORT GENERATION =====

  async getStudentReport(studentId: string, academicYear: string, term: string, user?: any) {
    const student = await this.studentModel.findById(studentId).populate('classId', 'name section academicYear').exec();
    if (!student) throw new NotFoundException('Student not found');

    if (user?.role === Role.Parent) {
      if (!student.parentUserId || student.parentUserId.toString() !== user.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    const reportFilter: any = {
      studentId: studentId,
      isDeleted: false,
    };
    if (academicYear) {
      reportFilter.academicYear = academicYear;
    }
    if (term) {
      reportFilter.term = term;
    }

    const performances = await this.performanceModel
      .find(reportFilter)
      .populate('subjectId', 'name code')
      .sort({ examType: 1 })
      .exec();

    const examRecords = performances.map((p) => {
      const subj = p.subjectId as any;
      return {
        name: subj?.name || 'Unknown',
        code: subj?.code || '',
        examType: p.examType,
        score: p.score,
        grade: p.grade,
        remark: p.remark,
        points: p.points,
        academicYear: p.academicYear,
        term: p.term,
        status: p.status || PERFORMANCE_STATUS.DRAFT,
      };
    });

    const subjectSummaryMap = new Map<string, { subjectName: string; subjectCode: string; scores: number[]; points: number[] }>();
    for (const p of performances) {
      const subj = p.subjectId as any;
      const key = subj?._id?.toString() || 'unknown';
      if (!subjectSummaryMap.has(key)) {
        subjectSummaryMap.set(key, {
          subjectName: subj?.name || 'Unknown',
          subjectCode: subj?.code || '',
          scores: [],
          points: [],
        });
      }
      const entry = subjectSummaryMap.get(key)!;
      entry.scores.push(p.score);
      entry.points.push(p.points || 0);
    }

    const subjectSummaries = Array.from(subjectSummaryMap.values()).map((s) => ({
      subjectName: s.subjectName,
      subjectCode: s.subjectCode,
      averageScore: s.scores.length > 0 ? Math.round((s.scores.reduce((a, b) => a + b, 0) / s.scores.length) * 100) / 100 : 0,
      averagePoints: s.points.length > 0 ? s.points.reduce((a, b) => a + b, 0) / s.points.length : 0,
    }));

    const overallGPA = subjectSummaries.length > 0
      ? Math.min(
          Math.round((subjectSummaries.reduce((sum, s) => sum + s.averagePoints, 0) / subjectSummaries.length) * 100) / 100,
          5.0,
        )
      : 0;

    const ranking = await this.getClassRanking((student.classId as any)._id.toString(), academicYear, term);
    const studentRank = ranking.findIndex((r) => r.studentId === studentId) + 1;

    return {
      student: {
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        admissionNumber: student.admissionNumber,
        class: student.classId,
      },
      academicYear,
      term,
      subjects: examRecords,
      overallGPA,
      rank: studentRank,
      totalStudents: ranking.length,
    };
  }

  async getClassReport(classId: string, academicYear: string, term: string) {
    const classDoc = await this.classModel.findById(classId).exec();
    if (!classDoc) throw new NotFoundException('Class not found');

    const studentFilter: any = { classId, isActive: true, isDeleted: false };
    const students = await this.studentModel.find(studentFilter).sort({ lastName: 1, firstName: 1 }).exec();
    const subjectFilter: any = { classId, isDeleted: false };
    const subjects = await this.subjectModel.find(subjectFilter).exec();

    const classReportFilter: any = { classId, academicYear, term, isDeleted: false };
    const performances = await this.performanceModel
      .find(classReportFilter)
      .populate('studentId', 'firstName lastName admissionNumber')
      .populate('subjectId', 'name code')
      .exec();

    // Build a matrix: studentId -> subjectId -> scores
    const matrix: any[] = [];
    for (const student of students) {
      const sid = student._id.toString();
      const studentPerfs = performances.filter(p => (p.studentId as any)._id.toString() === sid);

      const subjectResults: any[] = [];
      let totalScore = 0;
      let subjectCount = 0;

      for (const subj of subjects) {
        const subjId = subj._id.toString();
        const subjPerfs = studentPerfs.filter(p => (p.subjectId as any)._id.toString() === subjId);

        if (subjPerfs.length > 0) {
          const avg = subjPerfs.reduce((acc, p) => acc + p.score, 0) / subjPerfs.length;
          const lastPerf = subjPerfs[subjPerfs.length - 1];
          subjectResults.push({
            subjectName: subj.name,
            subjectCode: subj.code,
            average: Math.round(avg * 100) / 100,
            grade: lastPerf.grade,
            remark: lastPerf.remark,
            status: lastPerf.status || PERFORMANCE_STATUS.DRAFT,
            scores: subjPerfs.map(p => ({ examType: p.examType, score: p.score, grade: p.grade, status: p.status })),
          });
          totalScore += avg;
          subjectCount++;
        } else {
          subjectResults.push({
            subjectName: subj.name,
            subjectCode: subj.code,
            average: null,
            grade: '-',
            remark: '-',
            scores: [],
          });
        }
      }

      const overallAverage = subjectCount > 0 ? Math.round((totalScore / subjectCount) * 100) / 100 : 0;
      matrix.push({
        studentId: sid,
        firstName: student.firstName,
        lastName: student.lastName,
        admissionNumber: student.admissionNumber,
        subjects: subjectResults,
        overallAverage,
      });
    }

    // Rank by overall average
    matrix.sort((a, b) => b.overallAverage - a.overallAverage);
    matrix.forEach((s, i) => (s.rank = i + 1));

    // Subject statistics
    const subjectStats = subjects.map(subj => {
      const subjId = subj._id.toString();
      const allScores = performances
        .filter(p => (p.subjectId as any)._id.toString() === subjId)
        .map(p => p.score);
      const avg = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
      const highest = allScores.length > 0 ? Math.max(...allScores) : 0;
      const lowest = allScores.length > 0 ? Math.min(...allScores) : 0;
      return {
        subjectName: subj.name,
        subjectCode: subj.code,
        average: Math.round(avg * 100) / 100,
        highest,
        lowest,
        totalEntries: allScores.length,
      };
    });

    return {
      class: { id: classDoc._id, name: classDoc.name, section: classDoc.section },
      academicYear,
      term,
      students: matrix,
      subjectStats,
      totalStudents: students.length,
    };
  }

  private async getClassRanking(classId: string, academicYear: string, term: string) {
    const rankStudentFilter: any = { classId, isActive: true, isDeleted: false };
    const students = await this.studentModel.find(rankStudentFilter).exec();
    const ranking: { studentId: string; average: number }[] = [];

    for (const student of students) {
      const sid = student._id.toString();
      const rankPerfFilter: any = { studentId: sid, academicYear, term, isDeleted: false };
      const perfs = await this.performanceModel.find(rankPerfFilter).exec();
      if (perfs.length > 0) {
        const subjectScores = new Map<string, number[]>();
        for (const p of perfs) {
          const key = p.subjectId.toString();
          if (!subjectScores.has(key)) subjectScores.set(key, []);
          subjectScores.get(key)!.push(p.score);
        }
        const subjectAvgs = Array.from(subjectScores.values()).map(
          scores => scores.reduce((a, b) => a + b, 0) / scores.length,
        );
        const avg = subjectAvgs.reduce((a, b) => a + b, 0) / subjectAvgs.length;
        ranking.push({ studentId: sid, average: Math.round(avg * 100) / 100 });
      }
    }

    ranking.sort((a, b) => b.average - a.average);
    return ranking;
  }

  async getCombinedClassRanking(classIds: string[], academicYear: string, term: string) {
    const allStudents: any[] = [];

    for (const classId of classIds) {
      const classDoc = await this.classModel.findById(classId).exec();
      const students = await this.studentModel.find({
        classId, isActive: true, isDeleted: false,
      } as any).exec();

      for (const student of students) {
        const sid = student._id.toString();
        const perfs = await this.performanceModel.find({
          studentId: sid, academicYear, term, isDeleted: false,
        } as any).exec();

        if (perfs.length > 0) {
          const subjectScores = new Map<string, number[]>();
          for (const p of perfs) {
            const key = p.subjectId.toString();
            if (!subjectScores.has(key)) subjectScores.set(key, []);
            subjectScores.get(key)!.push(p.score);
          }
          const subjectAvgs = Array.from(subjectScores.values()).map(
            scores => scores.reduce((a, b) => a + b, 0) / scores.length,
          );
          const avg = subjectAvgs.reduce((a, b) => a + b, 0) / subjectAvgs.length;

          allStudents.push({
            studentId: sid,
            firstName: student.firstName,
            lastName: student.lastName,
            admissionNumber: student.admissionNumber,
            className: classDoc ? `${classDoc.name}${classDoc.section ? ' ' + classDoc.section : ''}` : '',
            classId,
            overallAverage: Math.round(avg * 100) / 100,
            totalSubjects: subjectScores.size,
          });
        }
      }
    }

    allStudents.sort((a, b) => b.overallAverage - a.overallAverage);
    allStudents.forEach((s, i) => (s.rank = i + 1));

    return {
      academicYear, term,
      classIds,
      students: allStudents,
      totalStudents: allStudents.length,
    };
  }

  async getPerformanceStats() {
    const statsFilter: any = { isDeleted: false };
    const totalRecords = await this.performanceModel.countDocuments(statsFilter).exec();
    const approvedRecords = await this.performanceModel
      .countDocuments({ ...statsFilter, status: PERFORMANCE_STATUS.APPROVED })
      .exec();
    return { totalRecords, approvedRecords };
  }
}
