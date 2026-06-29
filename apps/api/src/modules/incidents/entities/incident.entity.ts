import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { IncidentStatus } from '../../../common/enums/incident-status.enum';
import { IncidentType } from '../../../common/enums/incident-type.enum';
import { UserEntity } from '../../users/entities/user.entity';
import { IncidentConfirmation } from './incident-confirmation.entity';

@Entity('incidents')
@Index(['latitude', 'longitude'])
@Index(['status', 'expiresAt'])
export class Incident extends BaseEntity {
  @Column({ type: 'enum', enum: IncidentType })
  type!: IncidentType;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.ACTIVE,
  })
  status!: IncidentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude!: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
  location!: { type: 'Point'; coordinates: [number, number] };

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address?: string | null;

  @Column({ name: 'reporter_id', type: 'uuid' })
  reporterId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter?: UserEntity | null;

  @Column({ name: 'confirmation_count', type: 'int', default: 1 })
  confirmationCount!: number;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date | null;

  @OneToMany(
    () => IncidentConfirmation,
    (confirmation) => confirmation.incident,
  )
  confirmations!: IncidentConfirmation[];

  @BeforeInsert()
  @BeforeUpdate()
  updateLocation() {
    if (this.latitude && this.longitude) {
      this.location = {
        type: 'Point',
        coordinates: [parseFloat(this.longitude), parseFloat(this.latitude)],
      };
    }
  }
}
