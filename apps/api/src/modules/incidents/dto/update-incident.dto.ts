import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { IncidentType } from '../../../common/enums/incident-type.enum';

export class UpdateIncidentDto {
  @ApiPropertyOptional({ enum: IncidentType, example: IncidentType.ACCIDENT })
  @IsOptional()
  @IsEnum(IncidentType)
  type?: IncidentType;

  @ApiPropertyOptional({
    example: 'Mise à jour : accident avec blessés',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'Boulevard du 30 juin, Gombe' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
