import { IsString, IsNumber, IsMongoId, IsEnum, IsOptional, Min, Max } from 'class-validator';

export class CreatePerformanceDto {
  @IsMongoId()
  studentId!: string;

  @IsMongoId()
  subjectId!: string;

  @IsMongoId()
  classId!: string;

  @IsString()
  academicYear!: string;

  @IsEnum(['Term 1', 'Term 2', 'Term 3'])
  term!: string;

  @IsEnum(['CAT 1', 'CAT 2', 'Mid-Term', 'End-Term', 'Final'])
  examType!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;
}
