import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { paginationSkip } from '../../common/dto/pagination-query.dto';
import { DRIVER_EVENTS } from '../../common/events/driver.events';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { FleetSummaryDto } from './dto/fleet-summary.dto';
import { QueryVehiclesDto } from './dto/query-vehicles.dto';
import { UpdateVehiclePositionDto } from './dto/update-position.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleResponseDto } from './dto/vehicle-response.dto';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleKind } from './enums/vehicle-kind.enum';
import { VehicleStatus } from './enums/vehicle-status.enum';

@Injectable()
export class FleetService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepository: Repository<Vehicle>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateVehicleDto): Promise<VehicleResponseDto> {
    const vehicle = this.vehiclesRepository.create({
      name: dto.name,
      kind: dto.kind,
      line: dto.line,
      plate: dto.plate,
      driverName: dto.driverName,
      capacity: dto.capacity ?? 0,
      status: dto.status,
      trafficCondition: dto.trafficCondition,
    });

    const saved = await this.vehiclesRepository.save(vehicle);
    return this.toResponse(saved);
  }

  async findAll(
    query: QueryVehiclesDto,
  ): Promise<PaginatedResponseDto<VehicleResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.vehiclesRepository.createQueryBuilder('vehicle');

    if (query.kind) {
      qb.andWhere('vehicle.kind = :kind', { kind: query.kind });
    }
    if (query.status) {
      qb.andWhere('vehicle.status = :status', { status: query.status });
    }

    qb.orderBy('vehicle.created_at', 'DESC')
      .skip(paginationSkip(page, limit))
      .take(limit);

    const [vehicles, total] = await qb.getManyAndCount();

    return PaginatedResponseDto.from(
      vehicles.map((vehicle) => this.toResponse(vehicle)),
      total,
      page,
      limit,
    );
  }

  async findByIdOrFail(id: string): Promise<VehicleResponseDto> {
    return this.toResponse(await this.getEntityOrFail(id));
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<VehicleResponseDto> {
    const vehicle = await this.getEntityOrFail(id);

    if (dto.name !== undefined) vehicle.name = dto.name;
    if (dto.kind !== undefined) vehicle.kind = dto.kind;
    if (dto.line !== undefined) vehicle.line = dto.line;
    if (dto.plate !== undefined) vehicle.plate = dto.plate;
    if (dto.driverName !== undefined) vehicle.driverName = dto.driverName;
    if (dto.capacity !== undefined) vehicle.capacity = dto.capacity;
    if (dto.status !== undefined) vehicle.status = dto.status;
    if (dto.trafficCondition !== undefined) {
      vehicle.trafficCondition = dto.trafficCondition;
    }

    return this.toResponse(await this.vehiclesRepository.save(vehicle));
  }

  async updatePosition(
    id: string,
    dto: UpdateVehiclePositionDto,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.getEntityOrFail(id);

    vehicle.latitude = dto.latitude.toString();
    vehicle.longitude = dto.longitude.toString();
    vehicle.lastSeenAt = new Date();

    if (vehicle.status === VehicleStatus.OFFLINE) {
      vehicle.status = VehicleStatus.ACTIVE;
    }
    if (dto.passengers !== undefined) vehicle.passengers = dto.passengers;
    if (dto.trafficCondition !== undefined) {
      vehicle.trafficCondition = dto.trafficCondition;
    }
    if (dto.distanceKm !== undefined) {
      vehicle.distanceKm = dto.distanceKm.toString();
    }

    const saved = await this.vehiclesRepository.save(vehicle);

    this.eventEmitter.emit(DRIVER_EVENTS.POSITION, {
      driverId: saved.id,
      name: saved.driverName ?? saved.name,
      latitude: dto.latitude,
      longitude: dto.longitude,
      status: saved.status,
      at: (saved.lastSeenAt ?? new Date()).toISOString(),
    });

    return this.toResponse(saved);
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.getEntityOrFail(id);
    await this.vehiclesRepository.softRemove(vehicle);
  }

  async getSummary(): Promise<FleetSummaryDto> {
    const vehicles = await this.vehiclesRepository.find();

    const byStatus: Record<VehicleStatus, number> = {
      [VehicleStatus.ACTIVE]: 0,
      [VehicleStatus.IDLE]: 0,
      [VehicleStatus.OFFLINE]: 0,
    };
    const byKind: Record<VehicleKind, number> = {
      [VehicleKind.BUS]: 0,
      [VehicleKind.MINIBUS]: 0,
      [VehicleKind.TAXI]: 0,
    };
    let totalPassengers = 0;

    for (const vehicle of vehicles) {
      byStatus[vehicle.status] += 1;
      byKind[vehicle.kind] += 1;
      totalPassengers += vehicle.passengers;
    }

    return { total: vehicles.length, byStatus, byKind, totalPassengers };
  }

  private async getEntityOrFail(id: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepository.findOne({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException('Véhicule introuvable');
    }

    return vehicle;
  }

  private toResponse(vehicle: Vehicle): VehicleResponseDto {
    return {
      id: vehicle.id,
      name: vehicle.name,
      kind: vehicle.kind,
      line: vehicle.line,
      plate: vehicle.plate,
      driverName: vehicle.driverName,
      capacity: vehicle.capacity,
      passengers: vehicle.passengers,
      status: vehicle.status,
      trafficCondition: vehicle.trafficCondition,
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      distanceKm: vehicle.distanceKm,
      lastSeenAt: vehicle.lastSeenAt,
      createdAt: vehicle.createdAt,
    };
  }
}
