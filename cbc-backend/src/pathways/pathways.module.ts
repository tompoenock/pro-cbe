import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Pathway, PathwaySchema } from './entities/pathway.schema';
import { StudentPathway, StudentPathwaySchema } from './entities/student-pathway.schema';
import { Performance, PerformanceSchema } from '../performance/entities/performance.schema';
import { StudentSubject, StudentSubjectSchema } from '../students/entities/student-subject.schema';
import { Student, StudentSchema } from '../students/entities/student.schema';
import { Class, ClassSchema } from '../classes/entities/class.schema';
import { GradingModule } from '../grading/grading.module';
import { PathwaysService } from './pathways.service';
import { PathwaysController } from './pathways.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Pathway.name, schema: PathwaySchema },
      { name: StudentPathway.name, schema: StudentPathwaySchema },
      { name: Performance.name, schema: PerformanceSchema },
      { name: StudentSubject.name, schema: StudentSubjectSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Student.name, schema: StudentSchema },
    ]),
    GradingModule,
  ],
  controllers: [PathwaysController],
  providers: [PathwaysService],
  exports: [PathwaysService, MongooseModule],
})
export class PathwaysModule {}
