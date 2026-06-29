import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SearchMetro } from '../../../common/enums/search-metro.enum';
import { UserRole } from '../../../common/enums/user-role.enum';

export class UserPreferencesResponseDto {
  @ApiPropertyOptional()
  homeLatitude?: string | null;

  @ApiPropertyOptional()
  homeLongitude?: string | null;

  @ApiPropertyOptional()
  workLatitude?: string | null;

  @ApiPropertyOptional()
  workLongitude?: string | null;

  @ApiProperty()
  notificationsEnabled!: boolean;

  @ApiProperty()
  anticipatoryAlertsEnabled!: boolean;

  @ApiProperty()
  anonymizePositionData!: boolean;

  @ApiProperty({ enum: SearchMetro })
  searchMetro!: SearchMetro;

  @ApiProperty()
  trafficRegionAlertsEnabled!: boolean;

  @ApiProperty()
  routeIncidentAlertsEnabled!: boolean;

  @ApiProperty()
  departureReminderMinutes!: number;

  @ApiProperty()
  homeTrafficAlertsEnabled!: boolean;

  @ApiProperty()
  workTrafficAlertsEnabled!: boolean;
}

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional()
  firstName?: string | null;

  @ApiPropertyOptional()
  lastName?: string | null;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty()
  loyaltyPoints!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional({ type: UserPreferencesResponseDto })
  preferences?: UserPreferencesResponseDto;
}
