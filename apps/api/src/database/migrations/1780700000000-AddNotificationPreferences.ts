import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationPreferences1780700000000
  implements MigrationInterface
{
  name = 'AddNotificationPreferences1780700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_preferences"
      ADD COLUMN "traffic_region_alerts_enabled" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      ALTER TABLE "user_preferences"
      ADD COLUMN "route_incident_alerts_enabled" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      ALTER TABLE "user_preferences"
      ADD COLUMN "departure_reminder_minutes" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_preferences"
      DROP COLUMN "departure_reminder_minutes"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_preferences"
      DROP COLUMN "route_incident_alerts_enabled"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_preferences"
      DROP COLUMN "traffic_region_alerts_enabled"
    `);
  }
}
