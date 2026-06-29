import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TrajetCategory } from '../../../common/enums/trajet-category.enum';

export class CreateTrajetDto {
  @ApiProperty({ example: 'Maison', description: 'Nom affiché du lieu' })
  @IsString()
  @MaxLength(100)
  label!: string;

  @ApiPropertyOptional({
    enum: TrajetCategory,
    example: TrajetCategory.HOME,
    description: 'Catégorie pour l’icône (optionnel)',
  })
  @IsOptional()
  @IsEnum(TrajetCategory)
  category?: TrajetCategory;

  @ApiProperty({ example: 'Avenue du Commerce, Gombe, Kinshasa' })
  @IsString()
  @MaxLength(255)
  address!: string;

  @ApiProperty({ example: -4.3217, description: 'Latitude' })
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 15.3125, description: 'Longitude' })
  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Ordre d’affichage (plus petit = en premier)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  sortOrder?: number;
}
