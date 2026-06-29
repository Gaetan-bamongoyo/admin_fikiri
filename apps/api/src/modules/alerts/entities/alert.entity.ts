import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AlertSeverity } from '../../../common/enums/alert-severity.enum';

@Entity('alerts')
@Index(['userId', 'createdAt'])
@Index(['userId', 'isRead'])
export class AlertEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
  })
  severity!: AlertSeverity;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude?: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude?: number | null;
}
