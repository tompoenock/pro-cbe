import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserSessionDocument = UserSession & Document;

@Schema()
export class UserSession {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'School' })
  schoolId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  loginAt: Date;

  @Prop()
  logoutAt: Date;

  @Prop()
  ipAddress: string;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);
UserSessionSchema.set('timestamps', true);
UserSessionSchema.index({ schoolId: 1, loginAt: -1 });
