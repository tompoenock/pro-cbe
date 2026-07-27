import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({ timestamps: true })
export class Permission {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', unique: true, index: true })
  userId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: [String], default: [] })
  permissions!: string[];
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
