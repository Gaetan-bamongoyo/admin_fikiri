import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class TrafficTrackPointDto {
  @ApiProperty({ example: -4.3217 })
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 15.3125 })
  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({
    example: 6.5,
    description: 'Vitesse instantanée en m/s (GPS)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  speedMs?: number;

  @ApiProperty({
    example: '2026-06-17T10:15:30.000Z',
    description: 'Horodatage du point GPS',
  })
  @IsDateString()
  recordedAt!: string;
}

export class CreateTrafficTrackDto {
  @ApiProperty({ type: [TrafficTrackPointDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => TrafficTrackPointDto)
  points!: TrafficTrackPointDto[];

  @ApiPropertyOptional({ example: '2026-06-17T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional({ example: '2026-06-17T10:20:00.000Z' })
  @IsOptional()
  @IsDateString()
  endedAt?: string;
}

export class TrafficTrackUploadResponseDto {
  @ApiProperty()
  sampleCount!: number;

  @ApiProperty()
  trackSaved!: boolean;
}
