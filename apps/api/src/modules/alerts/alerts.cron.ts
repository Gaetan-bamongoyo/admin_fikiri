import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AlertsService } from './alerts.service';
import { PushDispatchService } from './push-dispatch.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AlertEntity } from './entities/alert.entity';
import { AlertSeverity } from '../../common/enums/alert-severity.enum';

/**
 * BK-402 - Cron génération des alertes intelligentes
 * Intervalle : ALERTS_CRON_INTERVAL_MINUTES (défaut 5)
 */
@Injectable()
export class AlertsCron implements OnModuleInit {
  private readonly logger = new Logger(AlertsCron.name);

  constructor(
    private readonly alertsService: AlertsService,
    private readonly analyticsService: AnalyticsService,
    private readonly pushDispatchService: PushDispatchService,
    private readonly configService: ConfigService,

    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
  ) {}

  onModuleInit(): void {
    const minutes = this.configService.get<number>(
      'notifications.alertsCronIntervalMinutes',
      5,
    );
    const interval = Math.min(60, Math.max(1, minutes));
    const intervalMs = interval * 60 * 1000;

    this.logger.log(
      `Cron alertes planifié — 1er cycle dans ${interval} min, puis toutes les ${interval} min`,
    );

    const run = (): void => {
      void this.handleAlertsAnalysis();
    };

    setTimeout(() => {
      run();
      setInterval(run, intervalMs);
    }, intervalMs);
  }

  /**
   * Analyse automatique des alertes + envoi push
   */
  async handleAlertsAnalysis(): Promise<void> {
    this.logger.log('Démarrage analyse automatique des alertes');

    try {
      // 1. Récupération des profils utilisateurs
      const profiles = await this.analyticsService.getAllHabitProfiles();

      if (!profiles?.length) {
        this.logger.log('Aucun profil utilisateur trouvé');
        return;
      }

      // 2. Parcours des profils
      for (const profile of profiles) {
        if (!profile?.userId) continue;

        // 3. Dernière position utilisateur
        const currentLocation = await this.analyticsService.getUserLastLocation(
          profile.userId,
        );

        if (!currentLocation) continue;

        // 4. Génération de l'alerte
        const alert = this.alertsService.generateAlert(
          profile.userId,
          profile,
          currentLocation,
        );

        if (!alert) continue;

        // 5. Sauvegarde en base
        const entity = this.alertRepository.create({
          userId: alert.userId,
          type: alert.type,
          message: alert.message,
          severity: alert.severity as AlertSeverity,
          isRead: false,
          latitude: currentLocation.latitude ?? null,
          longitude: currentLocation.longitude ?? null,
        });

        await this.alertRepository.save(entity);

        await this.pushDispatchService.dispatchAlertPush({
          userId: entity.userId,
          alertId: entity.id,
          type: entity.type,
          message: entity.message,
          severity: entity.severity,
        });

        // 6. LOG PRO PRE (FRANÇAIS)
        this.logger.debug(
          `Alerte créée | utilisateur=${profile.userId} | type=${alert.type} | niveau=${alert.severity}`,
        );
      }

      this.logger.log('Analyse des alertes terminée avec succès');
    } catch (err) {
      this.logger.error(
        'Erreur globale cron alerts',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
