import { ApiProperty } from '@nestjs/swagger';
import { VehicleKind } from '../enums/vehicle-kind.enum';
import { VehicleStatus } from '../enums/vehicle-status.enum';

export class FleetSummaryDto {
  @ApiProperty({ description: 'Nombre total de véhicules' })
  total!: number;

  @ApiProperty({ description: 'Compteur par statut' })
  byStatus!: Record<VehicleStatus, number>;

  @ApiProperty({ description: 'Compteur par type de véhicule' })
  byKind!: Record<VehicleKind, number>;

  @ApiProperty({ description: 'Passagers actuellement transportés (somme)' })
  totalPassengers!: number;
}
