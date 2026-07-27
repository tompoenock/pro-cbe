import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { UpdatePerformanceDto, BulkPerformanceDto } from './dto/update-performance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Post()
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  create(@Body() dto: CreatePerformanceDto) {
    return this.performanceService.create(dto);
  }

  @Post('bulk')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  bulkCreate(@Body() dto: BulkPerformanceDto) {
    return this.performanceService.bulkCreate(dto);
  }

  @Get()
  findAll(
    @Query('classId') classId?: string,
    @Query('studentId') studentId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('term') term?: string,
    @Query('examType') examType?: string,
  ) {
    return this.performanceService.findAll({ classId, studentId, subjectId, academicYear, term, examType });
  }

  @Get('stats')
  getStats() {
    return this.performanceService.getPerformanceStats();
  }

  @Get('report/student/:studentId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.Parent)
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
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  update(@Param('id') id: string, @Body() dto: UpdatePerformanceDto) {
    return this.performanceService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  remove(@Param('id') id: string) {
    return this.performanceService.remove(id);
  }
}
