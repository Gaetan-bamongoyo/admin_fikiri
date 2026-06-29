import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { paginationSkip } from '../../common/dto/pagination-query.dto';
import { CreateRideDto } from './dto/create-ride.dto';
import { QueryRidesDto } from './dto/query-rides.dto';
import { RideResponseDto } from './dto/ride-response.dto';
import { RidesStatsDto } from './dto/rides-stats.dto';
import { UpdateRideStatusDto } from './dto/update-ride-status.dto';
import { Ride } from './entities/ride.entity';
import { ACTIVE_RIDE_STATUSES, RideStatus } from './enums/ride-status.enum';
import { RIDE_EVENTS, type RideEventPayload } from './rides.events';

@Injectable()
export class RidesService {
  constructor(
    @InjectRepository(Ride)
    private readonly ridesRepository: Repository<Ride>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateRideDto): Promise<RideResponseDto> {
    const ride = this.ridesRepository.create({
      pickupAddress: dto.pickupAddress,
      pickupLat: dto.pickupLat.toString(),
      pickupLng: dto.pickupLng.toString(),
      dropoffAddress: dto.dropoffAddress,
      dropoffLat: dto.dropoffLat.toString(),
      dropoffLng: dto.dropoffLng.toString(),
      distanceKm: (dto.distanceKm ?? 0).toString(),
      durationMin: dto.durationMin ?? 0,
      price: (dto.price ?? 0).toString(),
      status: RideStatus.SEARCHING,
      passengerId: dto.passengerId,
      passengerName: dto.passengerName,
    });

    const saved = await this.ridesRepository.save(ride);
    const response = this.toResponse(saved);
    this.eventEmitter.emit(RIDE_EVENTS.CREATED, {
      ride: response,
    } satisfies RideEventPayload);
    return response;
  }

  async findAll(
    query: QueryRidesDto,
  ): Promise<PaginatedResponseDto<RideResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.ridesRepository.createQueryBuilder('ride');

    if (query.status) {
      qb.andWhere('ride.status = :status', { status: query.status });
    }
    if (query.driverId) {
      qb.andWhere('ride.driver_id = :driverId', { driverId: query.driverId });
    }
    if (query.from) {
      qb.andWhere('ride.created_at >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('ride.created_at <= :to', { to: query.to });
    }

    qb.orderBy('ride.created_at', 'DESC')
      .skip(paginationSkip(page, limit))
      .take(limit);

    const [rides, total] = await qb.getManyAndCount();

    return PaginatedResponseDto.from(
      rides.map((ride) => this.toResponse(ride)),
      total,
      page,
      limit,
    );
  }

  /** Courses actuellement en cours, pour le suivi temps réel. */
  async findActive(): Promise<RideResponseDto[]> {
    const rides = await this.ridesRepository.find({
      where: { status: In(ACTIVE_RIDE_STATUSES) },
      order: { createdAt: 'DESC' },
    });
    return rides.map((ride) => this.toResponse(ride));
  }

  async findByIdOrFail(id: string): Promise<RideResponseDto> {
    return this.toResponse(await this.getEntityOrFail(id));
  }

  async updateStatus(
    id: string,
    dto: UpdateRideStatusDto,
  ): Promise<RideResponseDto> {
    const ride = await this.getEntityOrFail(id);
    const now = new Date();

    ride.status = dto.status;
    if (dto.driverId !== undefined) ride.driverId = dto.driverId;
    if (dto.driverName !== undefined) ride.driverName = dto.driverName;

    if (dto.status === RideStatus.ASSIGNED && !ride.assignedAt) {
      ride.assignedAt = now;
    }
    if (dto.status === RideStatus.IN_PROGRESS && !ride.startedAt) {
      ride.startedAt = now;
    }
    if (dto.status === RideStatus.COMPLETED && !ride.completedAt) {
      ride.completedAt = now;
    }

    const saved = await this.ridesRepository.save(ride);
    const response = this.toResponse(saved);
    this.eventEmitter.emit(RIDE_EVENTS.UPDATED, {
      ride: response,
    } satisfies RideEventPayload);
    return response;
  }

  async getStats(from?: string, to?: string): Promise<RidesStatsDto> {
    const where =
      from && to
        ? { createdAt: Between(new Date(from), new Date(to)) }
        : from
          ? { createdAt: MoreThanOrEqual(new Date(from)) }
          : to
            ? { createdAt: LessThanOrEqual(new Date(to)) }
            : {};

    const rides = await this.ridesRepository.find({ where });

    const byStatus: Record<RideStatus, number> = {
      [RideStatus.SEARCHING]: 0,
      [RideStatus.ASSIGNED]: 0,
      [RideStatus.EN_ROUTE]: 0,
      [RideStatus.IN_PROGRESS]: 0,
      [RideStatus.COMPLETED]: 0,
      [RideStatus.CANCELLED]: 0,
    };

    let totalDistanceKm = 0;
    let completedDurationSum = 0;
    let totalRevenue = 0;

    for (const ride of rides) {
      byStatus[ride.status] += 1;
      totalDistanceKm += Number(ride.distanceKm);
      if (ride.status === RideStatus.COMPLETED) {
        completedDurationSum += ride.durationMin;
        totalRevenue += Number(ride.price);
      }
    }

    const completedRides = byStatus[RideStatus.COMPLETED];
    const activeRides = ACTIVE_RIDE_STATUSES.reduce(
      (sum, status) => sum + byStatus[status],
      0,
    );

    return {
      totalRides: rides.length,
      completedRides,
      activeRides,
      cancelledRides: byStatus[RideStatus.CANCELLED],
      totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
      avgDurationMin: completedRides
        ? Math.round(completedDurationSum / completedRides)
        : 0,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      byStatus,
    };
  }

  private async getEntityOrFail(id: string): Promise<Ride> {
    const ride = await this.ridesRepository.findOne({ where: { id } });
    if (!ride) {
      throw new NotFoundException('Course introuvable');
    }
    return ride;
  }

  private toResponse(ride: Ride): RideResponseDto {
    return {
      id: ride.id,
      pickupAddress: ride.pickupAddress,
      pickupLat: ride.pickupLat,
      pickupLng: ride.pickupLng,
      dropoffAddress: ride.dropoffAddress,
      dropoffLat: ride.dropoffLat,
      dropoffLng: ride.dropoffLng,
      distanceKm: ride.distanceKm,
      durationMin: ride.durationMin,
      price: ride.price,
      status: ride.status,
      driverId: ride.driverId,
      driverName: ride.driverName,
      passengerId: ride.passengerId,
      passengerName: ride.passengerName,
      assignedAt: ride.assignedAt,
      startedAt: ride.startedAt,
      completedAt: ride.completedAt,
      createdAt: ride.createdAt,
    };
  }
}
