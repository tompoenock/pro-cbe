import { IsMongoId, IsEnum, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateStudentReportDto {
  @IsMongoId()
  studentId!: string;

  @IsEnum(['pathway', 'performance', 'comprehensive'])
  @IsOptional()
  reportType?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  teacherNotes?: string;
}

export class CreateSchoolReportDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}

export class CreateClassSummaryReportDto {
  @IsMongoId()
  classId!: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  reportType?: string;
}
