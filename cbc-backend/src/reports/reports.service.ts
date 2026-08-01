import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudentReport, StudentReportDocument } from './entities/student-report.schema';
import { SchoolReport, SchoolReportDocument } from './entities/school-report.schema';
import { Student, StudentDocument } from '../students/entities/student.schema';
import { StudentSubject, StudentSubjectDocument } from '../students/entities/student-subject.schema';
import { Pathway, PathwayDocument } from '../pathways/entities/pathway.schema';
import { PathwaysService } from '../pathways/pathways.service';
import { Performance, PerformanceDocument } from '../performance/entities/performance.schema';
import { Class, ClassDocument } from '../classes/entities/class.schema';
import { Subject, SubjectDocument } from '../subjects/entities/subject.schema';
import { CreateStudentReportDto, CreateSchoolReportDto } from './dto/create-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { PathwayReportQueryDto, ClassPathwayReportQueryDto } from './dto/pathway-report-query.dto';import { Role } from '../auth/roles.enum';
@Injectable()
export class ReportsService {
  private getCurrentAcademicYear(): string {
    return new Date().getFullYear().toString();
  }

  constructor(
    @InjectModel(StudentReport.name) private studentReportModel: Model<StudentReportDocument>,
    @InjectModel(SchoolReport.name) private schoolReportModel: Model<SchoolReportDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(StudentSubject.name) private studentSubjectModel: Model<StudentSubjectDocument>,
    @InjectModel(Pathway.name) private pathwayModel: Model<PathwayDocument>,
    @InjectModel(Performance.name) private performanceModel: Model<PerformanceDocument>,
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
    private pathwaysService: PathwaysService,
  ) {}

