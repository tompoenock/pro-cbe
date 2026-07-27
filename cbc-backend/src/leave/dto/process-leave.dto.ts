import { IsEnum, IsString, IsOptional, IsMongoId } from 'class-validator';

export class ProcessLeaveDto {
  @IsEnum(['approved', 'rejected'])
  status!: string;

  @IsMongoId()
  @IsOptional()
  approvedBy?: string;

  @IsString()
  @IsOptional()
  approverComment?: string;
}
