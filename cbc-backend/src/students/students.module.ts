import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Student, StudentSchema } from './entities/student.schema';
import { StudentSubject, StudentSubjectSchema } from './entities/student-subject.schema';
import { Class, ClassSchema } from '../classes/entities/class.schema';
import { Subject, SubjectSchema } from '../subjects/entities/subject.schema';
import { User, UserSchema } from '../auth/entities/user.schema';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema },
      { name: StudentSubject.name, schema: StudentSubjectSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService, MongooseModule],
})
export class StudentsModule {}
