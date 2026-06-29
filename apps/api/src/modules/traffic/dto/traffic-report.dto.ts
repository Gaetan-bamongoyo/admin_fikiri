import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsOptional,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { TrafficCondition } from '../../../common/enums/traffic-condition.enum';

export class QueryTrafficReportsDto extends PaginationQueryDto {
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
}

/** Filtres de la vue admin des signalements (sans fenêtre temporelle imposée). */
export class QueryAdminTrafficReportsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TrafficCondition })
  @IsOptional()
  @IsEnum(TrafficCondition)
  condition?: TrafficCondition;

  @ApiPropertyOptional({ description: 'Date min (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Date max (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

export class TrafficReportResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    example: -4.3217,
    description: 'Latitude du signalement',
  })
  latitude!: number;

  @ApiProperty({
    example: 15.3125,
    description: 'Longitude du signalement',
  })
  longitude!: number;

  @ApiProperty({ enum: TrafficCondition })
  condition!: TrafficCondition;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Auteur du signalement (null si anonymisé)',
  })
  userId?: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class TrafficSummaryDto {
  @ApiProperty({ enum: TrafficCondition })
  dominantCondition!: TrafficCondition;

  @ApiProperty()
  reportCount!: number;

  @ApiProperty()
  latitude!: number;

  @ApiProperty()
  longitude!: number;
}
