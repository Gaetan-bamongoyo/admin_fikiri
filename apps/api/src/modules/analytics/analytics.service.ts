import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TrafficReport } from '../traffic/entities/traffic-report.entity';
import {
  FrequentHours,
  FrequentZone,
  UserHabitProfileEntity,
} from './entities/user-habit-profile.entity';

/**
 * Service d'analyse des habitudes utilisateur
 * BK-402 #23 - moteur d'intelligence comportementale
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(TrafficReport)
    private readonly trafficRepo: Repository<TrafficReport>,

    @InjectRepository(UserHabitProfileEntity)
    private readonly profileRepo: Repository<UserHabitProfileEntity>,
  ) {}

  /**
   * JOB PRINCIPAL - génération des profils utilisateurs
   */
  async computeUserHabitProfiles(): Promise<void> {
    try {
      const userIds = await this.trafficRepo
        .createQueryBuilder('t')
        .select('DISTINCT t.userId', 'userId')
        .getRawMany<{ userId: string }>();

      for (const u of userIds) {
        await this.analyzeUser(u.userId);
      }

      this.logger.log(`Profil d’habitudes générés: ${userIds.length}`);
    } catch (error) {
      this.logger.error('Erreur computeUserHabitProfiles', error);
    }
  }

  /**
   * Analyse d’un utilisateur
   */
  private async analyzeUser(userId: string): Promise<void> {
    const reports = await this.trafficRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    if (!reports || reports.length === 0) return;

    const zones = this.clusterZones(reports);
    const hours = this.analyzeHours(reports);

    await this.saveProfile({
      userId,
      frequentZones: zones,
      frequentHours: hours,
    });
  }

  /**
   * Sauvegarde du profil utilisateur
   */
  private async saveProfile(profile: {
    userId: string;
    frequentZones: FrequentZone[];
    frequentHours: FrequentHours;
  }): Promise<void> {
    const existing = await this.profileRepo.findOne({
      where: { userId: profile.userId },
    });

    if (existing) {
      await this.profileRepo.update(existing.id, profile);
      return;
    }

    await this.profileRepo.save(profile);
  }

  /**
   * Clusterisation GPS simple
   */
  private clusterZones(reports: TrafficReport[]): FrequentZone[] {
    const zones: { lat: number; lng: number; count: number }[] = [];
    const threshold = 0.005;

    for (const r of reports) {
      let found = false;

      for (const z of zones) {
        const distance =
          Math.abs(z.lat - Number(r.latitude)) +
          Math.abs(z.lng - Number(r.longitude));

        if (distance < threshold) {
          z.count += 1;
          found = true;
          break;
        }
      }

      if (!found) {
        zones.push({
          lat: Number(r.latitude),
          lng: Number(r.longitude),
          count: 1,
        });
      }
    }

    const total = reports.length;

    return zones.map((z) => ({
      latitude: z.lat,
      longitude: z.lng,
      weight: z.count / total,
    }));
  }

  /**
   * Analyse des horaires de déplacement
   */
  private analyzeHours(reports: TrafficReport[]) {
    const result = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    };

    for (const r of reports) {
      const hour = new Date(r.createdAt).getHours();

      if (hour >= 5 && hour < 11) result.morning++;
      else if (hour >= 11 && hour < 17) result.afternoon++;
      else if (hour >= 17 && hour < 21) result.evening++;
      else result.night++;
    }

    const total = reports.length || 1;

    return {
      morning: result.morning / total,
      afternoon: result.afternoon / total,
      evening: result.evening / total,
      night: result.night / total,
    };
  }

  /**
   * Utilisé par AlertsCron
   */
  async getAllHabitProfiles() {
    return this.profileRepo.find();
  }

  /**
   * Dernière position utilisateur
   */
  async getUserLastLocation(userId: string) {
    const last = await this.trafficRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 1,
    });

    if (!last.length) return null;

    return {
      latitude: Number(last[0].latitude),
      longitude: Number(last[0].longitude),
    };
  }
}
