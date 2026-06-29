import { Controller, Get, Patch, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiOperation } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AlertsService } from './alerts.service';
import { AlertResponseDto } from './dto/alert-response.dto';

@ApiTags('alerts')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * Récupère les alertes de l'utilisateur connecté
   */
  @ApiOperation({ summary: "Récupérer les alertes de l'utilisateur connecté" })
  @ApiOkResponse({ type: AlertResponseDto, isArray: true })
  @Get('me')
  async getMyAlerts(@CurrentUser() user: any): Promise<AlertResponseDto[]> {
    if (!user?.id) {
      return [];
    }

    return this.alertsService.getUserAlerts(user.id);
  }

  /**
   * Marque une alerte comme lue
   */
  @ApiOperation({ summary: 'Marquer une alerte comme lue' })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
      },
    },
  })
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.alertsService.markAsRead(id);
    return { success: true };
  }
}
