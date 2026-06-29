import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrajetCategory } from '../../../common/enums/trajet-category.enum';

export class TrajetResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'Maison' })
  label!: string;

  @ApiPropertyOptional({ enum: TrajetCategory })
  category?: TrajetCategory | null;

  @ApiProperty({ example: 'Avenue du Commerce, Gombe' })
  address!: string;

  @ApiProperty()
  latitude!: string;

  @ApiProperty()
  longitude!: string;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
