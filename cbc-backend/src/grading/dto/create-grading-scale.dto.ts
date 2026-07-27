import { IsString, IsArray, ValidateNested, IsBoolean, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class GradeEntryDto {
  @IsString()
  grade!: string;

  @IsNumber()
  minScore!: number;

  @IsNumber()
  maxScore!: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsNumber()
  @IsOptional()
  points?: number;
}

export class CreateGradingScaleDto {
  @IsString()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeEntryDto)
  grades!: GradeEntryDto[];

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
