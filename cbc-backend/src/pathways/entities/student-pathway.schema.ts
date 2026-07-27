import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type StudentPathwayDocument = StudentPathway & Document;

@Schema()
export class StudentPathway {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Student', required: true })
  studentId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Pathway', required: true })
  pathwayId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, required: true })
  selectedDate!: Date;

  @Prop({ type: Date, required: false })
  recommendedDate?: Date;

  @Prop({ enum: ['pending', 'approved', 'active', 'changed'], default: 'pending' })
  status!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Staff', required: false })
  approvedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, required: false })
  approvalDate?: Date;

  @Prop({ required: false })
  notes?: string;

  @Prop({ required: false })
  changeReason?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Pathway', required: false })
  previousPathwayId?: MongooseSchema.Types.ObjectId;

  @Prop({ default: false })
  isDeleted?: boolean;
}

export const StudentPathwaySchema = SchemaFactory.createForClass(StudentPathway);
StudentPathwaySchema.set('timestamps', true);
StudentPathwaySchema.index({ studentId: 1, pathwayId: 1 }, { unique: true });
StudentPathwaySchema.index({ studentId: 1, status: 1 });
StudentPathwaySchema.index({ pathwayId: 1 });
