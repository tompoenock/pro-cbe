import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from '../auth/roles.enum';
import { Performance, PerformanceDocument } from './entities/performance.schema';
import { Student, StudentDocument } from '../students/entities/student.schema';
import { Subject, SubjectDocument } from '../subjects/entities/subject.schema';
import { Class, ClassDocument } from '../classes/entities/class.schema';
import { GradingService } from '../grading/grading.service';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { UpdatePerformanceDto, BulkPerformanceDto } from './dto/update-performance.dto';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(Performance.name) private performanceModel: Model<PerformanceDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
    private readonly gradingService: GradingService,
  ) {}

  private async applyGrade(score: number): Promise<{ grade: string; remark: string; points: number }> {
    const scale = await this.gradingService.findDefault();
    if (!scale) return { grade: 'N/A', remark: '', points: 0 };
    return this.gradingService.getGradeForScore(scale.grades, score);
  }

  async create(dto: CreatePerformanceDto): Promise<PerformanceDocument> {
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
      existing.score = dto.score;
      existing.grade = grade;
      existing.remark = remark;
      existing.points = points;
      return existing.save();
    }
    return this.performanceModel.create({ ...dto, grade, remark, points } as any);
  }

  async bulkCreate(dto: BulkPerformanceDto): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;
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
        existing.score = entry.score;
        existing.grade = grade;
        existing.remark = remark;
        existing.points = points;
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
        } as any);
        created++;
      }
    }
    return { created, updated };
  }

  async findAll(filters: {
    classId?: string;
    studentId?: string;
    subjectId?: string;
    academicYear?: string;
    term?: string;
    examType?: string;
  }): Promise<PerformanceDocument[]> {
    const query: any = { isDeleted: false };
    if (filters.classId) query.classId = filters.classId;
    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.subjectId) query.subjectId = filters.subjectId;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.term) query.term = filters.term;
    if (filters.examType) query.examType = filters.examType;

    return this.performanceModel.find(query)
      .populate('studentId', 'firstName lastName admissionNumber')
      .populate('subjectId', 'name code')
      .populate('classId', 'name section')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<PerformanceDocument> {
    const doc = await this.performanceModel.findById(id)
      .populate('studentId', 'firstName lastName admissionNumber')
      .populate('subjectId', 'name code')
      .populate('classId', 'name section')
      .exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Performance record not found');
    return doc;
  }

  async update(id: string, dto: UpdatePerformanceDto): Promise<PerformanceDocument> {
    const perf = await this.performanceModel.findById(id);
    if (!perf || perf.isDeleted) throw new NotFoundException('Performance record not found');
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
            scores: subjPerfs.map(p => ({ examType: p.examType, score: p.score, grade: p.grade })),
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
    return { totalRecords };
  }
}
