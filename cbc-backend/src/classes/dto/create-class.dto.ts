import { IsString, IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class CreateClassDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  section?: string;

  @IsString()
  academicYear!: string;

  @IsMongoId()
  @IsOptional()
  teacher?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
