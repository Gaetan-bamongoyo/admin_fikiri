import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRides1781000000000 implements MigrationInterface {
  name = 'CreateRides1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "rides_status_enum" AS ENUM (
        'searching', 'assigned', 'en_route', 'in_progress', 'completed', 'cancelled'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "rides" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "pickup_address" character varying(255) NOT NULL,
        "pickup_lat" numeric(10,7) NOT NULL,
        "pickup_lng" numeric(10,7) NOT NULL,
        "pickup_location" geography(Point,4326),
        "dropoff_address" character varying(255) NOT NULL,
        "dropoff_lat" numeric(10,7) NOT NULL,
        "dropoff_lng" numeric(10,7) NOT NULL,
        "dropoff_location" geography(Point,4326),
        "distance_km" numeric(10,2) NOT NULL DEFAULT 0,
        "duration_min" integer NOT NULL DEFAULT 0,
        "price" numeric(12,2) NOT NULL DEFAULT 0,
        "status" "rides_status_enum" NOT NULL DEFAULT 'searching',
        "driver_id" uuid,
        "driver_name" character varying(150),
        "passenger_id" uuid,
        "passenger_name" character varying(150),
        "assigned_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ,
        "completed_at" TIMESTAMPTZ,
        CONSTRAINT "PK_rides" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_rides_status" ON "rides" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_rides_driver_id" ON "rides" ("driver_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_rides_pickup_location" ON "rides" USING GiST ("pickup_location")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_rides_dropoff_location" ON "rides" USING GiST ("dropoff_location")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rides_dropoff_location"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rides_pickup_location"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rides_driver_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rides_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rides"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "rides_status_enum"`);
  }
}
