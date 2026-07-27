import { IsString, IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsMongoId()
  @IsOptional()
  classId?: string;

  @IsMongoId()
  @IsOptional()
  teacher?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
