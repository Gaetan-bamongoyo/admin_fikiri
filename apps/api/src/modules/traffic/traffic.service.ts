import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { paginationSkip } from '../../common/dto/pagination-query.dto';
import { TrafficCondition } from '../../common/enums/traffic-condition.enum';
import { CreateTrafficReportDto } from './dto/create-traffic-report.dto';
import {
  QueryAdminTrafficReportsDto,
  QueryTrafficReportsDto,
  TrafficReportResponseDto,
  TrafficSummaryDto,
} from './dto/traffic-report.dto';
import { TrafficReport } from './entities/traffic-report.entity';
import { TrafficSpeedSample } from './entities/traffic-speed-sample.entity';
import { TrafficTrack } from './entities/traffic-track.entity';
import { UsersService } from '../users/users.service';
import {
  CreateTrafficTrackDto,
  TrafficTrackUploadResponseDto,
} from './dto/create-traffic-track.dto';
import {
  QueryTrafficTracksDto,
  TrafficTrackPointDto,
  TrafficTrackResponseDto,
} from './dto/traffic-track.dto';
import {
  QueryTrafficSpeedSamplesDto,
  QueryLatestUserPositionsDto,
  TrafficSpeedSampleResponseDto,
} from './dto/traffic-speed-sample.dto';

const TRACKS_DEFAULT_WINDOW_HOURS = 24;

const CONDITION_WEIGHT: Record<TrafficCondition, number> = {
  [TrafficCondition.FLUID]: 1,
  [TrafficCondition.MODERATE]: 2,
  [TrafficCondition.HEAVY]: 3,
  [TrafficCondition.BLOCKED]: 4,
};

@Injectable()
export class TrafficService {
  constructor(
    @InjectRepository(TrafficReport)
    private readonly trafficReportsRepository: Repository<TrafficReport>,
    @InjectRepository(TrafficSpeedSample)
    private readonly speedSamplesRepository: Repository<TrafficSpeedSample>,
    @InjectRepository(TrafficTrack)
    private readonly trafficTracksRepository: Repository<TrafficTrack>,
    private readonly usersService: UsersService,
  ) {}

  async report(
    userId: string,
    dto: CreateTrafficReportDto,
  ): Promise<TrafficReportResponseDto> {
    const user = await this.usersService.findByIdOrFail(userId);
    const anonymize = user.preferences?.anonymizePositionData ?? false;

    const report = this.trafficReportsRepository.create({
      userId: anonymize ? null : userId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      condition: dto.condition,
    });

    const saved = await this.trafficReportsRepository.save(report);

    return this.toResponse(saved);
  }

  async uploadTrack(
    userId: string,
    dto: CreateTrafficTrackDto,
  ): Promise<TrafficTrackUploadResponseDto> {
    const user = await this.usersService.findByIdOrFail(userId);
    const anonymize = user.preferences?.anonymizePositionData ?? false;
    const ownerId = anonymize ? null : userId;

    const samples = dto.points.map((point) => {
      const sample = this.speedSamplesRepository.create({
        latitude: point.latitude,
        longitude: point.longitude,
        speedMps: point.speedMs ?? null,
        recordedAt: new Date(point.recordedAt),
        source: 'navigation',
      });
      sample.userId = ownerId;
      return sample;
    });

    await this.speedSamplesRepository.save(samples);

    const coordinates = dto.points.map(
      (point) => [point.longitude, point.latitude] as [number, number],
    );

    await this.trafficTracksRepository.save(
      this.trafficTracksRepository.create({
        userId: ownerId,
        path: {
          type: 'LineString',
          coordinates,
        },
      }),
    );

    return {
      sampleCount: samples.length,
      trackSaved: true,
    };
  }

  async findTracks(
    query: QueryTrafficTracksDto,
  ): Promise<PaginatedResponseDto<TrafficTrackResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const includePath = query.includePath ?? false;

    const qb = this.trafficTracksRepository.createQueryBuilder('track');

    const from = query.from
      ? new Date(query.from)
      : new Date(Date.now() - TRACKS_DEFAULT_WINDOW_HOURS * 60 * 60 * 1000);
    qb.andWhere('track.created_at >= :from', { from });

    if (query.to) {
      qb.andWhere('track.created_at <= :to', { to: new Date(query.to) });
    }

    if (query.userId) {
      qb.andWhere('track.user_id = :userId', { userId: query.userId });
    }

    if (query.latitude !== undefined && query.longitude !== undefined) {
      const radiusKm = query.radiusKm ?? 3;
      qb.andWhere(
        'ST_DWithin(track.path, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, :radiusMeters)',
        {
          longitude: query.longitude,
          latitude: query.latitude,
          radiusMeters: radiusKm * 1000,
        },
      );
    }

