import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('traffic_speed_samples')
@Index(['recordedAt'])
export class TrafficSpeedSample extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity | null;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude!: number;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
  location!: { type: 'Point'; coordinates: [number, number] };

  @Column({ name: 'speed_mps', type: 'double precision', nullable: true })
  speedMps?: number | null;

  @Column({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt!: Date;

  @Column({ type: 'varchar', length: 32, default: 'navigation' })
  source!: string;

  @BeforeInsert()
  @BeforeUpdate()
  updateLocation() {
    if (this.latitude != null && this.longitude != null) {
      this.location = {
        type: 'Point',
        coordinates: [Number(this.longitude), Number(this.latitude)],
      };
    }
  }
}
