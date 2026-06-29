import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoyaltyReason } from '../entities/loyalty-transaction.entity';

export class LoyaltyTransactionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  points!: number;

  @ApiProperty({ enum: LoyaltyReason })
  reason!: LoyaltyReason;

  @ApiPropertyOptional()
  referenceId?: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class LoyaltyBalanceDto {
  @ApiProperty()
  loyaltyPoints!: number;

  @ApiProperty({ type: [LoyaltyTransactionResponseDto] })
  recentTransactions!: LoyaltyTransactionResponseDto[];
}
