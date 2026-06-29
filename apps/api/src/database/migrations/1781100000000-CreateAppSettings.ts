import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppSettings1781100000000 implements MigrationInterface {
  name = 'CreateAppSettings1781100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "app_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "app_name" character varying(150) NOT NULL DEFAULT 'Fikiri Traffic',
        "app_description" text,
        "language" character varying(10) NOT NULL DEFAULT 'fr',
        "timezone" character varying(50) NOT NULL DEFAULT 'Africa/Kinshasa',
        "maintenance_mode" boolean NOT NULL DEFAULT false,
        "public_signup_enabled" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_app_settings" PRIMARY KEY ("id")
      )
    `);

    // Ligne unique par défaut.
    await queryRunner.query(`
      INSERT INTO "app_settings" ("app_description")
      VALUES ('Plateforme de suivi du trafic routier à Kinshasa')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "app_settings"`);
  }
}
