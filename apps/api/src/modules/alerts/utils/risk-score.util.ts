import {
  FrequentHours,
  FrequentZone,
} from '../../analytics/entities/user-habit-profile.entity';

export function computeRiskScore(params: {
  currentHour: number;
  currentLat: number;
  currentLng: number;
  habitZones: FrequentZone[];
  habitHours: FrequentHours;
}): number {
  let score = 0;

  // 1. Heure inhabituelle
  const h = params.currentHour;

  const isHabitHour =
    (h >= 5 && h < 11 && params.habitHours.morning > 0.3) ||
    (h >= 11 && h < 17 && params.habitHours.afternoon > 0.3) ||
    (h >= 17 && h < 21 && params.habitHours.evening > 0.3) ||
    h >= 21 ||
    (h < 5 && params.habitHours.night > 0.3);

  if (!isHabitHour) score += 40;

  // 2. Zone inhabituelle
  const isInHabitZone = params.habitZones.some((z) => {
    const dist =
      Math.abs(z.latitude - params.currentLat) +
      Math.abs(z.longitude - params.currentLng);

    return dist < 0.01;
  });

  if (!isInHabitZone) score += 60;

  return Math.min(score, 100);
}
