import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PerformanceDocument = Performance & Document;

@Schema()
export class Performance {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Student', required: true })
  studentId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Subject', required: true })
  subjectId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Class', required: true })
  classId!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  academicYear!: string;

  @Prop({ required: true, enum: ['Term 1', 'Term 2', 'Term 3'] })
  term!: string;

  @Prop({ required: true, enum: ['CAT 1', 'CAT 2', 'Mid-Term', 'End-Term', 'Final'] })
  examType!: string;

  @Prop({ required: true, min: 0, max: 100 })
  score!: number;

  @Prop({ required: false })
  grade?: string;

  @Prop({ required: false })
  remark?: string;

  @Prop({ required: false, default: 0 })
  points?: number;

  @Prop({ default: false })
  isDeleted?: boolean;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const PerformanceSchema = SchemaFactory.createForClass(Performance);
PerformanceSchema.set('timestamps', true);
PerformanceSchema.index({ studentId: 1, subjectId: 1, academicYear: 1, term: 1, examType: 1 }, { unique: true });
PerformanceSchema.index({ classId: 1, academicYear: 1, term: 1 });
