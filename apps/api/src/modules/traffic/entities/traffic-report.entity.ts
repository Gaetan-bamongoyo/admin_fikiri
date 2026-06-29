import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { TrafficCondition } from '../../../common/enums/traffic-condition.enum';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('traffic_reports')
@Index(['latitude', 'longitude', 'createdAt'])
export class TrafficReport extends BaseEntity {
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

  @Column({ type: 'enum', enum: TrafficCondition })
  condition!: TrafficCondition;

  @BeforeInsert()
  @BeforeUpdate()
  updateLocation() {
    if (this.latitude && this.longitude) {
      this.location = {
        type: 'Point',
        coordinates: [Number(this.longitude), Number(this.latitude)],
      };
    }
  }
}