  /**
   * Generate a student report
   * Note: This service expects to receive pre-calculated data from controllers
   * that integrate with Performance, Pathways, and Students modules
   */
  async generateStudentReport(dto: CreateStudentReportDto, user?: any): Promise<StudentReportDocument> {
    if (!Types.ObjectId.isValid(dto.studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    const studentId = new Types.ObjectId(dto.studentId);
    const reportType = dto.reportType || 'comprehensive';

    if (user?.role === Role.Parent) {
      const student = await this.studentModel.findById(studentId).exec();
      if (!student || !student.parentUserId || student.parentUserId.toString() !== user.id) {
        throw new ForbiddenException('You can only generate reports for your own child.');
      }
    }

    const reportPeriod = {
      startDate: dto.startDate ? new Date(dto.startDate) : new Date(new Date().getFullYear(), 0, 1),
      endDate: dto.endDate ? new Date(dto.endDate) : new Date(),
    };

    const reportData: any = {
      studentId,
      reportType,
      generatedDate: new Date(),
      reportPeriod,
      teacherNotes: dto.teacherNotes,
      parentViewable: true,
    };

    if (user?.id) {
      reportData.createdBy = new Types.ObjectId(user.id);
    }

    if (reportType !== 'pathway') {
      reportData.performanceSummary = await this.buildPerformanceSummary(studentId, reportPeriod.startDate, reportPeriod.endDate);
    }

    if (reportType !== 'performance') {
      reportData.pathwayRecommendation = await this.buildPathwayRecommendation(
        studentId,
        reportData.performanceSummary,
        reportPeriod.startDate,
        reportPeriod.endDate,
        user,
      );
    }

    reportData.reportSummary = this.buildReportSummary(reportType, reportData.performanceSummary, reportData.pathwayRecommendation, reportPeriod);

    const report = new this.studentReportModel(reportData as any);
    const createdReport = await report.save();
    return this.getStudentReport(createdReport._id.toString(), user);
  }

  /**
   * Get student reports
   */
  async getStudentReports(
    query: ReportQueryDto,
  ): Promise<{ data: StudentReportDocument[]; total: number }> {
    const filter: any = { isDeleted: false };

    if (query.studentId) {
      if (!Types.ObjectId.isValid(query.studentId)) {
        throw new BadRequestException('Invalid student ID');
      }
      filter.studentId = new Types.ObjectId(query.studentId);
    }

    if (query.reportType) {
      filter.reportType = query.reportType;
    }

    const limit = Math.min(query.limit || 50, 100);
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.studentReportModel
        .find(filter)
        .populate('studentId', 'firstName lastName admissionNumber')
        .populate('createdBy', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ generatedDate: -1 })
        .exec(),
      this.studentReportModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  /**
   * Get a single student report
   */
  async getStudentReport(reportId: string, user?: any): Promise<StudentReportDocument> {
    if (!Types.ObjectId.isValid(reportId)) {
      throw new BadRequestException('Invalid report ID');
    }

    const report = await this.studentReportModel
      .findById(reportId)
      .populate('studentId', 'firstName lastName admissionNumber parentUserId')
      .populate('createdBy', 'firstName lastName')
      .exec();

    if (!report || report.isDeleted) {
      throw new NotFoundException('Report not found');
    }

    if (user?.role === Role.Parent) {
      if (!report.parentViewable) {
        throw new ForbiddenException('Access denied');
      }

      let student = report.studentId as any;
      if (!student || !student.parentUserId) {
        student = await this.studentModel.findById(report.studentId).exec();
      }
      if (!student || !student.parentUserId || student.parentUserId.toString() !== user.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    return report;
  }

  /**
   * Get reports for a specific student
   */
  async getStudentReportsByStudentId(studentId: string, user?: any): Promise<StudentReportDocument[]> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    // Build base filter
    const filter: any = {
      studentId: studentId as any,
      isDeleted: false,
    };

    // If request is from a parent, verify ownership and only return parent-viewable reports
    if (user?.role === Role.Parent) {
      const student = await this.studentModel.findById(studentId).exec();
      if (!student || !student.parentUserId || student.parentUserId.toString() !== user.id) {
        throw new ForbiddenException('Access denied');
      }
      filter.parentViewable = true;
    }

    // For Admin/Teacher/SuperAdmin users, do not restrict by parentViewable
    return this.studentReportModel
      .find(filter)
      .populate('studentId', 'firstName lastName admissionNumber parentUserId')
      .populate('createdBy', 'firstName lastName')
      .sort({ generatedDate: -1 })
      .exec();
  }

  private async buildPerformanceSummary(studentId: Types.ObjectId, startDate: Date, endDate: Date): Promise<any> {
    const performanceFilter: any = {
      studentId,
      isDeleted: false,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    let performances: any[] = await this.performanceModel
      .find(performanceFilter)
      .populate('subjectId', 'name code')
      .exec();

    if (!performances.length) {
      performances = await this.performanceModel
        .find({ studentId: studentId as any, isDeleted: false } as any)
        .populate('subjectId', 'name code')
        .exec();
    }

    const subjectScores: Record<string, { averageScore: number; records: number }> = {};
    const gradeDistribution: Record<string, number> = {};
    const termTrends: Record<string, { averageScore: number; records: number }> = {};
    let totalScore = 0;

    for (const perf of performances) {
      const subjectName = (perf.subjectId as any)?.name || 'Unknown Subject';
      if (!subjectScores[subjectName]) {
        subjectScores[subjectName] = { averageScore: 0, records: 0 };
      }
      subjectScores[subjectName].averageScore += perf.score;
      subjectScores[subjectName].records += 1;
      totalScore += perf.score;

      if (perf.grade) {
        gradeDistribution[perf.grade] = (gradeDistribution[perf.grade] || 0) + 1;
      }

      if (perf.term) {
        if (!termTrends[perf.term]) {
          termTrends[perf.term] = { averageScore: 0, records: 0 };
        }
        termTrends[perf.term].averageScore += perf.score;
        termTrends[perf.term].records += 1;
      }
    }

    const subjectSummary = Object.keys(subjectScores).map((subjectName) => {
      const subject = subjectScores[subjectName];
      return {
        subjectName,
        averageScore: Math.round((subject.averageScore / subject.records) * 100) / 100,
        records: subject.records,
      };
    }).sort((a, b) => b.averageScore - a.averageScore);

    const strengths = subjectSummary
      .filter((subject) => subject.averageScore >= 75)
      .map((subject) => subject.subjectName)
      .slice(0, 3);

    const weaknesses = subjectSummary
      .filter((subject) => subject.averageScore < 60)
      .map((subject) => subject.subjectName)
      .slice(0, 3);

    const trendSummary = Object.keys(termTrends).map((term) => {
      const trend = termTrends[term];
      return {
        term,
        averageScore: Math.round((trend.averageScore / trend.records) * 100) / 100,
      };
    });

    const overallScore = performances.length > 0 ? Math.round((totalScore / performances.length) * 100) / 100 : 0;
    const overallGPA = performances.length > 0 ? Math.round((overallScore / 20) * 100) / 100 : 0;

    const summaryLines = [
      `This report covers performance from ${startDate.toDateString()} to ${endDate.toDateString()}.`,
      `Overall score: ${overallScore}, GPA: ${Math.min(overallGPA, 5.0)}.`,
    ];

    if (strengths.length) {
      summaryLines.push(`Top subjects: ${strengths.join(', ')}.`);
    }
    if (weaknesses.length) {
      summaryLines.push(`Areas for improvement: ${weaknesses.join(', ')}.`);
    }

    return {
      overallGPA: Math.min(overallGPA, 5.0),
      overallScore,
      totalRecords: performances.length,
      subjectScores: subjectSummary,
      gradeDistribution,
      trends: trendSummary,
      strengths,
      weaknesses,
      summary: summaryLines.join(' '),
    };
  }

  private buildReportSummary(
    reportType: string,
    performanceSummary: any,
    pathwayRecommendation: any,
    reportPeriod: { startDate: Date; endDate: Date },
  ): string {
    const summaryLines: string[] = [];
    summaryLines.push(`This ${reportType} report covers ${reportPeriod.startDate.toDateString()} to ${reportPeriod.endDate.toDateString()}.`);

    if (performanceSummary) {
      summaryLines.push(`The student achieved an overall score of ${performanceSummary.overallScore} with a GPA of ${performanceSummary.overallGPA}.`);
      if (performanceSummary.strengths?.length) {
        summaryLines.push(`Strong subjects are ${performanceSummary.strengths.join(', ')}.`);
      }
      if (performanceSummary.weaknesses?.length) {
        summaryLines.push(`Improvement needed in ${performanceSummary.weaknesses.join(', ')}.`);
      }
    }

    if (pathwayRecommendation) {
      const pathwayName = pathwayRecommendation.recommendedPathway?.name || 'a recommended pathway';
      summaryLines.push(`Recommended pathway: ${pathwayName}.`);
      if (pathwayRecommendation.averageMatchScore !== undefined) {
        summaryLines.push(`Match score for pathway subjects is ${pathwayRecommendation.averageMatchScore}.`);
      }
    }

    return summaryLines.join(' ');
  }

  private async buildPathwayRecommendation(
    studentId: Types.ObjectId,
    performanceSummary: any,
    startDate: Date,
    endDate: Date,
    user?: any,
  ): Promise<any> {
    const academicYear = startDate?.getFullYear()?.toString() || this.getCurrentAcademicYear();
    const recommendations = await this.pathwaysService.getPathwayRecommendationsByGPA(
      studentId.toString(),
      academicYear,
      undefined,
      user,
    );

    const recommendationEntries: any[] = [];
    for (const pathways of recommendations.groupedBySubjectPerformance.values()) {
      recommendationEntries.push(...pathways);
    }

    recommendationEntries.sort((a, b) => (b.studentMatchScore || 0) - (a.studentMatchScore || 0));

    const best = recommendationEntries[0] || recommendations.recommendedPathways[0] || null;
    if (!best) {
      return {
        recommendedPathway: null,
        rationale: 'No pathway recommendations available',
      };
    }

    const recommendedPathway = {
      id: best._id?.toString() || best.id,
      name: best.name,
      code: best.code,
      description: best.description,
      minimumGPA: best.minimumGPA,
      gpaRange: best.gpaRange || null,
      requiredSubjects: best.requiredSubjects,
    };

    const pathwayMinGPA = best.gpaRange?.minimumGPA ?? best.minimumGPA ?? 0;
    const pathwayMaxGPA = best.gpaRange?.maximumGPA ?? null;
    const meetsMinGPA = recommendations.studentGPA >= pathwayMinGPA;
    const meetsMaxGPA = pathwayMaxGPA !== null && pathwayMaxGPA !== undefined
      ? recommendations.studentGPA <= pathwayMaxGPA
      : true;

    return {
      recommendedPathway,
      averageMatchScore: best.studentMatchScore ?? 0,
      matchingSubjects: best.matchingSubjectGPAs || best.matchingSubjects || [],
      studentGPA: recommendations.studentGPA,
      meetsMinimumGPA: meetsMinGPA && meetsMaxGPA,
    };
  }
  /**
   * Generate school report
   */
  async generateSchoolReport(
    dto: CreateSchoolReportDto,
    userId?: string,
  ): Promise<SchoolReportDocument> {
    const report = new this.schoolReportModel({
      reportPeriod: {
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
      reportType: 'school',
      generatedDate: new Date(),
      generatedBy: userId ? new Types.ObjectId(userId) : undefined,
    });

    return report.save();
  }

  /**
   * Generate a per-pathway school report
   * Computes the live pathway report and stores it as a SchoolReport
   * scoped to a single registered pathway.
   */
  async generatePathwaySchoolReport(
    dto: { pathwayId: string; startDate?: string; endDate?: string },
    userId?: string,
  ): Promise<SchoolReportDocument> {
    if (!Types.ObjectId.isValid(dto.pathwayId)) {
      throw new BadRequestException('Invalid pathway ID');
    }

    const pathway = await this.pathwayModel.findById(dto.pathwayId).exec();
    if (!pathway || pathway.isDeleted) {
      throw new NotFoundException('Pathway not found');
    }

    const pathwayReport = await this.getPathwayReport({ pathwayId: dto.pathwayId });

    const data = pathwayReport.data || [];
    const entry = data[0] || null;
    const stats = entry?.statistics || {};
    const totalStudents = stats.totalStudents || 0;

    const report = new this.schoolReportModel({
      reportPeriod: {
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(new Date().getFullYear(), 0, 1),
        endDate: dto.endDate ? new Date(dto.endDate) : new Date(),
      },
      totalStudents,
      pathwayDistribution: pathway.name ? { [pathway.name]: totalStudents } : undefined,
      performanceStatistics: {
        pathwayId: (pathway as any)._id,
        pathwayName: pathway.name,
        pathwayCode: pathway.code,
        ...pathwayReport,
      },
      reportType: 'pathway',
      pathway: (pathway as any)._id,
      generatedDate: new Date(),
      generatedBy: userId ? new Types.ObjectId(userId) : undefined,
    });

    return report.save();
  }

  /**
   * Get school reports
   */
  async getSchoolReports(): Promise<SchoolReportDocument[]> {
    return this.schoolReportModel
      .find({ isDeleted: false })
      .populate('generatedBy', 'firstName lastName')
      .populate('pathway', 'name code')
      .sort({ generatedDate: -1 })
      .exec();
  }

  /**
   * Get a single school report
   */
  async getSchoolReport(reportId: string): Promise<SchoolReportDocument> {
    if (!Types.ObjectId.isValid(reportId)) {
      throw new BadRequestException('Invalid report ID');
    }

    const report = await this.schoolReportModel
      .findById(reportId)
      .populate('generatedBy', 'firstName lastName')
      .populate('pathway', 'name code')
      .exec();

    if (!report || report.isDeleted) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  /**
   * Update report (add data after generation)
   */
  async updateReport(
    reportId: string,
    data: Partial<StudentReportDocument>,
  ): Promise<StudentReportDocument> {
    if (!Types.ObjectId.isValid(reportId)) {
      throw new BadRequestException('Invalid report ID');
    }

    const report = await this.studentReportModel.findByIdAndUpdate(
      reportId,
      {
        ...data,
        lastModified: new Date(),
      },
      { returnDocument: 'after' }
    ).exec();

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  /**
   * Delete (soft delete) a report
   */
  async deleteReport(reportId: string, user?: any): Promise<void> {
    if (!Types.ObjectId.isValid(reportId)) {
      throw new BadRequestException('Invalid report ID');
    }

    const report = await this.studentReportModel
      .findById(reportId)
      .populate('studentId', 'parentUserId')
      .exec();

    if (!report || report.isDeleted) {
      throw new NotFoundException('Report not found');
    }

    if (user?.role === Role.Parent) {
      const studentId = (report.studentId as any)?._id || report.studentId;
      const student = await this.studentModel.findOne({
        _id: studentId,
        parentUserId: user.id,
      }).exec();

      if (!student) {
        throw new ForbiddenException('Access denied');
      }
    }

    await this.studentReportModel.findByIdAndUpdate(reportId, { isDeleted: true }).exec();
  }

  /**
   * Get analytics on reports
   */
  async getReportAnalytics(): Promise<any> {
    const totalReports = await this.studentReportModel.countDocuments({ isDeleted: false });
    
    const reportsByType = await this.studentReportModel.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$reportType', count: { $sum: 1 } } },
    ]);

    const reportsThisMonth = await this.studentReportModel.countDocuments({
      isDeleted: false,
      generatedDate: {
        $gte: new Date(new Date().setDate(1)),
      },
    });

    return {
      totalReports,
      reportsByType,
      reportsThisMonth,
    };
  }

  /**
   * Get pathway-based report grouped by pathway and class
   * Shows each pathway group with its students and their progress
   */
  async getPathwayReport(query: PathwayReportQueryDto): Promise<any> {
    const academicYear = query.academicYear || this.getCurrentAcademicYear();

    if (query.classId && !Types.ObjectId.isValid(query.classId)) {
      throw new BadRequestException('Invalid class ID');
    }

    if (query.pathwayId && !Types.ObjectId.isValid(query.pathwayId)) {
      throw new BadRequestException('Invalid pathway ID');
    }

    // Verify class exists if specified
    if (query.classId) {
      const classDoc = await this.classModel.findById(query.classId);
      if (!classDoc) {
        throw new NotFoundException('Class not found');
      }
    }

    const limit = Math.min(query.limit || 50, 100);
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    // Get pathways (filter if pathwayId provided)
    const pathwayFilter: any = { isActive: true, isDeleted: false };
    if (query.pathwayId) {
      pathwayFilter._id = new Types.ObjectId(query.pathwayId);
    }

    const pathways = await this.pathwayModel
      .find(pathwayFilter)
      .populate('requiredSubjects', 'name code')
      .sort({ name: 1 })
      .exec();

    const reportData: any[] = [];

    for (const pathway of pathways) {
      // Get students in this pathway
      const pathwayStudentFilter: any = {
        pathwayId: (pathway as any)._id,
        status: { $in: ['approved', 'active'] },
        isDeleted: false,
      };

      let pathwayStudents = await this.performanceModel.aggregate([
        {
          $match: {
            isDeleted: false,
            academicYear,
            ...(query.term ? { term: query.term } : {}),
          },
        },
        {
          $group: {
            _id: '$studentId',
            scores: { $push: '$score' },
            grades: { $push: '$grade' },
            averageScore: { $avg: '$score' },
            recordCount: { $sum: 1 },
          },
        },
        {
          $sort: { averageScore: -1 },
        },
      ]);

      // If class filter specified, get only students in that class
      if (query.classId) {
        const classStudents = await this.studentModel.find({
          classId: query.classId as any,
          isDeleted: false,
        } as any);

        const classStudentIds = classStudents.map((s) => (s as any)._id);
        pathwayStudents = pathwayStudents.filter((ps) =>
          classStudentIds.some((id) => id.equals(ps._id)),
        );
      }

      // Get detailed information for each student
      const studentDetails: any[] = [];

      for (const ps of pathwayStudents.slice(skip, skip + limit)) {
        const student = await this.studentModel.findById(ps._id).populate('classId');
        if (!student || student.isDeleted) continue;

        // Get performance records
        const performances = await this.performanceModel.find({
          studentId: ps._id,
          academicYear,
          ...(query.term ? { term: query.term } : {}),
          isDeleted: false,
        });

        if (performances.length === 0) continue;

        const averageScore =
          performances.length > 0
            ? Math.round(
                (performances.reduce((sum, p) => sum + p.score, 0) / performances.length) *
                  100,
              ) / 100
            : 0;

        // Enforce pathway GPA range — only place student if score fits this pathway
        const studentGPA = Math.min(Math.round((averageScore / 20) * 100) / 100, 5.0);
        const pathwayMinGPA = (pathway as any)?.gpaRange?.minimumGPA ?? (pathway as any)?.minimumGPA ?? null;
        const pathwayMaxGPA = (pathway as any)?.gpaRange?.maximumGPA ?? null;

        if (
          (pathwayMinGPA !== null && pathwayMinGPA !== undefined && studentGPA < pathwayMinGPA) ||
          (pathwayMaxGPA !== null && pathwayMaxGPA !== undefined && studentGPA > pathwayMaxGPA)
        ) {
          continue;
        }

        // Get subjects enrolled by this student
        const studentSubjects = await this.studentSubjectModel.find({
          studentId: ps._id,
          academicYear,
          isDeleted: false,
        });

        // Calculate progress metrics
        const enrolledSubjects = studentSubjects.length;
        const distinctSubjectsWithRecords = new Set(
          performances.map((p) => (p.subjectId as any)?.toString?.() || ''),
        ).size;
        const completionRate =
          enrolledSubjects > 0
            ? Math.round((distinctSubjectsWithRecords / enrolledSubjects) * 100)
            : 0;

        // Count grades
        const gradeCount: Record<string, number> = {};
        performances.forEach((p) => {
          if (p.grade) {
            gradeCount[p.grade] = (gradeCount[p.grade] || 0) + 1;
          }
        });

        studentDetails.push({
          studentId: (student as any)._id,
          studentName: `${student.firstName} ${student.lastName}`,
          admissionNumber: student.admissionNumber,
          class: (student.classId as any)?.name || 'N/A',
          enrolledSubjects,
          performanceRecords: performances.length,
          subjectsWithRecords: distinctSubjectsWithRecords,
          completionRate,
          averageScore,
          highestScore: performances.length > 0 ? Math.max(...performances.map((p) => p.score)) : 0,
          lowestScore: performances.length > 0 ? Math.min(...performances.map((p) => p.score)) : 0,
          gradeDistribution: gradeCount,
          lastUpdated: performances.length > 0 ? performances[performances.length - 1].createdAt : null,
        });
      }

      // Calculate pathway-level statistics
      const pathwayStats = {
        totalStudents: pathwayStudents.length,
        averageCompletionRate:
          studentDetails.length > 0
            ? Math.round(
                (studentDetails.reduce((sum, s) => sum + s.completionRate, 0) /
                  studentDetails.length) *
                  100,
              ) / 100
            : 0,
        averageScore:
          studentDetails.length > 0
            ? Math.round(
                (studentDetails.reduce((sum, s) => sum + s.averageScore, 0) /
                  studentDetails.length) *
                  100,
              ) / 100
            : 0,
        highPerformers: studentDetails.filter((s) => s.averageScore >= 80).length,
        averagePerformers: studentDetails.filter(
          (s) => s.averageScore >= 60 && s.averageScore < 80,
        ).length,
        needsSupport: studentDetails.filter((s) => s.averageScore < 60).length,
      };

      reportData.push({
        pathway: {
          id: (pathway as any)._id,
          code: pathway.code,
          name: pathway.name,
          description: pathway.description,
          pathwayType: pathway.pathwayType,
          requiredSubjects: pathway.requiredSubjects,
        },
        statistics: pathwayStats,
        students: studentDetails,
      });
    }

    return {
      generatedDate: new Date(),
      filters: {
        pathwayId: query.pathwayId || 'all',
        classId: query.classId || 'all',
        academicYear,
        term: query.term || 'all',
      },
      totalPathways: pathways.length,
      data: reportData,
    };
  }

  /**
   * Get class pathway report - shows all pathways and their students in a specific class
   */
  async getClassPathwayReport(query: ClassPathwayReportQueryDto): Promise<any> {
    const academicYear = query.academicYear || this.getCurrentAcademicYear();

    if (!Types.ObjectId.isValid(query.classId)) {
      throw new BadRequestException('Invalid class ID');
    }

    // Verify class exists
    const classDoc = await this.classModel.findById(query.classId);
    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    // Get all students in the class
    const classStudents = await this.studentModel.find({
      classId: query.classId as any,
      isDeleted: false,
    } as any);

    const classStudentIds = classStudents.map((s) => (s as any)._id);

    // Get all pathways
    const pathways = await this.pathwayModel
      .find({ isActive: true, isDeleted: false })
      .populate('requiredSubjects', 'name code')
      .sort({ name: 1 })
      .exec();

    const reportData: any[] = [];

    for (const pathway of pathways) {
      // Get performances for students in this class
      const performances = await this.performanceModel.find({
        studentId: { $in: classStudentIds },
        academicYear,
        ...(query.term ? { term: query.term } : {}),
        isDeleted: false,
      });

      // Group performances by student
      const studentPerformanceMap = new Map<string, any[]>();
      performances.forEach((p) => {
        const studentId = (p.studentId as any).toString();
        if (!studentPerformanceMap.has(studentId)) {
          studentPerformanceMap.set(studentId, []);
        }
        studentPerformanceMap.get(studentId)!.push(p);
      });

      // Get detailed information for each student with performance
      const studentDetails: any[] = [];

      for (const student of classStudents) {
        const studentId = (student as any)._id.toString();
        const studentPerfs = studentPerformanceMap.get(studentId) || [];

        if (studentPerfs.length === 0) continue;

        // Calculate metrics
        const averageScore =
          studentPerfs.length > 0
            ? Math.round(
                (studentPerfs.reduce((sum, p) => sum + p.score, 0) / studentPerfs.length) *
                  100,
              ) / 100
            : 0;

        // Convert average score (0-100) to GPA on 0-5 scale (same formula as buildPerformanceSummary)
        const studentGPA = Math.min(Math.round((averageScore / 20) * 100) / 100, 5.0);

        // If pathway has a GPA range or minimum/maximum constraints, enforce them
        const pathwayMinGPA = (pathway as any)?.gpaRange?.minimumGPA ?? (pathway as any)?.minimumGPA ?? null;
        const pathwayMaxGPA = (pathway as any)?.gpaRange?.maximumGPA ?? null;

        if (
          (pathwayMinGPA !== null && pathwayMinGPA !== undefined && studentGPA < pathwayMinGPA) ||
          (pathwayMaxGPA !== null && pathwayMaxGPA !== undefined && studentGPA > pathwayMaxGPA)
        ) {
          // student doesn't fall into this pathway's GPA range - skip
          continue;
        }

        const gradeCount: Record<string, number> = {};
        studentPerfs.forEach((p) => {
          if (p.grade) {
            gradeCount[p.grade] = (gradeCount[p.grade] || 0) + 1;
          }
        });

        studentDetails.push({
          studentId: (student as any)._id,
          studentName: `${student.firstName} ${student.lastName}`,
          admissionNumber: student.admissionNumber,
          performanceRecords: studentPerfs.length,
          averageScore,
          studentGPA,
          highestScore: Math.max(...studentPerfs.map((p) => p.score)),
          lowestScore: Math.min(...studentPerfs.map((p) => p.score)),
          gradeDistribution: gradeCount,
        });
      }

      // Calculate pathway statistics
      const pathwayStats = {
        totalStudents: studentDetails.length,
        averageScore:
          studentDetails.length > 0
            ? Math.round(
                (studentDetails.reduce((sum, s) => sum + s.averageScore, 0) /
                  studentDetails.length) *
                  100,
              ) / 100
            : 0,
        highPerformers: studentDetails.filter((s) => s.averageScore >= 80).length,
        averagePerformers: studentDetails.filter(
          (s) => s.averageScore >= 60 && s.averageScore < 80,
        ).length,
        needsSupport: studentDetails.filter((s) => s.averageScore < 60).length,
      };

      reportData.push({
        pathway: {
          id: (pathway as any)._id,
          code: pathway.code,
          name: pathway.name,
          description: pathway.description,
          pathwayType: pathway.pathwayType,
          requiredSubjects: pathway.requiredSubjects,
        },
        statistics: pathwayStats,
        students: studentDetails,
      });
    }

    return {
      generatedDate: new Date(),
      class: {
        id: classDoc._id,
        name: classDoc.name,
        section: classDoc.section,
        academicYear: classDoc.academicYear,
      },
      filters: {
        academicYear: query.academicYear || 'all',
        term: query.term || 'all',
      },
      totalPathways: pathways.length,
      totalClassStudents: classStudents.length,
      studentsWithPerformance: reportData.reduce((sum, p) => sum + p.students.length, 0),
      data: reportData,
    };
  }

  /**
   * Generate and persist a class summary as a SchoolReport document.
   */
  async generateClassSummaryReport(dto: any, user?: any): Promise<SchoolReportDocument> {
    if (!Types.ObjectId.isValid(dto.classId)) {
      throw new BadRequestException('Invalid class ID');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    // Reuse existing class pathway report builder to get detailed data
    const classReport = await this.getClassPathwayReport({
      classId: dto.classId,
      academicYear: dto.academicYear,
      term: dto.term,
      limit: dto.limit,
      page: dto.page,
    } as any);

    const classDoc = await this.classModel.findById(dto.classId).exec();
    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    const schoolReportData: any = {
      reportPeriod: { startDate, endDate },
      generatedDate: new Date(),
      generatedBy: user?.id ? new Types.ObjectId(user.id) : undefined,
      totalStudents: classReport.totalClassStudents,
      pathwayDistribution: {},
      performanceStatistics: classReport,
    };

    // Build a simple pathway distribution summary from classReport.data
    try {
      for (const entry of classReport.data || []) {
        const pathwayName = entry.pathway?.name || 'Unknown';
        schoolReportData.pathwayDistribution[pathwayName] = entry.statistics?.totalStudents || 0;
      }
    } catch (e) {
      // ignore distribution build errors
    }

    const report = new this.schoolReportModel(schoolReportData as any);
    return report.save();
  }

  /**
   * Get student progress summary for a specific pathway
   */
  async getStudentPathwayProgress(
    studentId: string,
    pathwayId: string,
    academicYear?: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    if (!Types.ObjectId.isValid(pathwayId)) {
      throw new BadRequestException('Invalid pathway ID');
    }

    // Get student
    const student = await this.studentModel.findById(studentId).populate('classId');
    if (!student || student.isDeleted) {
      throw new NotFoundException('Student not found');
    }

    // Get pathway
    const pathway = await this.pathwayModel.findById(pathwayId).populate('requiredSubjects');
    if (!pathway || pathway.isDeleted) {
      throw new NotFoundException('Pathway not found');
    }

    // Get student's subjects
    const studentSubjects = await this.studentSubjectModel
      .find({
        studentId: studentId as any,
        academicYear: academicYear || new Date().getFullYear().toString(),
        isDeleted: false,
      } as any)
      .populate('subjectId', 'name code');

    // Get performance records
    const filter: any = {
      studentId,
      isDeleted: false,
    };
    if (academicYear) {
      filter.academicYear = academicYear;
    }

    const performances = await this.performanceModel
      .find(filter)
      .populate('subjectId', 'name code');

    // Group performances by subject
    const subjectPerformanceMap = new Map<string, any[]>();
    performances.forEach((p) => {
      const subjectId = (p.subjectId as any)?._id?.toString() || '';
      if (!subjectPerformanceMap.has(subjectId)) {
        subjectPerformanceMap.set(subjectId, []);
      }
      subjectPerformanceMap.get(subjectId)!.push(p);
    });

    // Calculate subject-wise progress
    const subjectProgress: any[] = [];
    for (const ss of studentSubjects) {
      const subject = ss.subjectId as any;
      const subjectId = subject._id.toString();
      const subjectPerfs = subjectPerformanceMap.get(subjectId) || [];

      const averageScore =
        subjectPerfs.length > 0
          ? Math.round(
              (subjectPerfs.reduce((sum, p) => sum + p.score, 0) / subjectPerfs.length) * 100,
            ) / 100
          : 0;

      const gradeCount: Record<string, number> = {};
      subjectPerfs.forEach((p) => {
        if (p.grade) {
          gradeCount[p.grade] = (gradeCount[p.grade] || 0) + 1;
        }
      });

      subjectProgress.push({
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        recordCount: subjectPerfs.length,
        averageScore,
        highestScore: subjectPerfs.length > 0 ? Math.max(...subjectPerfs.map((p) => p.score)) : 0,
        lowestScore: subjectPerfs.length > 0 ? Math.min(...subjectPerfs.map((p) => p.score)) : 0,
        gradeDistribution: gradeCount,
      });
    }

    // Overall statistics
    const overallAverageScore =
      performances.length > 0
        ? Math.round(
            (performances.reduce((sum, p) => sum + p.score, 0) / performances.length) * 100,
          ) / 100
        : 0;

    const overallGradeCount: Record<string, number> = {};
    performances.forEach((p) => {
      if (p.grade) {
        overallGradeCount[p.grade] = (overallGradeCount[p.grade] || 0) + 1;
      }
    });

    return {
      student: {
        id: (student as any)._id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        class: (student.classId as any)?.name || 'N/A',
      },
      pathway: {
        id: (pathway as any)._id,
        code: pathway.code,
        name: pathway.name,
        type: pathway.pathwayType,
      },
      enrollmentInfo: {
        totalEnrolledSubjects: studentSubjects.length,
        subjectsWithPerformance: subjectProgress.filter((sp) => sp.recordCount > 0).length,
        totalPerformanceRecords: performances.length,
      },
      overallProgress: {
        averageScore: overallAverageScore,
        highestScore: performances.length > 0 ? Math.max(...performances.map((p) => p.score)) : 0,
        lowestScore: performances.length > 0 ? Math.min(...performances.map((p) => p.score)) : 0,
        gradeDistribution: overallGradeCount,
        completionRate:
          studentSubjects.length > 0
            ? Math.round(
                (subjectProgress.filter((sp) => sp.recordCount > 0).length /
                  studentSubjects.length) *
                  100,
              )
            : 0,
      },
      subjectProgress,
      generatedDate: new Date(),
    };
  }
}
