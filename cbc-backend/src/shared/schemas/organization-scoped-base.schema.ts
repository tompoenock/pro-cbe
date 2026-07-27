import { Prop, Schema } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from './base.schema';

@Schema()
export class OrganizationScopedSchema extends BaseSchema {
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    index: true,
  })
  organizationId: MongooseSchema.Types.ObjectId;
}
