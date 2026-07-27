import { IsString, IsOptional, IsMongoId, IsDateString, IsEnum, IsBoolean } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  admissionNumber!: string;

  @IsMongoId()
  classId!: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsEnum(['male', 'female', 'other'])
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  parentName?: string;

  @IsString()
  @IsOptional()
  parentPhone?: string;

  @IsString()
  @IsOptional()
  parentEmail?: string;

  @IsMongoId()
  parentUserId!: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
