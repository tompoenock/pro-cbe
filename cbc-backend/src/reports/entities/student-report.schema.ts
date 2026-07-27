import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type StudentReportDocument = StudentReport & Document;

@Schema()
export class StudentReport {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Student', required: true })
  studentId!: MongooseSchema.Types.ObjectId;

  @Prop({ enum: ['pathway', 'performance', 'comprehensive'], default: 'comprehensive' })
  reportType!: string;

  @Prop({ type: Date, default: Date.now })
  generatedDate!: Date;

  @Prop({
    type: {
      startDate: Date,
      endDate: Date,
    },
    required: false,
  })
  reportPeriod?: {
    startDate: Date;
    endDate: Date;
  };

  @Prop({ type: Object, required: false })
  pathwayRecommendation?: any;

  @Prop({ type: Object, required: false })
  performanceSummary?: any;

  @Prop({ required: false })
  reportSummary?: string;

  @Prop({ type: [String], required: false })
  interests?: string[];

  @Prop({ required: false })
  teacherNotes?: string;

  @Prop({ default: true })
  parentViewable!: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  createdBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, required: false })
  lastModified?: Date;

  @Prop({ default: false })
  isDeleted?: boolean;
}

export const StudentReportSchema = SchemaFactory.createForClass(StudentReport);
StudentReportSchema.set('timestamps', true);
StudentReportSchema.index({ studentId: 1, generatedDate: -1 });
StudentReportSchema.index({ reportType: 1 });
