import { IsArray, IsString, IsOptional } from 'class-validator';

export class UpdatePermissionsDto {
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];
}
