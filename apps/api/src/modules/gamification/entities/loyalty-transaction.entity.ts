import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

export enum LoyaltyReason {
  INCIDENT_REPORT = 'incident_report',
  INCIDENT_CONFIRM = 'incident_confirm',
  TRAFFIC_REPORT = 'traffic_report',
  DAILY_LOGIN = 'daily_login',
}

@Entity('loyalty_transactions')
@Index(['userId', 'createdAt'])
export class LoyaltyTransaction extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'int' })
  points!: number;

  @Column({ type: 'enum', enum: LoyaltyReason })
  reason!: LoyaltyReason;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId?: string | null;
}
