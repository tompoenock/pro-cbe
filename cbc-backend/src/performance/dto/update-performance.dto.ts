import { IsString, IsNumber, IsOptional, IsEnum, Min, Max, IsArray, ValidateNested, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePerformanceDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  score?: number;
}

export class BulkScoreEntry {
  @IsMongoId()
  studentId!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;
}

export class BulkPerformanceDto {
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkScoreEntry)
  scores!: BulkScoreEntry[];
}
