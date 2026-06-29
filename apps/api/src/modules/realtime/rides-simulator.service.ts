import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Interval } from '@nestjs/schedule';
import { DRIVER_EVENTS } from '../../common/events/driver.events';
import { RideStatus } from '../rides/enums/ride-status.enum';
import { RidesService } from '../rides/rides.service';

interface SimDriver {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface SimRide {
  id: string;
  driver: SimDriver;
  step: number;
}

/** Centre de Kinshasa (Gombe). */
const CENTER = { lat: -4.3217, lng: 15.3125 };
const DRIVER_NAMES = [
  'Jean Mukendi',
  'Marie Kalala',
  'Pierre Kabamba',
  'Sophie Mbuyi',
  'André Tshimanga',
  'Esther Nsimba',
];
const PLACES = [
  'Boulevard du 30 Juin, Gombe',
  'Avenue Kasa-Vubu, Kalamu',
  'Boulevard Lumumba, Limete',
  'Avenue de la Libération',
  'Rond-point Ngaba',
  'UPN, Av. de la Science',
  'Terminus Matete',
  'Marché Central',
];

/** Enchaînement des statuts d'une course simulée. */
const RIDE_FLOW: RideStatus[] = [
  RideStatus.ASSIGNED,
  RideStatus.EN_ROUTE,
  RideStatus.IN_PROGRESS,
  RideStatus.COMPLETED,
];

function jitter(value: number, amount: number): number {
  return value + (Math.random() - 0.5) * amount;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Simulateur de démonstration : génère des positions de chauffeurs et un flux
 * de courses (création → assignation → trajet → fin) pour alimenter le suivi
 * temps réel de l'admin. Activé via `RIDES_SIMULATOR=true`.
 */
@Injectable()
export class RidesSimulatorService implements OnModuleInit {
  private readonly logger = new Logger(RidesSimulatorService.name);
  private enabled = false;
  private drivers: SimDriver[] = [];
  private activeRides: SimRide[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly ridesService: RidesService,
  ) {}

  onModuleInit() {
    this.enabled =
      this.configService.get<boolean>('realtime.simulator') ?? false;
    if (!this.enabled) return;

    this.drivers = DRIVER_NAMES.map((name) => ({
      id: randomUUID(),
      name,
      lat: jitter(CENTER.lat, 0.08),
      lng: jitter(CENTER.lng, 0.08),
    }));
    this.logger.log(
      `Simulateur de courses actif (${this.drivers.length} chauffeurs).`,
    );
  }

  /** Déplace les chauffeurs et diffuse leur position. */
  @Interval(3000)
  moveDrivers() {
    if (!this.enabled) return;

    for (const driver of this.drivers) {
      driver.lat = jitter(driver.lat, 0.004);
      driver.lng = jitter(driver.lng, 0.004);
      this.eventEmitter.emit(DRIVER_EVENTS.POSITION, {
        driverId: driver.id,
        name: driver.name,
        latitude: driver.lat,
        longitude: driver.lng,
        status: 'active',
        at: new Date().toISOString(),
      });
    }
  }

  /** Crée puis fait progresser les courses. */
  @Interval(5000)
  async tickRides() {
    if (!this.enabled) return;

    // Démarre une nouvelle course si la flotte n'est pas saturée.
    const busyDriverIds = new Set(this.activeRides.map((r) => r.driver.id));
    const freeDrivers = this.drivers.filter((d) => !busyDriverIds.has(d.id));
    if (freeDrivers.length > 0 && this.activeRides.length < 4) {
      await this.startRide(pick(freeDrivers));
    }

    // Fait avancer chaque course active d'un cran.
    for (const ride of [...this.activeRides]) {
      const next = RIDE_FLOW[ride.step];
      try {
        await this.ridesService.updateStatus(ride.id, {
          status: next,
          driverId: ride.driver.id,
          driverName: ride.driver.name,
        });
      } catch (error) {
        this.logger.warn(`Course ${ride.id} introuvable: ${String(error)}`);
        this.activeRides = this.activeRides.filter((r) => r.id !== ride.id);
        continue;
      }
      ride.step += 1;
      if (ride.step >= RIDE_FLOW.length) {
        this.activeRides = this.activeRides.filter((r) => r.id !== ride.id);
      }
    }
  }

  private async startRide(driver: SimDriver) {
    const distanceKm = Math.round((3 + Math.random() * 12) * 10) / 10;
    const durationMin = Math.round(distanceKm * 2.5 + 5);
    const price = Math.round((1500 + distanceKm * 700) / 100) * 100;

    const ride = await this.ridesService.create({
      pickupAddress: pick(PLACES),
      pickupLat: jitter(CENTER.lat, 0.05),
      pickupLng: jitter(CENTER.lng, 0.05),
      dropoffAddress: pick(PLACES),
      dropoffLat: jitter(CENTER.lat, 0.05),
      dropoffLng: jitter(CENTER.lng, 0.05),
      distanceKm,
      durationMin,
      price,
      passengerName: pick(DRIVER_NAMES),
    });

    this.activeRides.push({ id: ride.id, driver, step: 0 });
  }
}
