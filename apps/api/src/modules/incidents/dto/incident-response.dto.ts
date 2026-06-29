import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentStatus } from '../../../common/enums/incident-status.enum';
import { IncidentType } from '../../../common/enums/incident-type.enum';

export class IncidentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: IncidentType })
  type!: IncidentType;

  @ApiProperty({ enum: IncidentStatus })
  status!: IncidentStatus;

  @ApiProperty()
  latitude!: string;

  @ApiProperty()
  longitude!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  address?: string | null;

  @ApiProperty()
  reporterId!: string;

  @ApiProperty()
  confirmationCount!: number;

  @ApiProperty()
  expiresAt!: Date;

  @ApiPropertyOptional()
  resolvedAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;
}
