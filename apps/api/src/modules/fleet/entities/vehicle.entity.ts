import { BeforeInsert, BeforeUpdate, Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { TrafficCondition } from '../../../common/enums/traffic-condition.enum';
import { VehicleKind } from '../enums/vehicle-kind.enum';
import { VehicleStatus } from '../enums/vehicle-status.enum';

/** Véhicule de transport de passagers suivi par la flotte. */
@Entity('vehicles')
@Index(['status'])
export class Vehicle extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'enum', enum: VehicleKind })
  kind!: VehicleKind;

  /** Ligne / itinéraire desservi. */
  @Column({ type: 'varchar', length: 150, nullable: true })
  line?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  plate?: string | null;

  @Column({ name: 'driver_name', type: 'varchar', length: 150, nullable: true })
  driverName?: string | null;

  /** Capacité totale en places. */
  @Column({ type: 'int', default: 0 })
  capacity!: number;

  /** Passagers à bord. */
  @Column({ type: 'int', default: 0 })
  passengers!: number;

  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.OFFLINE })
  status!: VehicleStatus;

  @Column({
    name: 'traffic_condition',
    type: 'enum',
    enum: TrafficCondition,
    default: TrafficCondition.FLUID,
  })
  trafficCondition!: TrafficCondition;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: string | null;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  @Index({ spatial: true })
  location?: { type: 'Point'; coordinates: [number, number] } | null;

  /** Distance parcourue, en km. */
  @Column({
    name: 'distance_km',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  distanceKm!: string;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt?: Date | null;

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
