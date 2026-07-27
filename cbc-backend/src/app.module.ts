import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClassesModule } from './classes/classes.module';
import { SubjectsModule } from './subjects/subjects.module';
import { StudentsModule } from './students/students.module';
import { GradingModule } from './grading/grading.module';
import { PerformanceModule } from './performance/performance.module';
import { StaffModule } from './staff/staff.module';
import { LeaveModule } from './leave/leave.module';
import { PathwaysModule } from './pathways/pathways.module';
import { ReportsModule } from './reports/reports.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    AuthModule,
    ClassesModule,
    SubjectsModule,
    StudentsModule,
    GradingModule,
    PerformanceModule,
    StaffModule,
    LeaveModule,
    // CBE Pathway modules
    PathwaysModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
