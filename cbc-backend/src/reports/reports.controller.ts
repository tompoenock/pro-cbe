import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateStudentReportDto, CreateSchoolReportDto, CreateClassSummaryReportDto, CreatePathwaySchoolReportDto } from './dto/create-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { PathwayReportQueryDto, ClassPathwayReportQueryDto } from './dto/pathway-report-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Generate a student report
   */
  @Post('student')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.Parent)
  generateStudentReport(@Body() dto: CreateStudentReportDto, @Req() req: any) {
    dto = { ...dto };
    return this.reportsService.generateStudentReport(dto, req.user);
  }

  /**
   * Get all student reports
   */
  @Get('student/all')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  getAllStudentReports(@Query() query: ReportQueryDto) {
    return this.reportsService.getStudentReports(query);
  }

  /**
   * Get reports for a specific student (by student or parent)
   */
  @Get('student/by-student/:studentId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.Parent)
  getStudentReportsByStudentId(@Param('studentId') studentId: string, @Req() req: any) {
    return this.reportsService.getStudentReportsByStudentId(studentId, req.user);
  }

  /**
   * Get a single student report
   */
  @Get('student/:reportId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.Parent)
  getStudentReport(@Param('reportId') reportId: string, @Req() req: any) {
    return this.reportsService.getStudentReport(reportId, req.user);
  }

  /**
   * Generate a school report
   */
  @Post('school')
  @Roles(Role.Admin, Role.SuperAdmin)
  generateSchoolReport(@Body() dto: CreateSchoolReportDto, @Req() req: any) {
    return this.reportsService.generateSchoolReport(dto, req.user.id);
  }

  /**
   * Generate a class summary report (school-level summary for a class)
   */
  @Post('school/class')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  generateClassSummaryReport(@Body() dto: CreateClassSummaryReportDto, @Req() req: any) {
    return this.reportsService.generateClassSummaryReport(dto, req.user);
  }

  /**
   * Generate a per-pathway school report
   * Stores a SchoolReport scoped to a single registered pathway
   */
  @Post('school/pathway')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  generatePathwaySchoolReport(@Body() dto: CreatePathwaySchoolReportDto, @Req() req: any) {
    return this.reportsService.generatePathwaySchoolReport(dto, req.user.id);
  }

  /**
   * Get all school reports
   */
  @Get('school/all')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  getAllSchoolReports() {
    return this.reportsService.getSchoolReports();
  }

  /**
   * Get a single school report
   */
  @Get('school/:reportId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  getSchoolReport(@Param('reportId') reportId: string) {
    return this.reportsService.getSchoolReport(reportId);
  }

  /**
   * Get report analytics
   */
  @Get('analytics/summary')
  @Roles(Role.Admin, Role.SuperAdmin)
  getAnalytics() {
    return this.reportsService.getReportAnalytics();
  }

  /**
   * Delete a report
   */
  @Delete(':reportId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Parent)
  deleteReport(@Param('reportId') reportId: string, @Req() req: any) {
    return this.reportsService.deleteReport(reportId, req.user);
  }

  // ===== Pathway-Based Reports =====

  /**
   * Get pathway report - grouped by pathway and class
   * Shows each pathway group with its students and their progress
   * Route: GET /api/reports/pathway?classId=&pathwayId=&academicYear=&term=&limit=&page=
   */
  @Get('pathway/report')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  getPathwayReport(@Query() query: PathwayReportQueryDto) {
    return this.reportsService.getPathwayReport(query);
  }

  /**
   * Get class pathway report
   * Shows all pathways and their students in a specific class
   * Route: GET /api/reports/pathway/class/:classId?academicYear=&term=&limit=&page=
   */
  @Get('pathway/class/:classId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  getClassPathwayReport(
    @Param('classId') classId: string,
    @Query() query: ClassPathwayReportQueryDto,
  ) {
    return this.reportsService.getClassPathwayReport({
      ...query,
      classId,
    });
  }

  /**
   * Get student progress in a specific pathway
   * Shows detailed subject-wise progress and overall statistics
   * Route: GET /api/reports/pathway/student/:studentId/:pathwayId?academicYear=
   */
  @Get('pathway/student/:studentId/:pathwayId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  getStudentPathwayProgress(
    @Param('studentId') studentId: string,
    @Param('pathwayId') pathwayId: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.reportsService.getStudentPathwayProgress(studentId, pathwayId, academicYear);
  }
}
