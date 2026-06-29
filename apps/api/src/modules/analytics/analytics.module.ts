import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AnalyticsService } from './analytics.service';
import { AnalyticsCron } from './analytics.cron';

import { TrafficReport } from '../traffic/entities/traffic-report.entity';
import { UserHabitProfileEntity } from './entities/user-habit-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrafficReport,
      UserHabitProfileEntity, // 🔥 OBLIGATOIRE
    ]),
  ],
  providers: [AnalyticsService, AnalyticsCron],
  exports: [AnalyticsService], // 🔥 IMPORTANT pour AlertsModule
})
export class AnalyticsModule {}
