import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateRideDto } from './dto/create-ride.dto';
import { QueryRidesDto } from './dto/query-rides.dto';
import { RideResponseDto } from './dto/ride-response.dto';
import { RidesStatsDto } from './dto/rides-stats.dto';
import { UpdateRideStatusDto } from './dto/update-ride-status.dto';
import { RidesService } from './rides.service';

@ApiTags('rides')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Get()
  @ApiOperation({ summary: 'Historique des courses (filtres + pagination)' })
  findAll(
    @Query() query: QueryRidesDto,
  ): Promise<PaginatedResponseDto<RideResponseDto>> {
    return this.ridesService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Courses en cours (suivi temps réel)' })
  @ApiResponse({ status: 200, type: [RideResponseDto] })
  findActive(): Promise<RideResponseDto[]> {
    return this.ridesService.findActive();
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Statistiques des courses (nombre, distance, revenus)',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, type: RidesStatsDto })
  getStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<RidesStatsDto> {
    return this.ridesService.getStats(from, to);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une course' })
  @ApiResponse({ status: 200, type: RideResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RideResponseDto> {
    return this.ridesService.findByIdOrFail(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une course (commande / saisie admin)' })
  @ApiResponse({ status: 201, type: RideResponseDto })
  create(@Body() dto: CreateRideDto): Promise<RideResponseDto> {
    return this.ridesService.create(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d’une course' })
  @ApiResponse({ status: 200, type: RideResponseDto })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRideStatusDto,
  ): Promise<RideResponseDto> {
    return this.ridesService.updateStatus(id, dto);
  }
}
