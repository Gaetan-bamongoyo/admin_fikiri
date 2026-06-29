import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHomeWorkTrafficAlerts1780800000000
  implements MigrationInterface
{
  name = 'AddHomeWorkTrafficAlerts1780800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_preferences"
      ADD COLUMN "home_traffic_alerts_enabled" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "user_preferences"
      ADD COLUMN "work_traffic_alerts_enabled" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_preferences"
      DROP COLUMN "work_traffic_alerts_enabled"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_preferences"
      DROP COLUMN "home_traffic_alerts_enabled"
    `);
  }
}
