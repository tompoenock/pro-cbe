import { IsMongoId, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class PathwayReportQueryDto {
  @IsMongoId()
  @IsOptional()
  pathwayId?: string;

  @IsMongoId()
  @IsOptional()
  classId?: string;

  @IsString()
  @IsOptional()
  academicYear?: string;

  @IsString()
  @IsOptional()
  term?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsString()
  @IsOptional()
  sortBy?: string; // 'name' | 'pathway' | 'performance'

  @IsString()
  @IsOptional()
  sortOrder?: string; // 'asc' | 'desc'
}

export class ClassPathwayReportQueryDto {
  @IsMongoId()
  classId!: string;

  @IsString()
  @IsOptional()
  academicYear?: string;

  @IsString()
  @IsOptional()
  term?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;
}
