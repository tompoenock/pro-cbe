import { IsString, IsOptional, IsBoolean, IsMongoId, IsEnum, IsDateString } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  staffNumber!: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['teaching', 'non-teaching', 'admin'])
  @IsOptional()
  staffType?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsString()
  @IsOptional()
  qualification?: string;

  @IsDateString()
  @IsOptional()
  dateOfJoining?: string;

  @IsEnum(['male', 'female', 'other'])
  @IsOptional()
  gender?: string;

  @IsMongoId()
  @IsOptional()
  userId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
