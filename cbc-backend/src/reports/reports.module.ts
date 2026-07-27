import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentReport, StudentReportSchema } from './entities/student-report.schema';
import { SchoolReport, SchoolReportSchema } from './entities/school-report.schema';
import { Student, StudentSchema } from '../students/entities/student.schema';
import { StudentSubject, StudentSubjectSchema } from '../students/entities/student-subject.schema';
import { Pathway, PathwaySchema } from '../pathways/entities/pathway.schema';
import { Performance, PerformanceSchema } from '../performance/entities/performance.schema';
import { Class, ClassSchema } from '../classes/entities/class.schema';
import { Subject, SubjectSchema } from '../subjects/entities/subject.schema';
import { PathwaysModule } from '../pathways/pathways.module';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentReport.name, schema: StudentReportSchema },
      { name: SchoolReport.name, schema: SchoolReportSchema },
      { name: Student.name, schema: StudentSchema },
      { name: StudentSubject.name, schema: StudentSubjectSchema },
      { name: Pathway.name, schema: PathwaySchema },
      { name: Performance.name, schema: PerformanceSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Subject.name, schema: SubjectSchema },
    ]),
    PathwaysModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService, MongooseModule],
})
export class ReportsModule {}
