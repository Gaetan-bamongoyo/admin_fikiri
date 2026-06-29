import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { LoyaltyBalanceDto } from './dto/loyalty.dto';
import { GamificationService } from './gamification.service';

@ApiTags('gamification')
@ApiBearerAuth()
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('loyalty')
  @ApiOperation({ summary: 'Solde FIKIRI Loyalty et historique des points' })
  @ApiResponse({ status: 200, type: LoyaltyBalanceDto })
  getLoyalty(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LoyaltyBalanceDto> {
    return this.gamificationService.getBalance(user.id);
  }
}
