import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** Paramètres globaux de la plateforme (table mono-ligne). */
@Entity('app_settings')
export class AppSettings extends BaseEntity {
  @Column({ name: 'app_name', type: 'varchar', length: 150, default: 'Fikiri Traffic' })
  appName!: string;

  @Column({ name: 'app_description', type: 'text', nullable: true })
  appDescription?: string | null;

  @Column({ type: 'varchar', length: 10, default: 'fr' })
  language!: string;

  @Column({ type: 'varchar', length: 50, default: 'Africa/Kinshasa' })
  timezone!: string;

  @Column({ name: 'maintenance_mode', type: 'boolean', default: false })
  maintenanceMode!: boolean;

  @Column({ name: 'public_signup_enabled', type: 'boolean', default: true })
  publicSignupEnabled!: boolean;
}
