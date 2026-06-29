import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { RideStatus } from '../enums/ride-status.enum';

export class UpdateRideStatusDto {
  @ApiProperty({ enum: RideStatus })
  @IsEnum(RideStatus)
  status!: RideStatus;

  @ApiPropertyOptional({
    description: 'Chauffeur assigné (lors de l’assignation)',
  })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional({ example: 'Jean Mukendi' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  driverName?: string;
}
