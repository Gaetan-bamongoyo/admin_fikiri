import { ApiProperty } from '@nestjs/swagger';
import { RideStatus } from '../enums/ride-status.enum';

export class RidesStatsDto {
  @ApiProperty({ description: 'Nombre total de courses' })
  totalRides!: number;

  @ApiProperty({ description: 'Courses terminées' })
  completedRides!: number;

  @ApiProperty({ description: 'Courses en cours (suivi temps réel)' })
  activeRides!: number;

  @ApiProperty({ description: 'Courses annulées' })
  cancelledRides!: number;

  @ApiProperty({ description: 'Distance totale parcourue (km)' })
  totalDistanceKm!: number;

  @ApiProperty({ description: 'Durée moyenne des trajets (min)' })
  avgDurationMin!: number;

  @ApiProperty({ description: 'Revenus générés (courses terminées)' })
  totalRevenue!: number;

  @ApiProperty({ description: 'Répartition par statut' })
  byStatus!: Record<RideStatus, number>;
}
