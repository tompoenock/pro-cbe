import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Class, ClassSchema } from './entities/class.schema';
import { Subject, SubjectSchema } from '../subjects/entities/subject.schema';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Class.name, schema: ClassSchema },
      { name: Subject.name, schema: SubjectSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService, MongooseModule],
})
export class ClassesModule {}
