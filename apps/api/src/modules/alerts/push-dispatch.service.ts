import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AlertSeverity } from '../../common/enums/alert-severity.enum';

const ALERT_TYPE_TO_PUSH_CATEGORY: Record<string, string> = {
  TRAFFIC_WARNING: 'anticipatory',
};

function pushTitleForSeverity(severity: AlertSeverity): string {
  switch (severity) {
    case AlertSeverity.HIGH:
      return 'Trafic élevé';
    case AlertSeverity.MEDIUM:
      return 'Alerte trafic';
    default:
      return 'Fikiri Traffic';
  }
}

export interface DispatchAlertPushParams {
  userId: string;
  alertId: string;
  type: string;
  message: string;
  severity: AlertSeverity;
}

@Injectable()
export class PushDispatchService {
  private readonly logger = new Logger(PushDispatchService.name);

  constructor(private readonly configService: ConfigService) {}

  async dispatchAlertPush(params: DispatchAlertPushParams): Promise<void> {
    const baseUrl = this.configService.get<string>('notifications.pythonApiUrl');
    const secret = this.configService.get<string>('notifications.internalSecret');

    if (!baseUrl?.trim() || !secret?.trim()) {
      this.logger.debug(
        'Push ignorée : PYTHON_API_URL ou NOTIFICATIONS_INTERNAL_SECRET non configuré.',
      );
      return;
    }

    const alertType = ALERT_TYPE_TO_PUSH_CATEGORY[params.type] ?? 'generic';
    const title = pushTitleForSeverity(params.severity);
    const url = `${baseUrl.replace(/\/$/, '')}/api/v1/notifications/dispatch`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Notifications-Internal-Secret': secret,
        },
        body: JSON.stringify({
          user_id: params.userId,
          title,
          body: params.message,
          alert_type: alertType,
          data: {
            alert_id: params.alertId,
            type: params.type,
            severity: params.severity,
          },
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        this.logger.warn(
          `Échec dispatch push alert=${params.alertId} status=${response.status} ${detail}`,
        );
        return;
      }

      const result = (await response.json()) as {
        success_count?: number;
        failure_count?: number;
      };

      this.logger.debug(
        `Push dispatch alert=${params.alertId} success=${result.success_count ?? 0} failure=${result.failure_count ?? 0}`,
      );
    } catch (err) {
      this.logger.error(
        `Erreur dispatch push alert=${params.alertId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
