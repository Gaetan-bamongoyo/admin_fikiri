export interface UserAlert {
  userId: string;
  type: 'TRAFFIC_WARNING';
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: Date;
}
