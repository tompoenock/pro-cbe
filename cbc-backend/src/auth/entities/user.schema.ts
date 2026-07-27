import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Role } from '../roles.enum';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  username!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  phone_no!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ default: Role.User, enum: Role })
  role!: Role;

  @Prop({ default: false })
  isApproved!: boolean;

  @Prop({ default: false })
  requirePasswordChange!: boolean;

  @Prop({ required: false, default: null })
  temporaryPassword?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', index: true })
  organizationId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'OrganizationBranch', index: true })
  branchId!: MongooseSchema.Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.set('timestamps', true);
UserSchema.index({ organizationId: 1, branchId: 1 });
