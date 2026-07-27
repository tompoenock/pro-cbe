import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { AssignSubjectsDto, BulkAssignClassStudentsDto, StudentSubjectQueryDto } from './dto/student-subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Get()
  findAll(
    @Query('classId') classId?: string,
    @Query('search') search?: string,
  ) {
    return this.studentsService.findAll(classId, search);
  }

  @Get('count')
  count(@Query('classId') classId?: string) {
    return this.studentsService.count(classId);
  }

  @Get('by-class/:classId')
  findByClass(@Param('classId') classId: string) {
    return this.studentsService.findByClass(classId);
  }

  @Get('by-parent')
  @Roles(Role.Parent)
  getStudentsByParent(@Req() req: any) {
    return this.studentsService.findByParent(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const student = await this.studentsService.findOne(id);
    if (req.user?.role === Role.Parent) {
      if (!student.parentUserId || student.parentUserId.toString() !== req.user.id) {
        throw new ForbiddenException('Access denied');
      }
    }
    return student;
  }

  @Put(':id')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  // ===== StudentSubject Management Endpoints =====

  @Post('bulk/assign-to-class')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  bulkAssignStudentsToClass(@Body() dto: BulkAssignClassStudentsDto) {
    return this.studentsService.bulkAssignStudentsToClass(dto);
  }

  @Post('subjects/assign')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  assignSubjectsToStudent(@Body() dto: AssignSubjectsDto) {
    return this.studentsService.assignSubjectsToStudent(dto);
  }

  @Get(':studentId/subjects')
  getStudentSubjects(
    @Param('studentId') studentId: string,
    @Query('classId') classId: string,
    @Query('academicYear') academicYear: string,
  ) {
    return this.studentsService.getStudentSubjects(studentId, classId, academicYear);
  }

  @Get('subjects/query')
  queryStudentSubjects(@Query() query: StudentSubjectQueryDto) {
    return this.studentsService.queryStudentSubjects(query);
  }

  @Get('class/:classId/subjects')
  getClassStudentSubjects(
    @Param('classId') classId: string,
    @Query('academicYear') academicYear: string,
  ) {
    return this.studentsService.getClassStudentSubjects(classId, academicYear);
  }

  @Put('subjects/:studentSubjectId/status')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  updateStudentSubjectStatus(
    @Param('studentSubjectId') studentSubjectId: string,
    @Query('status') status: 'active' | 'completed' | 'dropped',
  ) {
    return this.studentsService.updateStudentSubjectStatus(studentSubjectId, status);
  }

  @Delete('subjects/:studentSubjectId')
  @Roles(Role.Admin, Role.SuperAdmin)
  removeStudentSubject(@Param('studentSubjectId') studentSubjectId: string) {
    return this.studentsService.removeStudentSubject(studentSubjectId);
  }

  // Get students in a class taking a specific subject
  @Get('class/:classId/subject/:subjectId')
  getStudentsByClassAndSubject(
    @Param('classId') classId: string,
    @Param('subjectId') subjectId: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.studentsService.getStudentsByClassAndSubject(classId, subjectId, academicYear);
  }
}
