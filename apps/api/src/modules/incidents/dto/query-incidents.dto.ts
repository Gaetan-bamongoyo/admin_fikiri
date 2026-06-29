import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsLatitude, IsLongitude, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { IncidentStatus } from '../../../common/enums/incident-status.enum';
import { IncidentType } from '../../../common/enums/incident-type.enum';

export class QueryIncidentsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: IncidentType })
  @IsOptional()
  @IsEnum(IncidentType)
  type?: IncidentType;

  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional({
    example: -4.3217,
    description: 'Centre de la zone de recherche',
  })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({
    example: 15.3125,
    description: 'Centre de la zone de recherche',
  })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({
    default: 5,
    description: 'Rayon de recherche en kilomètres',
  })
  @IsOptional()
  @Type(() => Number)
  radiusKm?: number = 5;
}
