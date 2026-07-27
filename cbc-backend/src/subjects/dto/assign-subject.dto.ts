import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class AssignSubjectDto {
  @IsMongoId()
  @IsOptional()
  classId?: string;

  @IsMongoId()
  @IsOptional()
  teacher?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;
}