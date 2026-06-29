import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { paginationSkip } from '../../common/dto/pagination-query.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  AdminUserResponseDto,
  UserStatsDto,
} from './dto/admin-user-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import {
  UserPreferencesResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { UserPreferences } from './entities/user-preferences.entity';
import { UserEntity } from './entities/user.entity';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(UserPreferences)
    private readonly preferencesRepository: Repository<UserPreferences>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = this.usersRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role,
    });

    const savedUser = await this.usersRepository.save(user);

    const preferences = this.preferencesRepository.create({
      userId: savedUser.id,
    });
    await this.preferencesRepository.save(preferences);

    return this.findByIdOrFail(savedUser.id);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: { preferences: true },
    });
  }

  async findByIdOrFail(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { preferences: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return user;
  }

  async updatePreferences(
    userId: string,
    dto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    const user = await this.findByIdOrFail(userId);

    if (!user.preferences) {
      const preferences = this.preferencesRepository.create({ userId });
      user.preferences = await this.preferencesRepository.save(preferences);
    }

    const updates: Partial<UserPreferences> = {};

    if (dto.homeLatitude !== undefined) {
      updates.homeLatitude =
        dto.homeLatitude === null ? null : dto.homeLatitude.toString();
    }
    if (dto.homeLongitude !== undefined) {
      updates.homeLongitude =
        dto.homeLongitude === null ? null : dto.homeLongitude.toString();
    }
    if (dto.workLatitude !== undefined) {
      updates.workLatitude =
        dto.workLatitude === null ? null : dto.workLatitude.toString();
    }
    if (dto.workLongitude !== undefined) {
      updates.workLongitude =
        dto.workLongitude === null ? null : dto.workLongitude.toString();
    }
    if (dto.notificationsEnabled !== undefined) {
      updates.notificationsEnabled = dto.notificationsEnabled;
    }
    if (dto.anticipatoryAlertsEnabled !== undefined) {
      updates.anticipatoryAlertsEnabled = dto.anticipatoryAlertsEnabled;
    }
    if (dto.anonymizePositionData !== undefined) {
      updates.anonymizePositionData = dto.anonymizePositionData;
    }
    if (dto.searchMetro !== undefined) {
      updates.searchMetro = dto.searchMetro;
    }
    if (dto.trafficRegionAlertsEnabled !== undefined) {
      updates.trafficRegionAlertsEnabled = dto.trafficRegionAlertsEnabled;
    }
    if (dto.routeIncidentAlertsEnabled !== undefined) {
      updates.routeIncidentAlertsEnabled = dto.routeIncidentAlertsEnabled;
    }
    if (dto.departureReminderMinutes !== undefined) {
      updates.departureReminderMinutes = dto.departureReminderMinutes;
    }
    if (dto.homeTrafficAlertsEnabled !== undefined) {
      updates.homeTrafficAlertsEnabled = dto.homeTrafficAlertsEnabled;
    }
    if (dto.workTrafficAlertsEnabled !== undefined) {
      updates.workTrafficAlertsEnabled = dto.workTrafficAlertsEnabled;
    }

    const updated = await this.preferencesRepository.save({
      ...user.preferences,
      ...updates,
    });

    return this.toPreferencesResponse(updated);
  }

  async addLoyaltyPoints(userId: string, points: number): Promise<void> {
    await this.usersRepository.increment(
      { id: userId },
      'loyaltyPoints',
      points,
    );
  }

  /* ---------------------------------------------------------------- */
  /* Administration                                                   */
  /* ---------------------------------------------------------------- */

  async findAllPaginated(
    query: QueryUsersDto,
  ): Promise<PaginatedResponseDto<AdminUserResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.usersRepository.createQueryBuilder('user');

    if (query.search) {
      qb.andWhere(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }
    if (query.isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    qb.orderBy('user.created_at', 'DESC')
      .skip(paginationSkip(page, limit))
      .take(limit);

    const [users, total] = await qb.getManyAndCount();

    return PaginatedResponseDto.from(
      users.map((user) => this.toAdminResponse(user)),
      total,
      page,
      limit,
    );
  }

  async getStats(): Promise<UserStatsDto> {
    const [total, active, admins] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { isActive: true } }),
      this.usersRepository.count({ where: { role: UserRole.ADMIN } }),
    ]);

    return { total, active, inactive: total - active, admins };
  }

  async updateRole(id: string, role: UserRole): Promise<AdminUserResponseDto> {
    const user = await this.findByIdOrFail(id);
    user.role = role;
    return this.toAdminResponse(await this.usersRepository.save(user));
  }

  async setActive(
    id: string,
    isActive: boolean,
  ): Promise<AdminUserResponseDto> {
    const user = await this.findByIdOrFail(id);
    user.isActive = isActive;
    return this.toAdminResponse(await this.usersRepository.save(user));
  }

  toAdminResponse(user: UserEntity): AdminUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      loyaltyPoints: user.loyaltyPoints,
      createdAt: user.createdAt,
    };
  }

  toResponse(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      loyaltyPoints: user.loyaltyPoints,
      createdAt: user.createdAt,
      preferences: user.preferences
        ? this.toPreferencesResponse(user.preferences)
        : undefined,
    };
  }

  private toPreferencesResponse(
    preferences: UserPreferences,
  ): UserPreferencesResponseDto {
    return {
      homeLatitude: preferences.homeLatitude,
      homeLongitude: preferences.homeLongitude,
      workLatitude: preferences.workLatitude,
      workLongitude: preferences.workLongitude,
      notificationsEnabled: preferences.notificationsEnabled,
      anticipatoryAlertsEnabled: preferences.anticipatoryAlertsEnabled,
      anonymizePositionData: preferences.anonymizePositionData,
      searchMetro: preferences.searchMetro,
      trafficRegionAlertsEnabled: preferences.trafficRegionAlertsEnabled,
      routeIncidentAlertsEnabled: preferences.routeIncidentAlertsEnabled,
      departureReminderMinutes: preferences.departureReminderMinutes,
      homeTrafficAlertsEnabled: preferences.homeTrafficAlertsEnabled,
      workTrafficAlertsEnabled: preferences.workTrafficAlertsEnabled,
    };
  }
}
