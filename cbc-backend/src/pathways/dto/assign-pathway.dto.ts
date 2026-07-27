import { IsMongoId, IsString, IsNumber, IsOptional } from 'class-validator';

export class AssignPathwayDto {
  @IsMongoId()
  pathwayId!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ApprovePathwayDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ChangePathwayDto {
  @IsMongoId()
  newPathwayId!: string;

  @IsString()
  @IsOptional()
  changeReason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
