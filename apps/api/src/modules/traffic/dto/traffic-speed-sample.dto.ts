import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsISO8601,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryTrafficSpeedSamplesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: -4.3217 })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: 15.3125 })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({
    default: 3,
    description: 'Rayon de recherche en kilomètres',
  })
  @IsOptional()
  @Type(() => Number)
  radiusKm?: number = 3;

  @ApiPropertyOptional({
    description: 'Date min (ISO 8601). Défaut : dernières 24 h.',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Date max (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ description: 'Filtrer par utilisateur (UUID)' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class QueryLatestUserPositionsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    default: 30,
    minimum: 1,
    maximum: 1440,
    description:
      'Ne retourner que les utilisateurs avec une position dans les X dernières minutes',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  withinMinutes?: number = 30;

  @ApiPropertyOptional({ example: -4.3217 })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: 15.3125 })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({
    default: 10,
    description: 'Rayon de recherche en kilomètres (sur la dernière position)',
  })
  @IsOptional()
  @Type(() => Number)
  radiusKm?: number = 10;

  @ApiPropertyOptional({ description: 'Filtrer un utilisateur (UUID)' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class TrafficSpeedSampleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  userId?: string | null;

  @ApiProperty({ example: -4.3217 })
  latitude!: number;

  @ApiProperty({ example: 15.3125 })
  longitude!: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Vitesse instantanée en m/s',
  })
  speedMps?: number | null;

  @ApiProperty({ description: 'Horodatage GPS du point' })
  recordedAt!: Date;

  @ApiProperty({ example: 'navigation' })
  source!: string;

  @ApiProperty()
  createdAt!: Date;
}
