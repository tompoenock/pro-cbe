import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { ProcessLeaveDto } from './dto/process-leave.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('leave')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  @Roles(Role.Teacher, Role.Admin, Role.SuperAdmin)
  create(@Body() dto: CreateLeaveDto) {
    return this.leaveService.create(dto);
  }

  @Get()
  findAll(
    @Query('applicantType') applicantType?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.leaveService.findAll(applicantType, status, dateFrom, dateTo);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leaveService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.Teacher, Role.Admin, Role.SuperAdmin)
  update(@Param('id') id: string, @Body() dto: UpdateLeaveDto) {
    return this.leaveService.update(id, dto);
  }

  @Patch(':id/process')
  @Roles(Role.Admin, Role.SuperAdmin)
  processLeave(@Param('id') id: string, @Body() dto: ProcessLeaveDto) {
    return this.leaveService.processLeave(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  remove(@Param('id') id: string) {
    return this.leaveService.remove(id);
  }
}
