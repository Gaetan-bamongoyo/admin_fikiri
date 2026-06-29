import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TrafficCondition } from '../../../common/enums/traffic-condition.enum';
import { VehicleKind } from '../enums/vehicle-kind.enum';
import { VehicleStatus } from '../enums/vehicle-status.enum';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Bus Ligne 12' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: VehicleKind, example: VehicleKind.BUS })
  @IsEnum(VehicleKind)
  kind!: VehicleKind;

  @ApiPropertyOptional({ example: 'Gombe ↔ Limete' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  line?: string;

  @ApiPropertyOptional({ example: 'KN 4218 AB' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  plate?: string;

  @ApiPropertyOptional({ example: 'Jean Mukendi' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  driverName?: string;

  @ApiPropertyOptional({ default: 0, example: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  capacity?: number;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({ enum: TrafficCondition })
  @IsOptional()
  @IsEnum(TrafficCondition)
  trafficCondition?: TrafficCondition;
}