    qb.orderBy('track.created_at', 'DESC')
      .skip(paginationSkip(page, limit))
      .take(limit);

    const [tracks, total] = await qb.getManyAndCount();

    return PaginatedResponseDto.from(
      tracks.map((track) => this.toTrackResponse(track, includePath)),
      total,
      page,
      limit,
    );
  }

  async findTrackById(id: string): Promise<TrafficTrackResponseDto> {
    const track = await this.trafficTracksRepository.findOne({ where: { id } });

    if (!track) {
      throw new NotFoundException('Tracé GPS introuvable.');
    }

    return this.toTrackResponse(track, true);
  }

  async findSpeedSamples(
    query: QueryTrafficSpeedSamplesDto,
  ): Promise<PaginatedResponseDto<TrafficSpeedSampleResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const qb = this.speedSamplesRepository.createQueryBuilder('sample');

    const from = query.from
      ? new Date(query.from)
      : new Date(Date.now() - TRACKS_DEFAULT_WINDOW_HOURS * 60 * 60 * 1000);
    qb.andWhere('sample.recorded_at >= :from', { from });

    if (query.to) {
      qb.andWhere('sample.recorded_at <= :to', { to: new Date(query.to) });
    }

    if (query.userId) {
      qb.andWhere('sample.user_id = :userId', { userId: query.userId });
    }

    if (query.latitude !== undefined && query.longitude !== undefined) {
      const radiusKm = query.radiusKm ?? 3;
      qb.andWhere(
        'ST_DWithin(sample.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, :radiusMeters)',
        {
          longitude: query.longitude,
          latitude: query.latitude,
          radiusMeters: radiusKm * 1000,
        },
      );
    }

    qb.orderBy('sample.recorded_at', 'DESC')
      .skip(paginationSkip(page, limit))
      .take(limit);

    const [samples, total] = await qb.getManyAndCount();

    return PaginatedResponseDto.from(
      samples.map((sample) => this.toSpeedSampleResponse(sample)),
      total,
      page,
      limit,
    );
  }

  async findLatestUserPositions(
    query: QueryLatestUserPositionsDto,
  ): Promise<PaginatedResponseDto<TrafficSpeedSampleResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const withinMinutes = query.withinMinutes ?? 30;
    const since = new Date(Date.now() - withinMinutes * 60 * 1000);

    const filterParams: unknown[] = [since];
    const filters: string[] = [];
    let paramIndex = 2;

    if (query.latitude !== undefined && query.longitude !== undefined) {
      const radiusKm = query.radiusKm ?? 10;
      filters.push(
        `ST_DWithin(latest.location, ST_SetSRID(ST_MakePoint($${paramIndex}, $${paramIndex + 1}), 4326)::geography, $${paramIndex + 2})`,
      );
      filterParams.push(query.longitude, query.latitude, radiusKm * 1000);
      paramIndex += 3;
    }

    if (query.userId) {
      filters.push(`latest.user_id = $${paramIndex}`);
      filterParams.push(query.userId);
      paramIndex += 1;
    }

    const filterClause =
      filters.length > 0 ? ` AND ${filters.join(' AND ')}` : '';

    const latestSubquery = `
      SELECT DISTINCT ON (s.user_id) s.*
      FROM traffic_speed_samples s
      WHERE s.deleted_at IS NULL
        AND s.user_id IS NOT NULL
        AND s.recorded_at >= $1
      ORDER BY s.user_id, s.recorded_at DESC
    `;

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM (${latestSubquery}) AS latest
      WHERE 1 = 1${filterClause}
    `;

    const dataSql = `
      SELECT latest.*
      FROM (${latestSubquery}) AS latest
      WHERE 1 = 1${filterClause}
      ORDER BY latest.recorded_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const [countRow] = await this.speedSamplesRepository.manager.query(
      countSql,
      filterParams,
    );
    const rows = await this.speedSamplesRepository.manager.query(dataSql, [
      ...filterParams,
      limit,
      paginationSkip(page, limit),
    ]);

    const total = Number(countRow?.total ?? 0);

    return PaginatedResponseDto.from(
      rows.map((row: Record<string, unknown>) =>
        this.toSpeedSampleResponseFromRaw(row),
      ),
      total,
      page,
      limit,
    );
  }

  async findRecent(
    query: QueryTrafficReportsDto,
  ): Promise<PaginatedResponseDto<TrafficReportResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.trafficReportsRepository
      .createQueryBuilder('report')
      .where('report.created_at > :since', {
        since: new Date(Date.now() - 2 * 60 * 60 * 1000),
      });

    if (query.latitude !== undefined && query.longitude !== undefined) {
      const radiusKm = query.radiusKm ?? 3;

      const latDelta = radiusKm / 111;
      const lngDelta =
        radiusKm / (111 * Math.cos((query.latitude * Math.PI) / 180));

      qb.andWhere('report.latitude BETWEEN :minLat AND :maxLat', {
        minLat: query.latitude - latDelta,
        maxLat: query.latitude + latDelta,
      }).andWhere('report.longitude BETWEEN :minLng AND :maxLng', {
        minLng: query.longitude - lngDelta,
        maxLng: query.longitude + lngDelta,
      });
    }

    qb.orderBy('report.created_at', 'DESC')
      .skip(paginationSkip(page, limit))
      .take(limit);

    const [reports, total] = await qb.getManyAndCount();

    return PaginatedResponseDto.from(
      reports.map((r) => this.toResponse(r)),
      total,
      page,
      limit,
    );
  }

  /** Liste admin : tous les signalements, filtrables par condition et période. */
  async findAllForAdmin(
    query: QueryAdminTrafficReportsDto,
  ): Promise<PaginatedResponseDto<TrafficReportResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.trafficReportsRepository.createQueryBuilder('report');

    if (query.condition) {
      qb.andWhere('report.condition = :condition', {
        condition: query.condition,
      });
    }
    if (query.from) {
      qb.andWhere('report.created_at >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('report.created_at <= :to', { to: query.to });
    }

    qb.orderBy('report.created_at', 'DESC')
      .skip(paginationSkip(page, limit))
      .take(limit);

    const [reports, total] = await qb.getManyAndCount();

    return PaginatedResponseDto.from(
      reports.map((r) => this.toResponse(r)),
      total,
      page,
      limit,
    );
  }

  async getSummary(
    latitude: number,
    longitude: number,
    radiusKm = 3,
  ): Promise<TrafficSummaryDto> {
    const result = await this.findRecent({
      latitude,
      longitude,
      radiusKm,
      page: 1,
      limit: 100,
    });

    if (result.data.length === 0) {
      return {
        dominantCondition: TrafficCondition.MODERATE,
        reportCount: 0,
        latitude,
        longitude,
      };
    }

    const scores = new Map<TrafficCondition, number>();

    for (const report of result.data) {
      scores.set(
        report.condition,
        (scores.get(report.condition) ?? 0) +
          CONDITION_WEIGHT[report.condition],
      );
    }

    let dominantCondition = TrafficCondition.MODERATE;
    let bestScore = 0;

    for (const [condition, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        dominantCondition = condition;
      }
    }

    return {
      dominantCondition,
      reportCount: result.data.length,
      latitude,
      longitude,
    };
  }

  private toTrackResponse(
    track: TrafficTrack,
    includePath: boolean,
  ): TrafficTrackResponseDto {
    const pathPoints = this.extractPathPoints(track.path);
    const startPoint = pathPoints[0] ?? { longitude: 0, latitude: 0 };
    const endPoint = pathPoints[pathPoints.length - 1] ?? startPoint;

    return {
      id: track.id,
      userId: track.userId,
      createdAt: track.createdAt,
      pointCount: pathPoints.length,
      startPoint,
      endPoint,
      path: includePath ? pathPoints : undefined,
    };
  }

  private extractPathPoints(path: TrafficTrack['path']): TrafficTrackPointDto[] {
    const coordinates = path?.coordinates ?? [];

    return coordinates.map(([longitude, latitude]) => ({
      longitude,
      latitude,
    }));
  }

  private toSpeedSampleResponse(
    sample: TrafficSpeedSample,
  ): TrafficSpeedSampleResponseDto {
    return {
      id: sample.id,
      userId: sample.userId,
      latitude: Number(sample.latitude),
      longitude: Number(sample.longitude),
      speedMps: sample.speedMps ?? null,
      recordedAt: sample.recordedAt,
      source: sample.source,
      createdAt: sample.createdAt,
    };
  }

  private toSpeedSampleResponseFromRaw(
    row: Record<string, unknown>,
  ): TrafficSpeedSampleResponseDto {
    return {
      id: String(row.id),
      userId: row.user_id ? String(row.user_id) : null,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      speedMps: row.speed_mps != null ? Number(row.speed_mps) : null,
      recordedAt: new Date(String(row.recorded_at)),
      source: String(row.source),
      createdAt: new Date(String(row.created_at)),
    };
  }

  private toResponse(report: TrafficReport): TrafficReportResponseDto {
    return {
      id: report.id,
      latitude: report.latitude,
      longitude: report.longitude,
      condition: report.condition,
      userId: report.userId,
      createdAt: report.createdAt,
    };
  }
}
