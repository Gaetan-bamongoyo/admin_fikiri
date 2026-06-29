import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export interface FrequentZone {
  latitude: number;
  longitude: number;
  weight: number;
}

export interface FrequentHours {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
}

@Entity('user_habit_profiles')
@Index(['userId'])
export class UserHabitProfileEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'frequent_zones', type: 'jsonb', nullable: true })
  frequentZones!: FrequentZone[] | null;

  @Column({ name: 'frequent_hours', type: 'jsonb', nullable: true })
  frequentHours!: FrequentHours | null;
}
