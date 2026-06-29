import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  DRIVER_EVENTS,
  type DriverPositionPayload,
} from '../../common/events/driver.events';
import { RIDE_EVENTS, type RideEventPayload } from '../rides/rides.events';

/** Canaux émis vers les clients (admin). */
export const TRACKING_CHANNELS = {
  RIDE_CREATED: 'ride:created',
  RIDE_UPDATED: 'ride:updated',
  DRIVER_POSITION: 'driver:position',
} as const;

/**
 * Gateway temps réel pour le suivi des courses et des chauffeurs.
 *
 * Le namespace `/tracking` diffuse les positions des chauffeurs et les
 * changements d'état des courses au tableau de bord admin.
 */
@WebSocketGateway({
  namespace: '/tracking',
  cors: { origin: '*' },
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(TrackingGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.debug(`Client connecté: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client déconnecté: ${client.id}`);
  }

  @OnEvent(RIDE_EVENTS.CREATED)
  onRideCreated(payload: RideEventPayload) {
    this.server?.emit(TRACKING_CHANNELS.RIDE_CREATED, payload.ride);
  }

  @OnEvent(RIDE_EVENTS.UPDATED)
  onRideUpdated(payload: RideEventPayload) {
    this.server?.emit(TRACKING_CHANNELS.RIDE_UPDATED, payload.ride);
  }

  @OnEvent(DRIVER_EVENTS.POSITION)
  onDriverPosition(payload: DriverPositionPayload) {
    this.server?.emit(TRACKING_CHANNELS.DRIVER_POSITION, payload);
  }
}
