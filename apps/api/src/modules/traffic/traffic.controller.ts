import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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
import { CreateTrafficReportDto } from './dto/create-traffic-report.dto';
import {
  CreateTrafficTrackDto,
  TrafficTrackUploadResponseDto,
} from './dto/create-traffic-track.dto';
import {
  QueryAdminTrafficReportsDto,
  QueryTrafficReportsDto,
  TrafficReportResponseDto,
  TrafficSummaryDto,
} from './dto/traffic-report.dto';
import { TrafficSummaryQueryDto } from './dto/traffic-summary-query.dto';
import {
  QueryTrafficTracksDto,
  TrafficTrackResponseDto,
} from './dto/traffic-track.dto';
import {
  QueryTrafficSpeedSamplesDto,
  QueryLatestUserPositionsDto,
  TrafficSpeedSampleResponseDto,
} from './dto/traffic-speed-sample.dto';
import { TrafficService } from './traffic.service';

@ApiTags('traffic')
@Controller('traffic')
export class TrafficController {
  constructor(private readonly trafficService: TrafficService) {}

  @Post('reports')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Signaler l’état du trafic (fluide, bloqué…)' })
  @ApiResponse({ status: 201, type: TrafficReportResponseDto })
  report(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTrafficReportDto,
  ): Promise<TrafficReportResponseDto> {
    return this.trafficService.report(user.id, dto);
  }

  @Post('tracks')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Envoyer un tracé GPS passif (navigation) pour détection trafic',
  })
  @ApiResponse({ status: 201, type: TrafficTrackUploadResponseDto })
  uploadTrack(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTrafficTrackDto,
  ): Promise<TrafficTrackUploadResponseDto> {
    return this.trafficService.uploadTrack(user.id, dto);
  }

  @Public()
  @Get('tracks')
  @ApiOperation({
    summary: 'Lister les tracés GPS passifs (évolution des véhicules)',
  })
  @ApiResponse({ status: 200, type: TrafficTrackResponseDto, isArray: true })
  findTracks(
    @Query() query: QueryTrafficTracksDto,
  ): Promise<PaginatedResponseDto<TrafficTrackResponseDto>> {
    return this.trafficService.findTracks(query);
  }

  @Public()
  @Get('tracks/:id')
  @ApiOperation({ summary: 'Détail d’un tracé GPS avec polyligne complète' })
  @ApiResponse({ status: 200, type: TrafficTrackResponseDto })
  findTrackById(@Param('id') id: string): Promise<TrafficTrackResponseDto> {
    return this.trafficService.findTrackById(id);
  }

  @Public()
  @Get('samples/latest')
  @ApiOperation({
    summary:
      'Dernière position connue de chaque utilisateur actif récemment',
  })
  @ApiResponse({
    status: 200,
    type: TrafficSpeedSampleResponseDto,
    isArray: true,
  })
  findLatestUserPositions(
    @Query() query: QueryLatestUserPositionsDto,
  ): Promise<PaginatedResponseDto<TrafficSpeedSampleResponseDto>> {
    return this.trafficService.findLatestUserPositions(query);
  }

  @Public()
  @Get('samples')
  @ApiOperation({
    summary:
      'Lister les positions GPS individuelles (traffic_speed_samples)',
  })
  @ApiResponse({
    status: 200,
    type: TrafficSpeedSampleResponseDto,
    isArray: true,
  })
  findSpeedSamples(
    @Query() query: QueryTrafficSpeedSamplesDto,
  ): Promise<PaginatedResponseDto<TrafficSpeedSampleResponseDto>> {
    return this.trafficService.findSpeedSamples(query);
  }

  @Public()
  @Get('reports')
  @ApiOperation({ summary: 'Rapports de trafic récents autour d’un point' })
  findReports(
    @Query() query: QueryTrafficReportsDto,
  ): Promise<PaginatedResponseDto<TrafficReportResponseDto>> {
    return this.trafficService.findRecent(query);
  }

  @Get('admin/reports')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lister les signalements de trafic (admin)' })
  findReportsAdmin(
    @Query() query: QueryAdminTrafficReportsDto,
  ): Promise<PaginatedResponseDto<TrafficReportResponseDto>> {
    return this.trafficService.findAllForAdmin(query);
  }

  @Public()
  @Get('summary')
  @ApiOperation({ summary: 'Synthèse du trafic pour un point (carte)' })
  @ApiResponse({ status: 200, type: TrafficSummaryDto })
  getSummary(
    @Query() query: TrafficSummaryQueryDto,
  ): Promise<TrafficSummaryDto> {
    return this.trafficService.getSummary(
      query.latitude,
      query.longitude,
      query.radiusKm,
    );
  }
}
