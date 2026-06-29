import { ApiProperty } from '@nestjs/swagger';
import { TrafficCondition } from '../../../common/enums/traffic-condition.enum';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Utilisateurs avec compte actif' })
  activeUsers!: number;

  @ApiProperty({ description: 'Incidents signalés aujourd’hui' })
  reportsToday!: number;

  @ApiProperty({
    description: 'Adresses/zones distinctes surveillées (incidents)',
  })
  monitoredRoads!: number;

  @ApiProperty({ description: 'Total des incidents enregistrés' })
  totalIncidents!: number;
}

export class TrafficShareDto {
  @ApiProperty({ enum: TrafficCondition })
  condition!: TrafficCondition;

  @ApiProperty()
  count!: number;
}

export class HourlyTrafficDto {
  @ApiProperty({ description: 'Heure de la journée (0–23)' })
  hour!: number;

  @ApiProperty({
    description: 'Nombre de signalements par condition de trafic',
  })
  conditions!: Record<TrafficCondition, number>;
}

export class MonthlyCountDto {
  @ApiProperty({ description: 'Mois au format YYYY-MM' })
  month!: string;

  @ApiProperty()
  count!: number;
}

export class DashboardResponseDto {
  @ApiProperty({ type: DashboardStatsDto })
  stats!: DashboardStatsDto;

  @ApiProperty({ type: [TrafficShareDto] })
  trafficShare!: TrafficShareDto[];

  @ApiProperty({ type: [HourlyTrafficDto] })
  hourlyTraffic!: HourlyTrafficDto[];

  @ApiProperty({
    type: [MonthlyCountDto],
    description: 'Incidents par mois (6 derniers mois)',
  })
  monthlyReports!: MonthlyCountDto[];
}
