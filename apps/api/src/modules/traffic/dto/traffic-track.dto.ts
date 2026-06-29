import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryTrafficTracksDto extends PaginationQueryDto {
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

  @ApiPropertyOptional({
    default: false,
    description: 'Inclure la polyligne complète dans la liste (plus lourd)',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includePath?: boolean = false;
}

export class TrafficTrackPointDto {
  @ApiProperty({ example: 15.3125 })
  longitude!: number;

  @ApiProperty({ example: -4.3217 })
  latitude!: number;
}

export class TrafficTrackResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  userId?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ description: 'Nombre de points GPS du tracé' })
  pointCount!: number;

  @ApiProperty({ type: TrafficTrackPointDto })
  startPoint!: TrafficTrackPointDto;

  @ApiProperty({ type: TrafficTrackPointDto })
  endPoint!: TrafficTrackPointDto;

  @ApiPropertyOptional({
    type: [TrafficTrackPointDto],
    description: 'Polyligne ordonnée (évolution du véhicule)',
  })
  path?: TrafficTrackPointDto[];
}
