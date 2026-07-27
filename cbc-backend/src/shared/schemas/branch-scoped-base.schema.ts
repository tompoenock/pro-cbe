import { Prop, Schema } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { OrganizationScopedSchema } from './organization-scoped-base.schema';

@Schema()
export class BranchScopedSchema extends OrganizationScopedSchema {
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'OrganizationBranch',
    index: true,
  })
  branchId: MongooseSchema.Types.ObjectId;
}
