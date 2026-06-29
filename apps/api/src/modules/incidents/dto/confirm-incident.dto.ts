import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ConfirmIncidentDto {
  @ApiProperty({
    description: 'true = confirmer l’incident, false = le contester',
    example: true,
  })
  @IsBoolean()
  isConfirm!: boolean;
}
