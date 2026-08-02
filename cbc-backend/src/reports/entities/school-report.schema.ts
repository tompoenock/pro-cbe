import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SchoolReportDocument = SchoolReport & Document;

@Schema()
export class SchoolReport {
  @Prop({
    type: {
      startDate: Date,
      endDate: Date,
    },
    required: true,
  })
  reportPeriod!: {
    startDate: Date;
    endDate: Date;
  };

  @Prop({ required: false })
  totalStudents?: number;

  @Prop({
    type: Object,
    required: false,
  })
  pathwayDistribution?: Record<string, number>;

  @Prop({
    type: Object,
    required: false,
  })
  performanceStatistics?: any;

  @Prop({
    type: Object,
    required: false,
  })
  trends?: any;

  @Prop({ type: Date, default: Date.now })
  generatedDate!: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  generatedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ required: false })
  reportType?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Pathway', required: false })
  pathway?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Object, required: false })
  class?: any;

  @Prop({ default: false })
  isDeleted?: boolean;
}

export const SchoolReportSchema = SchemaFactory.createForClass(SchoolReport);
SchoolReportSchema.set('timestamps', true);
SchoolReportSchema.index({ 'reportPeriod.startDate': 1, 'reportPeriod.endDate': 1 });
SchoolReportSchema.index({ generatedDate: -1 });
