import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('traffic_tracks')
export class TrafficTrack extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity | null;

  @Column({
    type: 'geography',
    spatialFeatureType: 'LineString',
    srid: 4326,
  })
  @Index({ spatial: true })
  path!: { type: 'LineString'; coordinates: [number, number][] };
}
