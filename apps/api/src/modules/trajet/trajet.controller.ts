import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreateTrajetDto } from './dto/create-trajet.dto';
import { TrajetResponseDto } from './dto/trajet-response.dto';
import { UpdateTrajetDto } from './dto/update-trajet.dto';
import { TrajetService } from './trajet.service';

@ApiTags('trajets')
@Controller('trajets')
export class TrajetController {
  constructor(private readonly trajetService: TrajetService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enregistrer une destination favorite (Maison, Bureau, Marché…)',
  })
  @ApiResponse({ status: 201, type: TrajetResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTrajetDto,
  ): Promise<TrajetResponseDto> {
    return this.trajetService.create(user.id, dto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister mes destinations enregistrées' })
  @ApiResponse({ status: 200, type: [TrajetResponseDto] })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TrajetResponseDto[]> {
    return this.trajetService.findAllForUser(user.id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Détail d’une destination enregistrée' })
  @ApiResponse({ status: 200, type: TrajetResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TrajetResponseDto> {
    return this.trajetService.findByIdForUser(id, user.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier une destination enregistrée' })
  @ApiResponse({ status: 200, type: TrajetResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTrajetDto,
  ): Promise<TrajetResponseDto> {
    return this.trajetService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une destination enregistrée' })
  @ApiResponse({ status: 204, description: 'Destination supprimée' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.trajetService.remove(id, user.id);
  }
}
