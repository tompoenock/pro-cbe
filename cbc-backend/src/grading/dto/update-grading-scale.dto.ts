import { PartialType } from '@nestjs/mapped-types';
import { CreateGradingScaleDto } from './create-grading-scale.dto';

export class UpdateGradingScaleDto extends PartialType(CreateGradingScaleDto) {}
