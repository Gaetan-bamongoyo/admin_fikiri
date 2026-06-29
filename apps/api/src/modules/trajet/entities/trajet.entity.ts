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
import { TrajetCategory } from '../../../common/enums/trajet-category.enum';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('trajets')
@Index(['userId'])
export class Trajet extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity | null;

  @Column({ type: 'varchar', length: 100 })
  label!: string;

  @Column({
    type: 'enum',
    enum: TrajetCategory,
    nullable: true,
  })
  category?: TrajetCategory | null;

  @Column({ type: 'varchar', length: 255 })
  address!: string;

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

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

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
