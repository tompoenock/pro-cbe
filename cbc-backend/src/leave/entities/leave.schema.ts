import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type LeaveDocument = Leave & Document;

@Schema()
export class Leave {
  @Prop({ enum: ['student', 'staff'], required: true })
  applicantType!: string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId })
  applicantId!: MongooseSchema.Types.ObjectId;

  @Prop({ enum: ['sick', 'personal', 'family', 'maternity', 'paternity', 'study', 'other'], required: true })
  leaveType!: string;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  endDate!: Date;

  @Prop({ required: true })
  reason!: string;

  @Prop({ enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  approvedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ required: false })
  approverComment?: string;

  @Prop({ default: false })
  isDeleted?: boolean;
}

export const LeaveSchema = SchemaFactory.createForClass(Leave);
LeaveSchema.set('timestamps', true);
LeaveSchema.index({ applicantId: 1 });
LeaveSchema.index({ status: 1 });
