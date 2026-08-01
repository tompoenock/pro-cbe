import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserSessionDocument = UserSession & Document;

@Schema()
export class UserSession {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'School' })
  schoolId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', index: true })
  organizationId: MongooseSchema.Types.ObjectId;

  @Prop({ enum: ['success', 'failed'], default: 'success', index: true })
  status: string;

  @Prop()
  email: string;

  @Prop({ required: true })
  loginAt: Date;

  @Prop()
  logoutAt: Date;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop()
  failureReason: string;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);
UserSessionSchema.set('timestamps', true);
UserSessionSchema.index({ schoolId: 1, loginAt: -1 });
UserSessionSchema.index({ organizationId: 1, loginAt: -1 });
