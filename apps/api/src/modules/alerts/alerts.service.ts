import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { HabitComparatorUtil } from './utils/habit-comparator.util';
import { UserAlert } from './interfaces/user-alert.interface';
import { AlertEntity } from './entities/alert.entity';
import { AlertSeverity } from '../../common/enums/alert-severity.enum';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(AlertEntity)
    private readonly alertRepo: Repository<AlertEntity>,
  ) {}

  generateAlert(
    userId: string,
    habitProfile: any,
    currentLocation: { latitude: number; longitude: number },
  ): UserAlert | null {
    const hour = new Date().getHours();

    const isFrequentZone = HabitComparatorUtil.isFrequentZone(
      currentLocation.latitude,
      currentLocation.longitude,
      habitProfile.frequentZones,
    );

    const trafficRisk = HabitComparatorUtil.getTrafficRisk(
      hour,
    ) as AlertSeverity;

    if (!isFrequentZone && trafficRisk === AlertSeverity.LOW) {
      return null;
    }

    let message = '';

    if (isFrequentZone && trafficRisk === AlertSeverity.HIGH) {
      message = 'Trajet habituel avec trafic élevé détecté';
    } else if (isFrequentZone) {
      message = 'Zone fréquemment visitée détectée';
    } else {
      message = 'Conditions de trafic modérées détectées';
    }

    return {
      userId,
      type: 'TRAFFIC_WARNING',
      message,
      severity: trafficRisk,
      createdAt: new Date(),
    };
  }

  async getUserAlerts(userId: string): Promise<AlertEntity[]> {
    return this.alertRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(alertId: string): Promise<void> {
    await this.alertRepo.update(alertId, {
      isRead: true,
    });
  }
}
