import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { TrafficCondition } from '../../../common/enums/traffic-condition.enum';

export class UpdateVehiclePositionDto {
  @ApiProperty({ example: -4.3217 })
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 15.3125 })
  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({ example: 48 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  passengers?: number;

  @ApiPropertyOptional({ enum: TrafficCondition })
  @IsOptional()
  @IsEnum(TrafficCondition)
  trafficCondition?: TrafficCondition;

  @ApiPropertyOptional({ description: 'Distance totale parcourue (km)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distanceKm?: number;
}
