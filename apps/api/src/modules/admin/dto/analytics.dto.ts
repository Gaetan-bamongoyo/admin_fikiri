import { ApiProperty } from '@nestjs/swagger';
import { IncidentType } from '../../../common/enums/incident-type.enum';

export class AnalyticsSummaryDto {
  @ApiProperty()
  totalUsers!: number;

  @ApiProperty({ description: 'Total des incidents signalés' })
  totalReports!: number;

  @ApiProperty({ description: 'Total des signalements d’état du trafic' })
  totalTrafficReports!: number;

  @ApiProperty({ description: 'Part d’incidents résolus (0–1)' })
  resolvedRate!: number;
}

export class MonthlyTrendDto {
  @ApiProperty({ description: 'Mois au format YYYY-MM' })
  month!: string;

  @ApiProperty({ description: 'Incidents signalés sur le mois' })
  reports!: number;

  @ApiProperty({ description: 'Signalements d’état du trafic sur le mois' })
  trafficReports!: number;

  @ApiProperty({ description: 'Nouveaux utilisateurs sur le mois' })
  newUsers!: number;
}

export class HourlyDensityDto {
  @ApiProperty({ description: 'Heure de la journée (0–23)' })
  hour!: number;

  @ApiProperty()
  count!: number;
}

export class IncidentTypeCountDto {
  @ApiProperty({ enum: IncidentType })
  type!: IncidentType;

  @ApiProperty()
  count!: number;
}

export class ZoneCountDto {
  @ApiProperty()
  address!: string;

  @ApiProperty()
  count!: number;
}

export class AnalyticsResponseDto {
  @ApiProperty({ type: AnalyticsSummaryDto })
  summary!: AnalyticsSummaryDto;

  @ApiProperty({ type: [MonthlyTrendDto] })
  monthlyTrends!: MonthlyTrendDto[];

  @ApiProperty({ type: [HourlyDensityDto] })
  hourlyDensity!: HourlyDensityDto[];

  @ApiProperty({ type: [IncidentTypeCountDto] })
  incidentTypes!: IncidentTypeCountDto[];

  @ApiProperty({
    type: [ZoneCountDto],
    description: 'Zones les plus signalées (top 5)',
  })
  topZones!: ZoneCountDto[];
}
