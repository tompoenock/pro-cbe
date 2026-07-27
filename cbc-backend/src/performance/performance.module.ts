import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Performance, PerformanceSchema } from './entities/performance.schema';
import { Student, StudentSchema } from '../students/entities/student.schema';
import { Subject, SubjectSchema } from '../subjects/entities/subject.schema';
import { Class, ClassSchema } from '../classes/entities/class.schema';
import { PerformanceService } from './performance.service';
import { PerformanceController } from './performance.controller';
import { GradingModule } from '../grading/grading.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Performance.name, schema: PerformanceSchema },
      { name: Student.name, schema: StudentSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Class.name, schema: ClassSchema },
    ]),
    GradingModule,
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
