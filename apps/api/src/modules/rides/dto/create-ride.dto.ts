import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRideDto {
  @ApiProperty({ example: 'Terminus Gombe, Bd du 30 Juin' })
  @IsString()
  @MaxLength(255)
  pickupAddress!: string;

  @ApiProperty({ example: -4.3217 })
  @Type(() => Number)
  @IsLatitude()
  pickupLat!: number;

  @ApiProperty({ example: 15.3125 })
  @Type(() => Number)
  @IsLongitude()
  pickupLng!: number;

  @ApiProperty({ example: 'Terminus Limete, 7e Rue' })
  @IsString()
  @MaxLength(255)
  dropoffAddress!: string;

  @ApiProperty({ example: -4.3489 })
  @Type(() => Number)
  @IsLatitude()
  dropoffLat!: number;

  @ApiProperty({ example: 15.3669 })
  @Type(() => Number)
  @IsLongitude()
  dropoffLng!: number;

  @ApiPropertyOptional({ description: 'Distance estimée (km)', example: 8.4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distanceKm?: number;

  @ApiPropertyOptional({ description: 'Durée estimée (min)', example: 22 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationMin?: number;

  @ApiPropertyOptional({ description: 'Prix estimé', example: 6500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'Marie Kalala' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  passengerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  passengerId?: string;
}
