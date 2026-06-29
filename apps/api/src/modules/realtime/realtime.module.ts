import { Module } from '@nestjs/common';
import { RidesModule } from '../rides/rides.module';
import { RidesSimulatorService } from './rides-simulator.service';
import { TrackingGateway } from './tracking.gateway';

/**
 * Couche temps réel : gateway WebSocket (`/tracking`) + simulateur optionnel.
 * Le gateway relaie les événements internes (courses, positions) vers les
 * clients ; le simulateur alimente la démo quand `RIDES_SIMULATOR=true`.
 */
@Module({
  imports: [RidesModule],
  providers: [TrackingGateway, RidesSimulatorService],
})
export class RealtimeModule {}
