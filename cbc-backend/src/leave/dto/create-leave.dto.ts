import { IsMongoId, IsDateString, IsEnum, IsString, IsOptional } from 'class-validator';

export class CreateLeaveDto {
  @IsEnum(['student', 'staff'])
  applicantType!: string;

  @IsMongoId()
  applicantId!: string;

  @IsEnum(['sick', 'personal', 'family', 'maternity', 'paternity', 'study', 'other'])
  leaveType!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  reason!: string;
}
