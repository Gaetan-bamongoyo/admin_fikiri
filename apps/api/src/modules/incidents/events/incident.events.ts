import { Incident } from '../entities/incident.entity';

export class IncidentCreatedEvent {
  constructor(
    public readonly incident: Incident,
    public readonly reporterId: string,
  ) {}
}

export const INCIDENT_CREATED_EVENT = 'incident.created';
export const INCIDENT_CONFIRMED_EVENT = 'incident.confirmed';
