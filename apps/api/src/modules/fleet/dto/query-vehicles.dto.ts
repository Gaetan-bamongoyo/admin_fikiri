import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { VehicleKind } from '../enums/vehicle-kind.enum';
import { VehicleStatus } from '../enums/vehicle-status.enum';

export class QueryVehiclesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: VehicleKind })
  @IsOptional()
  @IsEnum(VehicleKind)
  kind?: VehicleKind;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}
