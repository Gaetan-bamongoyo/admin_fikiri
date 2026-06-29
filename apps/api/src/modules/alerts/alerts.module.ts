import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlertsService } from './alerts.service';
import { AlertsCron } from './alerts.cron';
import { AlertsController } from './alerts.controller';
import { AlertEntity } from './entities/alert.entity';
import { PushDispatchService } from './push-dispatch.service';
import { AnalyticsModule } from '../analytics/analytics.module';

/**
 * Module central des alertes intelligentes
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([AlertEntity]),
    AnalyticsModule, // donne accès à AnalyticsService
  ],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsCron, PushDispatchService],
})
export class AlertsModule {}
