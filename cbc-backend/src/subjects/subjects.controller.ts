import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { AssignSubjectDto } from './dto/assign-subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @Roles(Role.Admin, Role.SuperAdmin)
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(dto);
  }

  @Get()
  findAll(@Query('classId') classId?: string, @Req() req?: any) {
    // If request is from a teacher, restrict to their assigned subjects only
    if (req?.user?.role === Role.Teacher) {
      return this.subjectsService.findAllForTeacher(req.user._id, classId);
    }

    // Admins/SuperAdmins/others get full list (optionally filtered by class)
    return this.subjectsService.findAll(classId);
  }

  @Get('count')
  count() {
    return this.subjectsService.count();
  }

  @Post('seed-CBE')
  @Roles(Role.Admin, Role.SuperAdmin)
  seedCBESubjects(@Body('classId') classId?: string, @Body('category') category?: string) {
    return this.subjectsService.seedCBESubjects(classId, category);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  update(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.subjectsService.update(id, dto);
  }

  @Post(':id/assign')
  @Roles(Role.Admin, Role.SuperAdmin)
  assign(@Param('id') id: string, @Body() dto: AssignSubjectDto) {
    return this.subjectsService.assign(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }
}
