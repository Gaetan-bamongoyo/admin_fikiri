import { Ride } from '../../modules/rides/entities/ride.entity';
import { RideStatus } from '../../modules/rides/enums/ride-status.enum';
import dataSource from '../data-source';

interface SeedRide {
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  distanceKm: number;
  durationMin: number;
  price: number;
  status: RideStatus;
  passengerName: string;
  driverName?: string;
}

/**
 * Courses par défaut autour de Kinshasa, couvrant les différents statuts
 * (recherche, assignée, en route, en cours, terminée, annulée) pour alimenter
 * le tableau de bord admin et le suivi temps réel.
 */
const DEFAULT_RIDES: SeedRide[] = [
  {
    pickupAddress: 'Gombe, Boulevard du 30 Juin',
    pickupLat: -4.3046,
    pickupLng: 15.3136,
    dropoffAddress: 'Aéroport de Ndjili',
    dropoffLat: -4.3858,
    dropoffLng: 15.4446,
    distanceKm: 18.5,
    durationMin: 45,
    price: 25000,
    status: RideStatus.SEARCHING,
    passengerName: 'Patrick Mbala',
  },
  {
    pickupAddress: 'Limete, 7ème Rue',
    pickupLat: -4.3667,
    pickupLng: 15.35,
    dropoffAddress: 'Kintambo Magasin',
    dropoffLat: -4.33,
    dropoffLng: 15.27,
    distanceKm: 9.2,
    durationMin: 28,
    price: 12000,
    status: RideStatus.ASSIGNED,
    passengerName: 'Grace Lukusa',
    driverName: 'Jean Kabasele',
  },
  {
    pickupAddress: 'Bandalungwa, Place Commerciale',
    pickupLat: -4.35,
    pickupLng: 15.2833,
    dropoffAddress: 'UPN, Avenue de la Libération',
    dropoffLat: -4.37,
    dropoffLng: 15.25,
    distanceKm: 5.6,
    durationMin: 20,
    price: 8000,
    status: RideStatus.EN_ROUTE,
    passengerName: 'Daniel Tshibanda',
    driverName: 'Alain Mukendi',
  },
  {
    pickupAddress: 'Matonge, Avenue Kasa-Vubu',
    pickupLat: -4.34,
    pickupLng: 15.31,
    dropoffAddress: 'Masina, Pétro-Congo',
    dropoffLat: -4.39,
    dropoffLng: 15.41,
    distanceKm: 13.8,
    durationMin: 40,
    price: 18000,
    status: RideStatus.IN_PROGRESS,
    passengerName: 'Sarah Nkosi',
    driverName: 'Joseph Ilunga',
  },
  {
    pickupAddress: 'Gombe, Marché Central',
    pickupLat: -4.3225,
    pickupLng: 15.3119,
    dropoffAddress: 'Lemba, Université de Kinshasa',
    dropoffLat: -4.4194,
    dropoffLng: 15.3081,
    distanceKm: 11.4,
    durationMin: 35,
    price: 15000,
    status: RideStatus.COMPLETED,
    passengerName: 'Emmanuel Kalala',
    driverName: 'Pierre Mwamba',
  },
  {
    pickupAddress: 'Ngaliema, Avenue des Cliniques',
    pickupLat: -4.31,
    pickupLng: 15.27,
    dropoffAddress: 'Kalamu, Avenue Victoire',
    dropoffLat: -4.345,
    dropoffLng: 15.305,
    distanceKm: 7.1,
    durationMin: 24,
    price: 10000,
    status: RideStatus.CANCELLED,
    passengerName: 'Christelle Mpoyi',
  },
];

async function seedRides(): Promise<void> {
  await dataSource.initialize();
  console.log('🔌 Connecté à la base de données');

  const ridesRepository = dataSource.getRepository(Ride);

  const existing = await ridesRepository.count();
  if (existing > 0) {
    console.log(
      `⏭️  ${existing} course(s) déjà en base — seed ignoré (table non vide)`,
    );
    await dataSource.destroy();
    return;
  }

  const now = new Date();

  for (const seed of DEFAULT_RIDES) {
    const ride = ridesRepository.create({
      pickupAddress: seed.pickupAddress,
      pickupLat: seed.pickupLat.toString(),
      pickupLng: seed.pickupLng.toString(),
      dropoffAddress: seed.dropoffAddress,
      dropoffLat: seed.dropoffLat.toString(),
      dropoffLng: seed.dropoffLng.toString(),
      distanceKm: seed.distanceKm.toString(),
      durationMin: seed.durationMin,
      price: seed.price.toString(),
      status: seed.status,
      passengerName: seed.passengerName,
      driverName: seed.driverName,
      assignedAt: seed.driverName ? now : null,
      startedAt:
        seed.status === RideStatus.IN_PROGRESS ||
        seed.status === RideStatus.COMPLETED
          ? now
          : null,
      completedAt: seed.status === RideStatus.COMPLETED ? now : null,
    });

    await ridesRepository.save(ride);
    console.log(`✅ Course créée : ${seed.pickupAddress} → ${seed.dropoffAddress} (${seed.status})`);
  }

  console.log(`\n🌱 Seed terminé : ${DEFAULT_RIDES.length} course(s) créée(s)`);
  await dataSource.destroy();
}

seedRides().catch((error) => {
  console.error('❌ Échec du seed :', error);
  process.exitCode = 1;
});
