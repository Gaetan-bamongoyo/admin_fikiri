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
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { FleetSummaryDto } from './dto/fleet-summary.dto';
import { QueryVehiclesDto } from './dto/query-vehicles.dto';
import { UpdateVehiclePositionDto } from './dto/update-position.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleResponseDto } from './dto/vehicle-response.dto';
import { FleetService } from './fleet.service';

@ApiTags('fleet')
@ApiBearerAuth()
@Controller('fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get('vehicles')
  @ApiOperation({
    summary: 'Lister les véhicules de la flotte (suivi en direct)',
  })
  findAll(
    @Query() query: QueryVehiclesDto,
  ): Promise<PaginatedResponseDto<VehicleResponseDto>> {
    return this.fleetService.findAll(query);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Synthèse de la flotte (compteurs par statut / type)',
  })
  @ApiResponse({ status: 200, type: FleetSummaryDto })
  getSummary(): Promise<FleetSummaryDto> {
    return this.fleetService.getSummary();
  }

  @Get('vehicles/:id')
  @ApiOperation({ summary: 'Détail d’un véhicule' })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<VehicleResponseDto> {
    return this.fleetService.findByIdOrFail(id);
  }

  @Post('vehicles')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Ajouter un véhicule à la flotte (admin)' })
  @ApiResponse({ status: 201, type: VehicleResponseDto })
  create(@Body() dto: CreateVehicleDto): Promise<VehicleResponseDto> {
    return this.fleetService.create(dto);
  }

  @Patch('vehicles/:id/position')
  @ApiOperation({
    summary: 'Mettre à jour la position / les passagers d’un véhicule',
  })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  updatePosition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehiclePositionDto,
  ): Promise<VehicleResponseDto> {
    return this.fleetService.updatePosition(id, dto);
  }

  @Patch('vehicles/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Modifier un véhicule (admin)' })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    return this.fleetService.update(id, dto);
  }

  @Delete('vehicles/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un véhicule (admin)' })
  @ApiResponse({ status: 204, description: 'Véhicule supprimé' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.fleetService.remove(id);
  }
}
