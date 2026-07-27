import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ClassDocument = Class & Document;

@Schema()
export class Class {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: false })
  section?: string;

  @Prop({ required: true })
  academicYear!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  teacher?: MongooseSchema.Types.ObjectId;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isDeleted?: boolean;
}

export const ClassSchema = SchemaFactory.createForClass(Class);
ClassSchema.set('timestamps', true);
ClassSchema.index({ name: 1, section: 1, academicYear: 1 }, { unique: true });
