import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAlerts1780900000000 implements MigrationInterface {
  name = 'CreateAlerts1780900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "alerts_severity_enum" AS ENUM ('low', 'medium', 'high');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "alerts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "user_id" uuid NOT NULL,
        "type" character varying(50) NOT NULL,
        "message" text NOT NULL,
        "severity" "alerts_severity_enum" NOT NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "latitude" numeric(10,7),
        "longitude" numeric(10,7),
        CONSTRAINT "pk_alerts" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_alerts_user_id_created_at"
      ON "alerts" ("user_id", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_alerts_user_id_is_read"
      ON "alerts" ("user_id", "is_read")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_alerts_user_id_is_read"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_alerts_user_id_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "alerts"`);
    await queryRunner.query(`DROP TYPE "alerts_severity_enum"`);
  }
}
