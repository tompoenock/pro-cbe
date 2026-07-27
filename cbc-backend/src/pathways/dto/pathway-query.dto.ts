import { IsOptional, IsString, IsNumber, Min, Max, IsMongoId, IsEnum } from 'class-validator';

export class PathwayQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsMongoId()
  classId?: string;

  @IsOptional()
  @IsEnum(['subject-based', 'marks-based'])
  pathwayType?: string;

  /**
   * Filter pathways by minimum GPA requirement (0-5.0)
   * Example: minimumGPA=1.0 returns pathways for students with GPA >= 1.0
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minimumGPA?: number;

  /**
   * Filter pathways by maximum GPA (0-5.0)
   * Example: maximumGPA=2.0 returns pathways for students with GPA <= 2.0
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  maximumGPA?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
