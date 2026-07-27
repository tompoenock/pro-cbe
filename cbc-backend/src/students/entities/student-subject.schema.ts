import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type StudentSubjectDocument = StudentSubject & Document;

@Schema()
export class StudentSubject {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Student', required: true })
  studentId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Subject', required: true })
  subjectId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Class', required: true })
  classId!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  academicYear!: string;

  @Prop({ required: false })
  enrollmentDate?: Date;

  @Prop({ enum: ['active', 'completed', 'dropped'], default: 'active' })
  status!: string;

  @Prop({ default: false })
  isDeleted?: boolean;
}

export const StudentSubjectSchema = SchemaFactory.createForClass(StudentSubject);
StudentSubjectSchema.set('timestamps', true);
StudentSubjectSchema.index({ studentId: 1, subjectId: 1, academicYear: 1 }, { unique: true });
StudentSubjectSchema.index({ classId: 1, academicYear: 1 });
StudentSubjectSchema.index({ studentId: 1, classId: 1 });
