import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IncidentType } from '../../../common/enums/incident-type.enum';

export class CreateIncidentDto {
  @ApiProperty({ enum: IncidentType, example: IncidentType.CONGESTION })
  @IsEnum(IncidentType)
  type!: IncidentType;

  @ApiProperty({ example: -4.3217, description: 'Latitude (Kinshasa)' })
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 15.3125, description: 'Longitude (Kinshasa)' })
  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({
    example: 'Embouteillage important avenue du Commerce',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'Gombe, Kinshasa' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
