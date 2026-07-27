import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type GradeEntryDocument = GradeEntry & Document;

@Schema({ _id: false })
export class GradeEntry {
  @Prop({ required: true })
  grade!: string;

  @Prop({ required: true })
  minScore!: number;

  @Prop({ required: true })
  maxScore!: number;

  @Prop({ required: false })
  remark?: string;

  @Prop({ required: false, default: 0 })
  points?: number;
}

export const GradeEntrySchema = SchemaFactory.createForClass(GradeEntry);

export type GradingScaleDocument = GradingScale & Document;

@Schema()
export class GradingScale {
  @Prop({ required: true })
  name!: string;

  @Prop({ type: [GradeEntrySchema], required: true })
  grades!: GradeEntry[];

  @Prop({ default: false })
  isDefault!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isDeleted?: boolean;
}

export const GradingScaleSchema = SchemaFactory.createForClass(GradingScale);
GradingScaleSchema.set('timestamps', true);
