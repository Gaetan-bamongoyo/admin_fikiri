import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFleetVehicles1780500000000 implements MigrationInterface {
  name = 'CreateFleetVehicles1780500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "vehicles_kind_enum" AS ENUM ('bus', 'minibus', 'taxi')
    `);
    await queryRunner.query(`
      CREATE TYPE "vehicles_status_enum" AS ENUM ('active', 'idle', 'offline')
    `);
    await queryRunner.query(`
      CREATE TYPE "vehicles_traffic_condition_enum" AS ENUM (
        'fluid', 'moderate', 'heavy', 'blocked'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "vehicles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "name" character varying(100) NOT NULL,
        "kind" "vehicles_kind_enum" NOT NULL,
        "line" character varying(150),
        "plate" character varying(20),
        "driver_name" character varying(150),
        "capacity" integer NOT NULL DEFAULT 0,
        "passengers" integer NOT NULL DEFAULT 0,
        "status" "vehicles_status_enum" NOT NULL DEFAULT 'offline',
        "traffic_condition" "vehicles_traffic_condition_enum" NOT NULL DEFAULT 'fluid',
        "latitude" numeric(10,7),
        "longitude" numeric(10,7),
        "location" geography(Point,4326),
        "distance_km" numeric(10,2) NOT NULL DEFAULT 0,
        "last_seen_at" TIMESTAMPTZ,
        CONSTRAINT "PK_vehicles" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_vehicles_status" ON "vehicles" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vehicles_location" ON "vehicles" USING GiST ("location")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vehicles_location"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vehicles_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicles"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "vehicles_traffic_condition_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "vehicles_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "vehicles_kind_enum"`);
  }
}
