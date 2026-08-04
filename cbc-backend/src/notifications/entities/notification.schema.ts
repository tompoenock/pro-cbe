import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema()
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  recipientId!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ required: false })
  type?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Performance', required: false })
  performanceId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Class', required: false })
  classId?: MongooseSchema.Types.ObjectId;

  @Prop({ default: false })
  read?: boolean;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.set('timestamps', true);
NotificationSchema.index({ recipientId: 1, read: 1 });
