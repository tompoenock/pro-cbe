import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PathwaysService } from './pathways.service';
import { CreatePathwayDto } from './dto/create-pathway.dto';
import { UpdatePathwayDto } from './dto/update-pathway.dto';
import { PathwayQueryDto } from './dto/pathway-query.dto';
import { AssignPathwayDto, ApprovePathwayDto, ChangePathwayDto } from './dto/assign-pathway.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('pathways')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PathwaysController {
  constructor(private readonly pathwaysService: PathwaysService) {}

  /**
   * Create a new pathway (Admin/Teacher only)
   */
  @Post()
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  create(@Body() dto: CreatePathwayDto) {
    return this.pathwaysService.create(dto);
  }

  /**
   * Assign pathway to a student
   * Route: POST /api/pathways/:pathwayId/assign/:studentId
   */
  @Post(':pathwayId/assign/:studentId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  assignPathway(
    @Param('pathwayId') pathwayId: string,
    @Param('studentId') studentId: string,
    @Body() dto: AssignPathwayDto,
    @Req() req: any,
  ) {
    return this.pathwaysService.assignPathwayToStudent(studentId, dto);
  }

  /**
   * Approve student pathway (Teacher/Admin)
   * Route: POST /api/pathways/student-pathway/:studentPathwayId/approve
   */
  @Post('student-pathway/:studentPathwayId/approve')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  approvePathway(
    @Param('studentPathwayId') studentPathwayId: string,
    @Body() dto: ApprovePathwayDto,
    @Req() req: any,
  ) {
    const teacherId = req.user.id;
    return this.pathwaysService.approvePathway(studentPathwayId, teacherId, dto);
  }

  /**
   * Get all active pathways (for student selection)
   */
  @Get('active/list')
  getActivePathways() {
    return this.pathwaysService.getActivePathways();
  }

  /**
   * Get pathway analytics (distribution)
   */
  @Get('analytics/distribution')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  getDistribution() {
    return this.pathwaysService.getPathwayDistribution();
  }

  /**
   * Get pathway results tracking summary
   * Route: GET /api/pathways/:pathwayId/tracking
   */
  @Get(':pathwayId/tracking')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  getPathwayTracking(
    @Param('pathwayId') pathwayId: string,
    @Query('academicYear') academicYear?: string,
    @Query('term') term?: string,
  ) {
    return this.pathwaysService.getPathwayTracking(pathwayId, academicYear, term);
  }

  /**
   * Get student's current pathway
   * Route: GET /api/pathways/student/:studentId
   */
  @Get('student/:studentId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.Parent)
  getStudentPathway(@Param('studentId') studentId: string, @Req() req: any) {
    return this.pathwaysService.getStudentPathway(studentId, req.user);
  }

  /**
   * Get students by pathway
   * Route: GET /api/pathways/:pathwayId/students
   */
  @Get(':pathwayId/students')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  getStudentsByPathway(@Param('pathwayId') pathwayId: string) {
    return this.pathwaysService.getStudentsByPathway(pathwayId);
  }

  /**
   * Get all pathways with pagination and search
   */
  @Get()
  findAll(@Query() query: PathwayQueryDto) {
    return this.pathwaysService.findAll(query);
  }

  /**
   * Update a pathway
   */
  @Patch(':id')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  update(@Param('id') id: string, @Body() dto: UpdatePathwayDto) {
    return this.pathwaysService.update(id, dto);
  }

  /**
   * Delete a pathway
   */
  @Delete(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  remove(@Param('id') id: string) {
    return this.pathwaysService.remove(id);
  }

  /**
   * Get a single pathway by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pathwaysService.findById(id);
  }

  /**
   * Change student pathway
   * Route: PATCH /api/pathways/student/:studentId/change
   */
  @Patch('student/:studentId/change')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  changePathway(
    @Param('studentId') studentId: string,
    @Body() dto: ChangePathwayDto,
    @Req() req: any,
  ) {
    const teacherId = req.user.id;
    return this.pathwaysService.changeStudentPathway(studentId, dto, teacherId);
  }

  /**
   * Get students by pathway filtered by class
   * Route: GET /api/pathways/:pathwayId/students/class/:classId
   */
  @Get(':pathwayId/students/class/:classId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  getStudentsByPathwayAndClass(
    @Param('pathwayId') pathwayId: string,
    @Param('classId') classId: string,
  ) {
    return this.pathwaysService.getStudentsByPathwayAndClass(pathwayId, classId);
  }

  /**
   * Determine pathway based on student marks
   * Route: POST /api/pathways/determine-marks
   */
  @Post('determine-marks')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  determinePathwayByMarks(
    @Query('studentId') studentId: string,
    @Query('academicYear') academicYear: string,
    @Query('term') term: string,
  ) {
    return this.pathwaysService.determinePathwayByMarks(studentId, academicYear, term);
  }

  /**
   * Determine pathway based on subject selection
   * Route: POST /api/pathways/determine-subjects
   */
  @Post('determine-subjects')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  determinePathwayBySubjects(
    @Req() req: any,
    @Query('studentId') studentId: string,
    @Query('classId') classId: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.pathwaysService.determinePathwayBySubjects(studentId, classId, academicYear || undefined, req.user);
  }

  /**
   * Get student pathway recommendations
   * Route: GET /api/pathways/recommendations/:studentId
   */
  @Get('recommendations/:studentId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.Parent)
  getPathwayRecommendations(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Query('academicYear') academicYear?: string,
    @Query('term') term?: string,
  ) {
    return this.pathwaysService.getPathwayRecommendationsByGPA(studentId, academicYear, term, req?.user);
  }

  /**
   * Auto-assign pathway to student
   * Route: POST /api/pathways/auto-assign/:studentId
   */
  @Post('auto-assign/:studentId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  autoAssignPathway(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Query('classId') classId: string,
    @Query('academicYear') academicYear: string,
    @Query('term') term: string,
  ) {
    return this.pathwaysService.autoAssignPathway(studentId, classId, academicYear, term, req.user);
  }

  /**
   * Get pathway suggestions for student
   * Route: GET /api/pathways/suggestions/:studentId
   */
  @Get('suggestions/:studentId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  getPathwaySuggestions(
    @Param('studentId') studentId: string,
    @Query('classId') classId: string,
    @Query('academicYear') academicYear: string,
    @Query('term') term: string,
  ) {
    return this.pathwaysService.getPathwaySuggestions(studentId, classId, academicYear, term);
  }

  /**
   * Calculate student's GPA
   * Route: GET /api/pathways/gpa/:studentId
   */
  @Get('gpa/:studentId')
  calculateStudentGPA(
    @Param('studentId') studentId: string,
    @Query('academicYear') academicYear?: string,
    @Query('term') term?: string,
  ) {
    return this.pathwaysService.calculateStudentGPA(studentId, academicYear, term);
  }

  /**
   * Auto-place student in best pathway based on performance
   * Route: POST /api/pathways/auto-place/:studentId
   */
  @Post('auto-place/:studentId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  autoPlaceStudent(
    @Param('studentId') studentId: string,
    @Query('academicYear') academicYear?: string,
    @Query('term') term?: string,
    @Req() req?: any,
  ) {
    const teacherId = req?.user?.id;
    return this.pathwaysService.autoPlaceStudentByPerformance(studentId, academicYear, term, teacherId);
  }
}
