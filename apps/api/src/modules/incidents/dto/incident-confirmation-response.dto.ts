import { ApiProperty } from '@nestjs/swagger';

export class IncidentConfirmationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ description: 'true = confirmé, false = contesté' })
  isConfirm!: boolean;

  @ApiProperty()
  createdAt!: Date;
}
