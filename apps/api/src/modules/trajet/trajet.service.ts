import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTrajetDto } from './dto/create-trajet.dto';
import { TrajetResponseDto } from './dto/trajet-response.dto';
import { UpdateTrajetDto } from './dto/update-trajet.dto';
import { Trajet } from './entities/trajet.entity';

const MAX_TRAJETS_PER_USER = 10;

@Injectable()
export class TrajetService {
  constructor(
    @InjectRepository(Trajet)
    private readonly trajetsRepository: Repository<Trajet>,
  ) {}

  async create(
    userId: string,
    dto: CreateTrajetDto,
  ): Promise<TrajetResponseDto> {
    const count = await this.trajetsRepository.count({ where: { userId } });

    if (count >= MAX_TRAJETS_PER_USER) {
      throw new ConflictException(
        `Limite de ${MAX_TRAJETS_PER_USER} destinations atteinte`,
      );
    }

    const existing = await this.trajetsRepository.findOne({
      where: { userId, label: dto.label.trim() },
    });

    if (existing) {
      throw new ConflictException(
        `Une destination « ${dto.label.trim()} » existe déjà`,
      );
    }

    const trajet = this.trajetsRepository.create({
      userId,
      label: dto.label.trim(),
      category: dto.category ?? null,
      address: dto.address.trim(),
      latitude: dto.latitude.toString(),
      longitude: dto.longitude.toString(),
      sortOrder: dto.sortOrder ?? count,
    });

    const saved = await this.trajetsRepository.save(trajet);
    return this.toResponse(saved);
  }

  async findAllForUser(userId: string): Promise<TrajetResponseDto[]> {
    const trajets = await this.trajetsRepository.find({
      where: { userId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    return trajets.map((trajet) => this.toResponse(trajet));
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<TrajetResponseDto> {
    const trajet = await this.findOwnedOrFail(id, userId);
    return this.toResponse(trajet);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateTrajetDto,
  ): Promise<TrajetResponseDto> {
    const trajet = await this.findOwnedOrFail(id, userId);

    if (dto.label !== undefined) {
      const trimmed = dto.label.trim();
      if (trimmed !== trajet.label) {
        const duplicate = await this.trajetsRepository.findOne({
          where: { userId, label: trimmed },
        });
        if (duplicate && duplicate.id !== id) {
          throw new ConflictException(
            `Une destination « ${trimmed} » existe déjà`,
          );
        }
        trajet.label = trimmed;
      }
    }

    if (dto.category !== undefined) trajet.category = dto.category;
    if (dto.address !== undefined) trajet.address = dto.address.trim();
    if (dto.latitude !== undefined) {
      trajet.latitude = dto.latitude.toString();
    }
    if (dto.longitude !== undefined) {
      trajet.longitude = dto.longitude.toString();
    }
    if (dto.sortOrder !== undefined) trajet.sortOrder = dto.sortOrder;

    const updated = await this.trajetsRepository.save(trajet);
    return this.toResponse(updated);
  }

  async remove(id: string, userId: string): Promise<void> {
    const trajet = await this.findOwnedOrFail(id, userId);
    await this.trajetsRepository.softRemove(trajet);
  }

  private async findOwnedOrFail(id: string, userId: string): Promise<Trajet> {
    const trajet = await this.trajetsRepository.findOne({ where: { id } });

    if (!trajet) {
      throw new NotFoundException('Destination introuvable');
    }

    if (trajet.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez accéder qu’à vos propres destinations',
      );
    }

    return trajet;
  }

  toResponse(trajet: Trajet): TrajetResponseDto {
    return {
      id: trajet.id,
      label: trajet.label,
      category: trajet.category,
      address: trajet.address,
      latitude: trajet.latitude,
      longitude: trajet.longitude,
      sortOrder: trajet.sortOrder,
      createdAt: trajet.createdAt,
      updatedAt: trajet.updatedAt,
    };
  }
}
