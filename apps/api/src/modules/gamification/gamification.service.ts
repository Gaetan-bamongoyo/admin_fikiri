import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import {
  INCIDENT_CONFIRMED_EVENT,
  INCIDENT_CREATED_EVENT,
  IncidentCreatedEvent,
} from '../incidents/events/incident.events';
import {
  LoyaltyBalanceDto,
  LoyaltyTransactionResponseDto,
} from './dto/loyalty.dto';
import {
  LoyaltyReason,
  LoyaltyTransaction,
} from './entities/loyalty-transaction.entity';

const POINTS_INCIDENT_REPORT = 15;
const POINTS_INCIDENT_CONFIRM = 5;

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(LoyaltyTransaction)
    private readonly transactionsRepository: Repository<LoyaltyTransaction>,
    private readonly usersService: UsersService,
  ) {}

  @OnEvent(INCIDENT_CREATED_EVENT)
  async onIncidentCreated(event: IncidentCreatedEvent): Promise<void> {
    await this.awardPoints(
      event.reporterId,
      POINTS_INCIDENT_REPORT,
      LoyaltyReason.INCIDENT_REPORT,
      event.incident.id,
    );
  }

  @OnEvent(INCIDENT_CONFIRMED_EVENT)
  async onIncidentConfirmed(payload: {
    userId: string;
    incidentId: string;
    isConfirm: boolean;
  }): Promise<void> {
    if (!payload.isConfirm) {
      return;
    }

    await this.awardPoints(
      payload.userId,
      POINTS_INCIDENT_CONFIRM,
      LoyaltyReason.INCIDENT_CONFIRM,
      payload.incidentId,
    );
  }

  async getBalance(userId: string): Promise<LoyaltyBalanceDto> {
    const user = await this.usersService.findByIdOrFail(userId);

    const transactions = await this.transactionsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return {
      loyaltyPoints: user.loyaltyPoints,
      recentTransactions: transactions.map((tx) => this.toResponse(tx)),
    };
  }

  private async awardPoints(
    userId: string,
    points: number,
    reason: LoyaltyReason,
    referenceId?: string,
  ): Promise<void> {
    await this.transactionsRepository.save(
      this.transactionsRepository.create({
        userId,
        points,
        reason,
        referenceId,
      }),
    );

    await this.usersService.addLoyaltyPoints(userId, points);
  }

  private toResponse(
    transaction: LoyaltyTransaction,
  ): LoyaltyTransactionResponseDto {
    return {
      id: transaction.id,
      points: transaction.points,
      reason: transaction.reason,
      referenceId: transaction.referenceId,
      createdAt: transaction.createdAt,
    };
  }
}
