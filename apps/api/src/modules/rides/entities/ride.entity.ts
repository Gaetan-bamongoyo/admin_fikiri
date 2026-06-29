import { BeforeInsert, BeforeUpdate, Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { RideStatus } from '../enums/ride-status.enum';

/** Une course taxi : point de départ → destination, suivie en temps réel. */
@Entity('rides')
@Index(['status'])
@Index(['driverId'])
export class Ride extends BaseEntity {
  /* --------------------------- Départ --------------------------- */
  @Column({ name: 'pickup_address', type: 'varchar', length: 255 })
  pickupAddress!: string;

  @Column({ name: 'pickup_lat', type: 'decimal', precision: 10, scale: 7 })
  pickupLat!: string;

  @Column({ name: 'pickup_lng', type: 'decimal', precision: 10, scale: 7 })
  pickupLng!: string;

  @Column({
    name: 'pickup_location',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  @Index({ spatial: true })
  pickupLocation?: { type: 'Point'; coordinates: [number, number] } | null;

  /* ------------------------- Destination ------------------------ */
  @Column({ name: 'dropoff_address', type: 'varchar', length: 255 })
  dropoffAddress!: string;

  @Column({ name: 'dropoff_lat', type: 'decimal', precision: 10, scale: 7 })
  dropoffLat!: string;

  @Column({ name: 'dropoff_lng', type: 'decimal', precision: 10, scale: 7 })
  dropoffLng!: string;

  @Column({
    name: 'dropoff_location',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  @Index({ spatial: true })
  dropoffLocation?: { type: 'Point'; coordinates: [number, number] } | null;

  /* --------------------------- Trajet --------------------------- */
  /** Distance estimée, en km. */
  @Column({
    name: 'distance_km',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  distanceKm!: string;

  /** Durée estimée, en minutes. */
  @Column({ name: 'duration_min', type: 'int', default: 0 })
  durationMin!: number;

  /** Prix de la course. */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price!: string;

  @Column({ type: 'enum', enum: RideStatus, default: RideStatus.SEARCHING })
  status!: RideStatus;

  /* --------------------------- Acteurs -------------------------- */
  /** Chauffeur (= véhicule de la flotte) assigné. */
  @Column({ name: 'driver_id', type: 'uuid', nullable: true })
  driverId?: string | null;

  @Column({ name: 'driver_name', type: 'varchar', length: 150, nullable: true })
  driverName?: string | null;

  @Column({ name: 'passenger_id', type: 'uuid', nullable: true })
  passengerId?: string | null;

  @Column({
    name: 'passenger_name',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  passengerName?: string | null;

  /* ------------------------- Horodatages ------------------------ */
  @Column({ name: 'assigned_at', type: 'timestamptz', nullable: true })
  assignedAt?: Date | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @BeforeInsert()
  @BeforeUpdate()
  syncLocations() {
    if (this.pickupLat && this.pickupLng) {
      this.pickupLocation = {
        type: 'Point',
        coordinates: [parseFloat(this.pickupLng), parseFloat(this.pickupLat)],
      };
    }
    if (this.dropoffLat && this.dropoffLng) {
      this.dropoffLocation = {
        type: 'Point',
        coordinates: [parseFloat(this.dropoffLng), parseFloat(this.dropoffLat)],
      };
    }
  }
}
