import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type StaffDocument = Staff & Document;

@Schema()
export class Staff {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  userId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: true, unique: true })
  staffNumber!: string;

  @Prop({ required: false })
  email?: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({ required: true, enum: ['teaching', 'non-teaching', 'admin'], default: 'teaching' })
  staffType!: string;

  @Prop({ required: false })
  department?: string;

  @Prop({ required: false })
  designation?: string;

  @Prop({ required: false })
  qualification?: string;

  @Prop({ required: false })
  dateOfJoining?: Date;

  @Prop({ enum: ['male', 'female', 'other'], required: false })
  gender?: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isDeleted?: boolean;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);
StaffSchema.set('timestamps', true);
