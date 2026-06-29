import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AppSettings } from './entities/app-settings.entity';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Paramètres globaux de la plateforme' })
  get(): Promise<AppSettings> {
    return this.settingsService.get();
  }

  @Patch()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour les paramètres (admin)' })
  update(@Body() dto: UpdateSettingsDto): Promise<AppSettings> {
    return this.settingsService.update(dto);
  }
}
