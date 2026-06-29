import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AdminService } from './admin.service';
import { AnalyticsResponseDto } from './dto/analytics.dto';
import { DashboardResponseDto } from './dto/dashboard.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Indicateurs et graphiques du tableau de bord' })
  @ApiResponse({ status: 200, type: DashboardResponseDto })
  getDashboard(): Promise<DashboardResponseDto> {
    return this.adminService.getDashboard();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Analytiques agrégées (tendances, densité, zones)' })
  @ApiResponse({ status: 200, type: AnalyticsResponseDto })
  getAnalytics(): Promise<AnalyticsResponseDto> {
    return this.adminService.getAnalytics();
  }
}
