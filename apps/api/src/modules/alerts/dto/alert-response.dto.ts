import { ApiProperty } from '@nestjs/swagger';

export class AlertResponseDto {
  @ApiProperty({ example: 'c1a2b3' })
  id!: string;

  @ApiProperty({ example: 'user123' })
  userId!: string;

  @ApiProperty({ example: 'TRAFFIC_WARNING' })
  type!: string;

  @ApiProperty({ example: 'Trafic dense sur votre trajet habituel' })
  message!: string;

  @ApiProperty({ example: 'medium', enum: ['low', 'medium', 'high'] })
  severity!: 'low' | 'medium' | 'high';

  @ApiProperty({ example: false })
  isRead!: boolean;

  @ApiProperty({ example: '2026-06-05T13:00:00.000Z' })
  createdAt!: Date;
}
