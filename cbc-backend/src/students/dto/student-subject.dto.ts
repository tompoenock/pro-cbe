import { IsString, IsArray, IsMongoId, IsEnum, IsOptional, IsNumber } from 'class-validator';

export class AssignSubjectsDto {
  @IsMongoId()
  studentId!: string;

  @IsMongoId()
  classId!: string;

  @IsString()
  academicYear!: string;

  @IsArray()
  @IsMongoId({ each: true })
  subjectIds!: string[];
}

export class BulkAssignClassStudentsDto {
  @IsMongoId()
  classId!: string;

  @IsArray()
  @IsMongoId({ each: true })
  studentIds!: string[];

  @IsString()
  academicYear!: string;
}

export class StudentSubjectQueryDto {
  @IsMongoId()
  @IsOptional()
  studentId?: string;

  @IsMongoId()
  @IsOptional()
  classId?: string;

  @IsString()
  @IsOptional()
  academicYear?: string;

  @IsEnum(['active', 'completed', 'dropped'])
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsNumber()
  @IsOptional()
  page?: number;
}
