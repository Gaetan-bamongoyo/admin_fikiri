import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { SearchMetro } from '../../../common/enums/search-metro.enum';

export class UpdateUserPreferencesDto {
  @ApiPropertyOptional({ example: -4.3217, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsLatitude()
  homeLatitude?: number | null;

  @ApiPropertyOptional({ example: 15.3125, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsLongitude()
  homeLongitude?: number | null;

  @ApiPropertyOptional({ example: -4.4419, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsLatitude()
  workLatitude?: number | null;

  @ApiPropertyOptional({ example: 15.2663, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsLongitude()
  workLongitude?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  anticipatoryAlertsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  anonymizePositionData?: boolean;

  @ApiPropertyOptional({ enum: SearchMetro })
  @IsOptional()
  @IsEnum(SearchMetro)
  searchMetro?: SearchMetro;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  trafficRegionAlertsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  routeIncidentAlertsEnabled?: boolean;

  @ApiPropertyOptional({ example: 0, description: '0 = aucun rappel' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  departureReminderMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  homeTrafficAlertsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  workTrafficAlertsEnabled?: boolean;
}
