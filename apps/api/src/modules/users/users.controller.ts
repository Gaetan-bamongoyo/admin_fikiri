import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import {
  AdminUserResponseDto,
  UserStatsDto,
} from './dto/admin-user-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Profil de l’utilisateur connecté' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    return this.usersService
      .findByIdOrFail(user.id)
      .then((entity) => this.usersService.toResponse(entity));
  }

  @Patch('me/preferences')
  @ApiOperation({ summary: 'Mettre à jour les préférences de mobilité' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserPreferencesDto,
  ): Promise<UserResponseDto> {
    await this.usersService.updatePreferences(user.id, dto);
    const updated = await this.usersService.findByIdOrFail(user.id);
    return this.usersService.toResponse(updated);
  }

  @Post()
  @HttpCode(201)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer un utilisateur (admin)' })
  @ApiResponse({ status: 201, type: AdminUserResponseDto })
  async create(@Body() dto: CreateUserDto): Promise<AdminUserResponseDto> {
    const user = await this.usersService.create(dto);
    return this.usersService.toAdminResponse(user);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lister les utilisateurs (admin)' })
  findAll(
    @Query() query: QueryUsersDto,
  ): Promise<PaginatedResponseDto<AdminUserResponseDto>> {
    return this.usersService.findAllPaginated(query);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Statistiques utilisateurs (admin)' })
  @ApiResponse({ status: 200, type: UserStatsDto })
  getStats(): Promise<UserStatsDto> {
    return this.usersService.getStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Détails d’un utilisateur avec préférences (admin)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findByIdOrFail(id);
    return this.usersService.toResponse(user);
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Modifier le rôle d’un utilisateur (admin)' })
  @ApiResponse({ status: 200, type: AdminUserResponseDto })
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<AdminUserResponseDto> {
    return this.usersService.updateRole(id, dto.role);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activer / suspendre un utilisateur (admin)' })
  @ApiResponse({ status: 200, type: AdminUserResponseDto })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<AdminUserResponseDto> {
    return this.usersService.setActive(id, dto.isActive);
  }
}
