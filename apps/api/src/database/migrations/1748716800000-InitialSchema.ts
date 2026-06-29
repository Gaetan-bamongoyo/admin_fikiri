import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1748716800000 implements MigrationInterface {
  name = 'InitialSchema1748716800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('user', 'admin')
    `);
    await queryRunner.query(`
      CREATE TYPE "incidents_type_enum" AS ENUM (
        'congestion', 'accident', 'roadwork', 'checkpoint', 'danger', 'clear'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "incidents_status_enum" AS ENUM (
        'active', 'resolved', 'expired', 'disputed'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "traffic_reports_condition_enum" AS ENUM (
        'fluid', 'moderate', 'heavy', 'blocked'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "loyalty_transactions_reason_enum" AS ENUM (
        'incident_report', 'incident_confirm', 'traffic_report', 'daily_login'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "first_name" character varying(100),
        "last_name" character varying(100),
        "phone" character varying(20),
        "role" "users_role_enum" NOT NULL DEFAULT 'user',
        "loyalty_points" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")
    `);

    await queryRunner.query(`
      CREATE TABLE "user_preferences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "user_id" uuid NOT NULL,
        "home_latitude" numeric(10,7),
        "home_longitude" numeric(10,7),
        "work_latitude" numeric(10,7),
        "work_longitude" numeric(10,7),
        "notifications_enabled" boolean NOT NULL DEFAULT true,
        "anticipatory_alerts_enabled" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_user_preferences_user_id" UNIQUE ("user_id"),
        CONSTRAINT "PK_user_preferences" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_preferences_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incidents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "type" "incidents_type_enum" NOT NULL,
        "status" "incidents_status_enum" NOT NULL DEFAULT 'active',
        "latitude" numeric(10,7) NOT NULL,
        "longitude" numeric(10,7) NOT NULL,
        "description" character varying(500),
        "address" character varying(255),
        "reporter_id" uuid NOT NULL,
        "confirmation_count" integer NOT NULL DEFAULT 1,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "resolved_at" TIMESTAMPTZ,
        CONSTRAINT "PK_incidents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_incidents_reporter" FOREIGN KEY ("reporter_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_incidents_lat_lng" ON "incidents" ("latitude", "longitude")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_incidents_status_expires" ON "incidents" ("status", "expires_at")
    `);

    await queryRunner.query(`
      CREATE TABLE "incident_confirmations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "incident_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "is_confirm" boolean NOT NULL,
        CONSTRAINT "PK_incident_confirmations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_incident_confirmations_incident_user"
          UNIQUE ("incident_id", "user_id"),
        CONSTRAINT "FK_incident_confirmations_incident" FOREIGN KEY ("incident_id")
          REFERENCES "incidents"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_incident_confirmations_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "traffic_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "user_id" uuid NOT NULL,
        "latitude" numeric(10,7) NOT NULL,
        "longitude" numeric(10,7) NOT NULL,
        "condition" "traffic_reports_condition_enum" NOT NULL,
        CONSTRAINT "PK_traffic_reports" PRIMARY KEY ("id"),
        CONSTRAINT "FK_traffic_reports_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_traffic_reports_geo_time"
        ON "traffic_reports" ("latitude", "longitude", "created_at")
    `);

    await queryRunner.query(`
      CREATE TABLE "loyalty_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "user_id" uuid NOT NULL,
        "points" integer NOT NULL,
        "reason" "loyalty_transactions_reason_enum" NOT NULL,
        "reference_id" uuid,
        CONSTRAINT "PK_loyalty_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_loyalty_transactions_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_loyalty_transactions_user_time"
        ON "loyalty_transactions" ("user_id", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "loyalty_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "traffic_reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "incident_confirmations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "incidents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_preferences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "loyalty_transactions_reason_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "traffic_reports_condition_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "incidents_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "incidents_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
