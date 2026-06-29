import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SearchMetro } from '../../../common/enums/search-metro.enum';
import type { UserEntity } from './user.entity';

@Entity('user_preferences')
export class UserPreferences extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @OneToOne('UserEntity', 'preferences', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({
    name: 'home_latitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  homeLatitude?: string | null;

  @Column({
    name: 'home_longitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  homeLongitude?: string | null;

  @Column({
    name: 'work_latitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  workLatitude?: string | null;

  @Column({
    name: 'work_longitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  workLongitude?: string | null;

  @Column({ name: 'notifications_enabled', type: 'boolean', default: true })
  notificationsEnabled!: boolean;

  @Column({
    name: 'anticipatory_alerts_enabled',
    type: 'boolean',
    default: true,
  })
  anticipatoryAlertsEnabled!: boolean;

  @Column({
    name: 'anonymize_position_data',
    type: 'boolean',
    default: false,
  })
  anonymizePositionData!: boolean;

  @Column({
    name: 'search_metro',
    type: 'enum',
    enum: SearchMetro,
    default: SearchMetro.AUTO,
  })
  searchMetro!: SearchMetro;

  @Column({
    name: 'traffic_region_alerts_enabled',
    type: 'boolean',
    default: true,
  })
  trafficRegionAlertsEnabled!: boolean;

  @Column({
    name: 'route_incident_alerts_enabled',
    type: 'boolean',
    default: true,
  })
  routeIncidentAlertsEnabled!: boolean;

  @Column({ name: 'departure_reminder_minutes', type: 'int', default: 0 })
  departureReminderMinutes!: number;

  @Column({
    name: 'home_traffic_alerts_enabled',
    type: 'boolean',
    default: false,
  })
  homeTrafficAlertsEnabled!: boolean;

  @Column({
    name: 'work_traffic_alerts_enabled',
    type: 'boolean',
    default: false,
  })
  workTrafficAlertsEnabled!: boolean;
}
