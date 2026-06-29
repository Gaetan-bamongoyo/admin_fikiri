import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { ConfirmIncidentDto } from './dto/confirm-incident.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { IncidentConfirmationResponseDto } from './dto/incident-confirmation-response.dto';
import { IncidentResponseDto } from './dto/incident-response.dto';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IncidentsService } from './incidents.service';

@ApiTags('incidents')
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Signaler un incident (embouteillage, accident…)' })
  @ApiResponse({ status: 201, type: IncidentResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateIncidentDto,
  ): Promise<IncidentResponseDto> {
    return this.incidentsService.create(user.id, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lister les incidents actifs (carte / navigation)' })
  @ApiResponse({ status: 200 })
  findAll(
    @Query() query: QueryIncidentsDto,
  ): Promise<PaginatedResponseDto<IncidentResponseDto>> {
    return this.incidentsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un incident' })
  @ApiResponse({ status: 200, type: IncidentResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IncidentResponseDto> {
    return this.incidentsService.findByIdOrFail(id);
  }

  @Get(':id/confirmations')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmations/contestations d’un incident (admin)' })
  @ApiResponse({ status: 200, type: [IncidentConfirmationResponseDto] })
  findConfirmations(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IncidentConfirmationResponseDto[]> {
    return this.incidentsService.findConfirmations(id);
  }

  @Post(':id/confirm')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirmer ou contester un incident (intelligence collective)',
  })
  @ApiResponse({ status: 200, type: IncidentResponseDto })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConfirmIncidentDto,
  ): Promise<IncidentResponseDto> {
    return this.incidentsService.confirm(id, user.id, dto);
  }

  @Patch(':id/resolve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marquer un incident comme résolu' })
  @ApiResponse({ status: 200, type: IncidentResponseDto })
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IncidentResponseDto> {
    return this.incidentsService.resolve(id);
  }

  @Patch(':id/verify')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Valider un incident (admin) — le marque comme vérifié',
  })
  @ApiResponse({ status: 200, type: IncidentResponseDto })
  verify(@Param('id', ParseUUIDPipe) id: string): Promise<IncidentResponseDto> {
    return this.incidentsService.verify(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un incident (par le déclarant)' })
  @ApiResponse({ status: 200, type: IncidentResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateIncidentDto,
  ): Promise<IncidentResponseDto> {
    return this.incidentsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un incident (par le déclarant)' })
  @ApiResponse({ status: 204, description: 'Incident supprimé' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.incidentsService.remove(id, user.id);
  }
}
