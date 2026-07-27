import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GradingScale, GradingScaleSchema } from './entities/grading-scale.schema';
import { GradingService } from './grading.service';
import { GradingController } from './grading.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: GradingScale.name, schema: GradingScaleSchema }])],
  controllers: [GradingController],
  providers: [GradingService],
  exports: [GradingService, MongooseModule],
})
export class GradingModule {}
