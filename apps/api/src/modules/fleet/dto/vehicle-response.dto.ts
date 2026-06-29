import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrafficCondition } from '../../../common/enums/traffic-condition.enum';
import { VehicleKind } from '../enums/vehicle-kind.enum';
import { VehicleStatus } from '../enums/vehicle-status.enum';

export class VehicleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: VehicleKind })
  kind!: VehicleKind;

  @ApiPropertyOptional()
  line?: string | null;

  @ApiPropertyOptional()
  plate?: string | null;

  @ApiPropertyOptional()
  driverName?: string | null;

  @ApiProperty()
  capacity!: number;

  @ApiProperty()
  passengers!: number;

  @ApiProperty({ enum: VehicleStatus })
  status!: VehicleStatus;

  @ApiProperty({ enum: TrafficCondition })
  trafficCondition!: TrafficCondition;

  @ApiPropertyOptional()
  latitude?: string | null;

  @ApiPropertyOptional()
  longitude?: string | null;

  @ApiProperty()
  distanceKm!: string;

  @ApiPropertyOptional()
  lastSeenAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;
}
