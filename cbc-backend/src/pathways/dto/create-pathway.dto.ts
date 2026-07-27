import { IsString, IsOptional, IsArray, IsMongoId, IsNumber, IsEnum, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SubjectCriteriaDto {
  @IsMongoId()
  subjectId!: string;

  @IsNumber()
  @IsOptional()
  minimumMarks?: number;
}

export class GPARangeDto {
  @IsNumber()
  @Min(0)
  @Max(5)
  minimumGPA!: number;

  @IsNumber()
  @Min(0)
  @Max(5)
  maximumGPA!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectCriteriaDto)
  @IsOptional()
  subjectCriteria?: SubjectCriteriaDto[];
}

export class CreatePathwayDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsMongoId({ each: true })
  requiredSubjects!: string[];

  @IsEnum(['subject-based', 'marks-based'])
  @IsOptional()
  pathwayType?: string;

  @ValidateNested()
  @Type(() => GPARangeDto)
  @IsOptional()
  gpaRange?: GPARangeDto;

  @IsArray()
  @IsOptional()
  careerPaths?: string[];

  @IsArray()
  @IsOptional()
  requiredCompetencies?: string[];

  @IsNumber()
  @IsOptional()
  minimumGPA?: number;

  @IsOptional()
  interestProfile?: {
    keywords?: string[];
    skillsRequired?: string[];
  };
}
