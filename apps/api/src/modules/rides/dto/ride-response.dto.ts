import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RideStatus } from '../enums/ride-status.enum';

export class RideResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  pickupAddress!: string;

  @ApiProperty()
  pickupLat!: string;

  @ApiProperty()
  pickupLng!: string;

  @ApiProperty()
  dropoffAddress!: string;

  @ApiProperty()
  dropoffLat!: string;

  @ApiProperty()
  dropoffLng!: string;

  @ApiProperty()
  distanceKm!: string;

  @ApiProperty()
  durationMin!: number;

  @ApiProperty()
  price!: string;

  @ApiProperty({ enum: RideStatus })
  status!: RideStatus;

  @ApiPropertyOptional()
  driverId?: string | null;

  @ApiPropertyOptional()
  driverName?: string | null;

  @ApiPropertyOptional()
  passengerId?: string | null;

  @ApiPropertyOptional()
  passengerName?: string | null;

  @ApiPropertyOptional()
  assignedAt?: Date | null;

  @ApiPropertyOptional()
  startedAt?: Date | null;

  @ApiPropertyOptional()
  completedAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;
}
