import { IsString, IsEnum, IsMongoId, IsOptional, IsArray } from 'class-validator';

export class PerformanceBatchFilterDto {
  @IsMongoId()
  @IsOptional()
  classId?: string;

  @IsMongoId()
  @IsOptional()
  subjectId?: string;

  @IsString()
  @IsOptional()
  academicYear?: string;

  @IsEnum(['Term 1', 'Term 2', 'Term 3'])
  @IsOptional()
  term?: string;

  @IsEnum(['CAT 1', 'CAT 2', 'Mid-Term', 'End-Term', 'Final'])
  @IsOptional()
  examType?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  performanceIds?: string[];
}

export class ReturnPerformanceDto extends PerformanceBatchFilterDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
