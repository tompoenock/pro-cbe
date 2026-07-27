import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class BaseSchema {
  @Prop({ default: false })
  isDeleted?: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}
