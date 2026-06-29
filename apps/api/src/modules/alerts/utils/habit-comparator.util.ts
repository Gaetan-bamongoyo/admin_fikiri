export class HabitComparatorUtil {
  /**
   * Vérifie si une position est dans une zone fréquente utilisateur
   */
  static isFrequentZone(
    lat: number,
    lng: number,
    frequentZones: Array<{
      latitude: number;
      longitude: number;
      radius: number;
    }>,
  ): boolean {
    return frequentZones.some((zone) => {
      const distance = this.calculateDistance(
        lat,
        lng,
        zone.latitude,
        zone.longitude,
      );

      return distance <= zone.radius;
    });
  }

  /**
   * Calcule le niveau de trafic selon l’heure
   */
  static getTrafficRisk(hour: number): 'low' | 'medium' | 'high' {
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 'high';
    }

    if (hour >= 10 && hour <= 16) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Distance simple entre deux points GPS (approximation)
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // rayon de la Terre en km

    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  static toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
}
