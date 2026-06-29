import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, ObjectLiteral, Repository } from 'typeorm';
import { IncidentStatus } from '../../common/enums/incident-status.enum';
import { IncidentType } from '../../common/enums/incident-type.enum';
import { TrafficCondition } from '../../common/enums/traffic-condition.enum';
import { Incident } from '../incidents/entities/incident.entity';
import { TrafficReport } from '../traffic/entities/traffic-report.entity';
import { UserEntity } from '../users/entities/user.entity';
import {
  AnalyticsResponseDto,
  HourlyDensityDto,
  IncidentTypeCountDto,
  MonthlyTrendDto,
  ZoneCountDto,
} from './dto/analytics.dto';
import {
  DashboardResponseDto,
  HourlyTrafficDto,
  MonthlyCountDto,
  TrafficShareDto,
} from './dto/dashboard.dto';

/** Nombre de mois glissants pris en compte par les tendances. */
const TREND_MONTHS = 6;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentsRepository: Repository<Incident>,
    @InjectRepository(TrafficReport)
    private readonly trafficRepository: Repository<TrafficReport>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async getDashboard(): Promise<DashboardResponseDto> {
    const [
      activeUsers,
      totalIncidents,
      reportsToday,
      monitoredRoads,
      trafficShare,
      hourlyTraffic,
      monthlyReports,
    ] = await Promise.all([
      this.usersRepository.count({ where: { isActive: true } }),
      this.incidentsRepository.count(),
      this.incidentsRepository.count({
        where: { createdAt: MoreThanOrEqual(startOfToday()) },
      }),
      this.countDistinctIncidentAddresses(),
      this.getTrafficShare(),
      this.getHourlyTraffic(),
      this.getMonthlyIncidents(),
    ]);

    return {
      stats: { activeUsers, reportsToday, monitoredRoads, totalIncidents },
      trafficShare,
      hourlyTraffic,
      monthlyReports,
    };
  }

  async getAnalytics(): Promise<AnalyticsResponseDto> {
    const [
      totalUsers,
      totalReports,
      totalTrafficReports,
      resolvedIncidents,
      monthlyTrends,
      hourlyDensity,
      incidentTypes,
      topZones,
    ] = await Promise.all([
      this.usersRepository.count(),
      this.incidentsRepository.count(),
      this.trafficRepository.count(),
      this.incidentsRepository.count({
        where: { status: IncidentStatus.RESOLVED },
      }),
      this.getMonthlyTrends(),
      this.getHourlyDensity(),
      this.getIncidentTypes(),
      this.getTopZones(),
    ]);

    return {
      summary: {
        totalUsers,
        totalReports,
        totalTrafficReports,
        resolvedRate: totalReports > 0 ? resolvedIncidents / totalReports : 0,
      },
      monthlyTrends,
      hourlyDensity,
      incidentTypes,
      topZones,
    };
  }

  /* ---------------------------------------------------------------- */
  /* Agrégations dashboard                                            */
  /* ---------------------------------------------------------------- */

  private async countDistinctIncidentAddresses(): Promise<number> {
    const row = await this.incidentsRepository
      .createQueryBuilder('incident')
      .select('COUNT(DISTINCT incident.address)', 'count')
      .where('incident.address IS NOT NULL')
      .getRawOne<{ count: string }>();

    return Number(row?.count) || 0;
  }

  private async getTrafficShare(): Promise<TrafficShareDto[]> {
    const rows = await this.trafficRepository
      .createQueryBuilder('report')
      .select('report.condition', 'condition')
      .addSelect('COUNT(*)', 'count')
      .groupBy('report.condition')
      .getRawMany<{ condition: TrafficCondition; count: string }>();

    return rows.map((row) => ({
      condition: row.condition,
      count: Number(row.count),
    }));
  }

  private async getHourlyTraffic(): Promise<HourlyTrafficDto[]> {
    const rows = await this.trafficRepository
      .createQueryBuilder('report')
      .select('EXTRACT(HOUR FROM report.created_at)::int', 'hour')
      .addSelect('report.condition', 'condition')
      .addSelect('COUNT(*)', 'count')
      .groupBy('hour')
      .addGroupBy('report.condition')
      .orderBy('hour', 'ASC')
      .getRawMany<{
        hour: number;
        condition: TrafficCondition;
        count: string;
      }>();

    const byHour = new Map<number, Record<TrafficCondition, number>>();

    for (const row of rows) {
      const hour = Number(row.hour);
      if (!byHour.has(hour)) {
        byHour.set(hour, emptyConditionRecord());
      }
      byHour.get(hour)![row.condition] = Number(row.count);
    }

    return [...byHour.entries()]
      .sort(([a], [b]) => a - b)
      .map(([hour, conditions]) => ({ hour, conditions }));
  }

  private async getMonthlyIncidents(): Promise<MonthlyCountDto[]> {
    const rows = await this.incidentsRepository
      .createQueryBuilder('incident')
      .select(
        "to_char(date_trunc('month', incident.created_at), 'YYYY-MM')",
        'month',
      )
      .addSelect('COUNT(*)', 'count')
      .where('incident.created_at >= :since', {
        since: monthsAgo(TREND_MONTHS),
      })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany<{ month: string; count: string }>();

    return rows.map((row) => ({ month: row.month, count: Number(row.count) }));
  }

  /* ---------------------------------------------------------------- */
  /* Agrégations analytiques                                          */
  /* ---------------------------------------------------------------- */

  private async getMonthlyTrends(): Promise<MonthlyTrendDto[]> {
    const since = monthsAgo(TREND_MONTHS);

    const [incidents, traffic, users] = await Promise.all([
      this.monthlyCounts(this.incidentsRepository, 'incident', since),
      this.monthlyCounts(this.trafficRepository, 'report', since),
      this.monthlyCounts(this.usersRepository, 'user', since),
    ]);

    const months = [
      ...new Set([...incidents.keys(), ...traffic.keys(), ...users.keys()]),
    ].sort();

    return months.map((month) => ({
      month,
      reports: incidents.get(month) ?? 0,
      trafficReports: traffic.get(month) ?? 0,
      newUsers: users.get(month) ?? 0,
    }));
  }

  private async monthlyCounts<T extends ObjectLiteral>(
    repository: Repository<T>,
    alias: string,
    since: Date,
  ): Promise<Map<string, number>> {
    const rows = await repository
      .createQueryBuilder(alias)
      .select(
        `to_char(date_trunc('month', ${alias}.created_at), 'YYYY-MM')`,
        'month',
      )
      .addSelect('COUNT(*)', 'count')
      .where(`${alias}.created_at >= :since`, { since })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany<{ month: string; count: string }>();

    return new Map(rows.map((row) => [row.month, Number(row.count)]));
  }

  private async getHourlyDensity(): Promise<HourlyDensityDto[]> {
    const rows = await this.trafficRepository
      .createQueryBuilder('report')
      .select('EXTRACT(HOUR FROM report.created_at)::int', 'hour')
      .addSelect('COUNT(*)', 'count')
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany<{ hour: number; count: string }>();

    return rows.map((row) => ({
      hour: Number(row.hour),
      count: Number(row.count),
    }));
  }

  private async getIncidentTypes(): Promise<IncidentTypeCountDto[]> {
    const rows = await this.incidentsRepository
      .createQueryBuilder('incident')
      .select('incident.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('incident.type')
      .getRawMany<{ type: IncidentType; count: string }>();

    return rows.map((row) => ({ type: row.type, count: Number(row.count) }));
  }

  private async getTopZones(): Promise<ZoneCountDto[]> {
    const rows = await this.incidentsRepository
      .createQueryBuilder('incident')
      .select('incident.address', 'address')
      .addSelect('COUNT(*)', 'count')
      .where('incident.address IS NOT NULL')
      .groupBy('incident.address')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany<{ address: string; count: string }>();

    return rows.map((row) => ({
      address: row.address,
      count: Number(row.count),
    }));
  }
}

function emptyConditionRecord(): Record<TrafficCondition, number> {
  return {
    [TrafficCondition.FLUID]: 0,
    [TrafficCondition.MODERATE]: 0,
    [TrafficCondition.HEAVY]: 0,
    [TrafficCondition.BLOCKED]: 0,
  };
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function monthsAgo(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  date.setHours(0, 0, 0, 0);
  return date;
}
