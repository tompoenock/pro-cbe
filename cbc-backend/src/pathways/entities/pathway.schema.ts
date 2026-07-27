import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PathwayDocument = Pathway & Document;

export interface GPARange {
  minimumGPA: number;
  maximumGPA: number;
  subjectCriteria?: {
    subjectId: MongooseSchema.Types.ObjectId;
    minimumMarks?: number;
  }[];
}

@Schema()
export class Pathway {
  @Prop({ required: true, unique: true })
  code!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'Subject', required: true })
  requiredSubjects!: MongooseSchema.Types.ObjectId[];

  @Prop({ enum: ['subject-based', 'marks-based'], default: 'subject-based' })
  pathwayType!: string;

  @Prop({
    type: {
      minimumGPA: Number,
      maximumGPA: Number,
      subjectCriteria: [
        {
          _id: false,
          subjectId: MongooseSchema.Types.ObjectId,
          minimumMarks: Number,
        },
      ],
    },
    required: false,
  })
  gpaRange?: {
    minimumGPA: number;
    maximumGPA: number;
    subjectCriteria?: Array<{
      subjectId: MongooseSchema.Types.ObjectId;
      minimumMarks?: number;
    }>;
  };

  @Prop({ type: [String], required: false })
  careerPaths?: string[];

  @Prop({ type: [String], required: false })
  requiredCompetencies?: string[];

  @Prop({ required: false, default: 2.0 })
  minimumGPA?: number;

  @Prop({
    type: {
      keywords: [String],
      skillsRequired: [String],
    },
    required: false,
  })
  interestProfile?: {
    keywords: string[];
    skillsRequired: string[];
  };

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isDeleted?: boolean;
}

export const PathwaySchema = SchemaFactory.createForClass(Pathway);
PathwaySchema.set('timestamps', true);
PathwaySchema.index({ name: 1 });
