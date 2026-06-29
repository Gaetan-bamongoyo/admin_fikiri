import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { paginationSkip } from '../../common/dto/pagination-query.dto';
import { IncidentStatus } from '../../common/enums/incident-status.enum';
import { ConfirmIncidentDto } from './dto/confirm-incident.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IncidentConfirmationResponseDto } from './dto/incident-confirmation-response.dto';
import { IncidentResponseDto } from './dto/incident-response.dto';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { IncidentConfirmation } from './entities/incident-confirmation.entity';
import { Incident } from './entities/incident.entity';
import {
  INCIDENT_CONFIRMED_EVENT,
  INCIDENT_CREATED_EVENT,
  IncidentCreatedEvent,
} from './events/incident.events';

const DEFAULT_INCIDENT_TTL_HOURS = 4;
const CONFIRMATION_THRESHOLD = 3;

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentsRepository: Repository<Incident>,
    @InjectRepository(IncidentConfirmation)
    private readonly confirmationsRepository: Repository<IncidentConfirmation>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    reporterId: string,
    dto: CreateIncidentDto,
  ): Promise<IncidentResponseDto> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + DEFAULT_INCIDENT_TTL_HOURS);

    const incident = this.incidentsRepository.create({
      type: dto.type,
      latitude: dto.latitude.toString(),
      longitude: dto.longitude.toString(),
      description: dto.description,
      address: dto.address,
      reporterId,
      expiresAt,
      confirmationCount: 1,
    });

    const saved = await this.incidentsRepository.save(incident);

    await this.confirmationsRepository.save(
      this.confirmationsRepository.create({
        incidentId: saved.id,
        userId: reporterId,
        isConfirm: true,
      }),
    );

    this.eventEmitter.emit(
      INCIDENT_CREATED_EVENT,
      new IncidentCreatedEvent(saved, reporterId),
    );

    return this.toResponse(saved);
  }

  async findAll(
    query: QueryIncidentsDto,
  ): Promise<PaginatedResponseDto<IncidentResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.incidentsRepository
      .createQueryBuilder('incident')
      .where('incident.status = :status', {
        status: query.status ?? IncidentStatus.ACTIVE,
      })
      .andWhere('incident.expires_at > :now', { now: new Date() });

    if (query.type) {
      qb.andWhere('incident.type = :type', { type: query.type });
    }

    if (query.latitude !== undefined && query.longitude !== undefined) {
      const radiusKm = query.radiusKm ?? 5;
      qb.andWhere(
        'ST_DWithin(incident.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, :radiusMeters)',
        {
          longitude: query.longitude,
          latitude: query.latitude,
          radiusMeters: radiusKm * 1000,
        },
      );
    }

    qb.orderBy('incident.created_at', 'DESC')
      .skip(paginationSkip(page, limit))
      .take(limit);

    const [incidents, total] = await qb.getManyAndCount();

    return PaginatedResponseDto.from(
      incidents.map((incident) => this.toResponse(incident)),
      total,
      page,
      limit,
    );
  }

  async findByIdOrFail(id: string): Promise<IncidentResponseDto> {
    const incident = await this.incidentsRepository.findOne({ where: { id } });

    if (!incident) {
      throw new NotFoundException('Incident introuvable');
    }

    return this.toResponse(incident);
  }

  /** Liste les confirmations/contestations d'un incident (vue admin). */
  async findConfirmations(
    incidentId: string,
  ): Promise<IncidentConfirmationResponseDto[]> {
    const incident = await this.incidentsRepository.findOne({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException('Incident introuvable');
    }

    const confirmations = await this.confirmationsRepository.find({
      where: { incidentId },
      order: { createdAt: 'DESC' },
    });

    return confirmations.map((c) => ({
      id: c.id,
      userId: c.userId,
      isConfirm: c.isConfirm,
      createdAt: c.createdAt,
    }));
  }

  async confirm(
    incidentId: string,
    userId: string,
    dto: ConfirmIncidentDto,
  ): Promise<IncidentResponseDto> {
    const incident = await this.incidentsRepository.findOne({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException('Incident introuvable');
    }

    if (incident.status !== IncidentStatus.ACTIVE) {
      throw new BadRequestException('Cet incident n’est plus actif');
    }

    const existing = await this.confirmationsRepository.findOne({
      where: { incidentId, userId },
    });

    if (existing) {
      throw new ConflictException('Vous avez déjà répondu à cet incident');
    }

    await this.confirmationsRepository.save(
      this.confirmationsRepository.create({
        incidentId,
        userId,
        isConfirm: dto.isConfirm,
      }),
    );

    if (!dto.isConfirm) {
      await this.incidentsRepository.softRemove(incident);

      this.eventEmitter.emit(INCIDENT_CONFIRMED_EVENT, {
        incidentId,
        userId,
        isConfirm: false,
        removed: true,
      });

      return this.toResponse(incident);
    }

    incident.confirmationCount += 1;

    if (incident.confirmationCount >= CONFIRMATION_THRESHOLD) {
      incident.status = IncidentStatus.ACTIVE;
    }

    const updated = await this.incidentsRepository.save(incident);

    this.eventEmitter.emit(INCIDENT_CONFIRMED_EVENT, {
      incidentId,
      userId,
      isConfirm: dto.isConfirm,
    });

    return this.toResponse(updated);
  }

  /**
   * Validation par un administrateur : porte le compteur de confirmations
   * au seuil de fiabilité (l'incident passe « vérifié » côté admin).
   */
  async verify(incidentId: string): Promise<IncidentResponseDto> {
    const incident = await this.incidentsRepository.findOne({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException('Incident introuvable');
    }

    incident.status = IncidentStatus.ACTIVE;
    incident.confirmationCount = Math.max(
      incident.confirmationCount,
      CONFIRMATION_THRESHOLD,
    );

    const updated = await this.incidentsRepository.save(incident);
    return this.toResponse(updated);
  }

  async resolve(incidentId: string): Promise<IncidentResponseDto> {
    const incident = await this.incidentsRepository.findOne({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException('Incident introuvable');
    }

    incident.status = IncidentStatus.RESOLVED;
    incident.resolvedAt = new Date();

    const updated = await this.incidentsRepository.save(incident);
    return this.toResponse(updated);
  }

  async update(
    incidentId: string,
    userId: string,
    dto: UpdateIncidentDto,
  ): Promise<IncidentResponseDto> {
    const incident = await this.incidentsRepository.findOne({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException('Incident introuvable');
    }

    if (incident.reporterId !== userId) {
      throw new ForbiddenException(
        'Seul le déclarant peut modifier cet incident',
      );
    }

    if (incident.status !== IncidentStatus.ACTIVE) {
      throw new BadRequestException(
        "Impossible de modifier un incident qui n'est plus actif",
      );
    }

    if (dto.type !== undefined) incident.type = dto.type;
    if (dto.description !== undefined) incident.description = dto.description;
    if (dto.address !== undefined) incident.address = dto.address;

    const updated = await this.incidentsRepository.save(incident);
    return this.toResponse(updated);
  }

  async remove(incidentId: string, userId: string): Promise<void> {
    const incident = await this.incidentsRepository.findOne({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException('Incident introuvable');
    }

    if (incident.reporterId !== userId) {
      throw new ForbiddenException(
        'Seul le déclarant peut supprimer cet incident',
      );
    }

    await this.incidentsRepository.softRemove(incident);
  }

  toResponse(incident: Incident): IncidentResponseDto {
    return {
      id: incident.id,
      type: incident.type,
      status: incident.status,
      latitude: incident.latitude,
      longitude: incident.longitude,
      description: incident.description,
      address: incident.address,
      reporterId: incident.reporterId,
      confirmationCount: incident.confirmationCount,
      expiresAt: incident.expiresAt,
      resolvedAt: incident.resolvedAt,
      createdAt: incident.createdAt,
    };
  }
}
