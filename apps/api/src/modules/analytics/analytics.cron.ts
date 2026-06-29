import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AnalyticsService } from './analytics.service';

/**
 * BK-402 - Cron génération des profils utilisateurs
 * ⏱ toutes les 1 heure
 */
@Injectable()
export class AnalyticsCron {
  private readonly logger = new Logger(AnalyticsCron.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Cron('0 * * * *') // 🔥 toutes les 1 heure
  async handleProfileComputation(): Promise<void> {
    this.logger.log('Démarrage computeUserHabitProfiles');

    try {
      await this.analyticsService.computeUserHabitProfiles();
      this.logger.log('Profils utilisateurs mis à jour');
    } catch (err) {
      this.logger.error('Erreur analytics cron', err);
    }
  }
}
