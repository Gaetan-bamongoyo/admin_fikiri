import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ description: 'true = compte actif, false = suspendu' })
  @IsBoolean()
  isActive!: boolean;
}
