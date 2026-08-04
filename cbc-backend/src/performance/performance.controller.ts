import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { UpdatePerformanceDto, BulkPerformanceDto } from './dto/update-performance.dto';
import { PerformanceBatchFilterDto, ReturnPerformanceDto } from './dto/workflow-performance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Post()
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.ClassTeacher)
  create(@Body() dto: CreatePerformanceDto, @Req() req: any) {
    return this.performanceService.create(dto, req.user);
  }

  @Post('bulk')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.ClassTeacher)
  bulkCreate(@Body() dto: BulkPerformanceDto, @Req() req: any) {
    return this.performanceService.bulkCreate(dto, req.user);
  }

  @Get()
  findAll(
    @Query('classId') classId?: string,
    @Query('studentId') studentId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('term') term?: string,
    @Query('examType') examType?: string,
    @Query('status') status?: string,
    @Req() req?: any,
  ) {
    return this.performanceService.findAll({ classId, studentId, subjectId, academicYear, term, examType, status }, req?.user);
  }

  @Get('workflow-overview')
  getWorkflowOverview(@Query() query: any) {
    return this.performanceService.getWorkflowOverview(query);
  }

  @Get('stats')
  getStats() {
    return this.performanceService.getPerformanceStats();
  }

  // ===== WORKFLOW ENDPOINTS =====

  @Post('submit/class-teacher')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.ClassTeacher)
  submitToClassTeacher(@Body() dto: PerformanceBatchFilterDto, @Req() req: any) {
    return this.performanceService.submitToClassTeacher(dto, req.user);
  }

  @Post('submit/admin')
  @Roles(Role.Admin, Role.SuperAdmin, Role.ClassTeacher)
  submitToAdmin(@Body() dto: PerformanceBatchFilterDto, @Req() req: any) {
    return this.performanceService.submitToAdmin(dto, req.user);
  }

  @Post('approve')
  @Roles(Role.Admin, Role.SuperAdmin)
  approve(@Body() dto: PerformanceBatchFilterDto, @Req() req: any) {
    return this.performanceService.approve(dto, req.user);
  }

  @Post('return')
  @Roles(Role.Admin, Role.SuperAdmin, Role.ClassTeacher)
  returnMarks(@Body() dto: ReturnPerformanceDto, @Req() req: any) {
    return this.performanceService.returnMarks(dto, req.user);
  }

  @Get('report/student/:studentId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.ClassTeacher, Role.Parent)
  getStudentReport(
    @Param('studentId') studentId: string,
    @Query('academicYear') academicYear: string,
    @Query('term') term: string,
    @Req() req: any,
  ) {
    return this.performanceService.getStudentReport(studentId, academicYear, term, req.user);
  }

  @Get('report/class/:classId')
  getClassReport(
    @Param('classId') classId: string,
    @Query('academicYear') academicYear: string,
    @Query('term') term: string,
  ) {
    return this.performanceService.getClassReport(classId, academicYear, term);
  }

  @Get('report/combined-ranking')
  getCombinedRanking(
    @Query('classIds') classIds: string,
    @Query('academicYear') academicYear: string,
    @Query('term') term: string,
  ) {
    const ids = classIds.split(',').map(id => id.trim());
    return this.performanceService.getCombinedClassRanking(ids, academicYear, term);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.performanceService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.ClassTeacher)
  update(@Param('id') id: string, @Body() dto: UpdatePerformanceDto, @Req() req: any) {
    return this.performanceService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  remove(@Param('id') id: string) {
    return this.performanceService.remove(id);
  }
}
