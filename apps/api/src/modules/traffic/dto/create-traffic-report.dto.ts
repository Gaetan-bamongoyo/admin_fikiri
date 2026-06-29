import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsLatitude, IsLongitude } from 'class-validator';
import { TrafficCondition } from '../../../common/enums/traffic-condition.enum';

export class CreateTrafficReportDto {
  @ApiProperty({ example: -4.3217 })
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 15.3125 })
  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @ApiProperty({
    enum: TrafficCondition,
    example: TrafficCondition.HEAVY,
    description: 'État du trafic signalé par l’utilisateur',
  })
  @IsEnum(TrafficCondition)
  condition!: TrafficCondition;
}
