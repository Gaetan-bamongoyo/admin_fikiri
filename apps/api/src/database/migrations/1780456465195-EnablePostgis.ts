import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnablePostgis1780456465195 implements MigrationInterface {
  name = 'EnablePostgis1780456465195';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enable PostGIS extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

    // 2. Add location column as geography(Point, 4326) to traffic_reports and incidents
    await queryRunner.query(
      `ALTER TABLE "traffic_reports" ADD "location" geography(Point, 4326)`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" ADD "location" geography(Point, 4326)`,
    );

    // 3. Populate location column from longitude and latitude
    await queryRunner.query(
      `UPDATE "traffic_reports" SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography`,
    );
    await queryRunner.query(
      `UPDATE "incidents" SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography`,
    );

    // 4. Set location column as NOT NULL
    await queryRunner.query(
      `ALTER TABLE "traffic_reports" ALTER COLUMN "location" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" ALTER COLUMN "location" SET NOT NULL`,
    );

    // 5. Create spatial indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_traffic_reports_location" ON "traffic_reports" USING GIST ("location")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_incidents_location" ON "incidents" USING GIST ("location")`,
    );

    // 6. Create traffic_tracks table for mapping future routes/traces (tracés)
    await queryRunner.query(`
            CREATE TABLE "traffic_tracks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMPTZ,
                "user_id" uuid,
                "path" geography(LineString, 4326) NOT NULL,
                CONSTRAINT "PK_traffic_tracks" PRIMARY KEY ("id"),
                CONSTRAINT "FK_traffic_tracks_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `);

    // 7. Create spatial index for traffic_tracks path
    await queryRunner.query(
      `CREATE INDEX "IDX_traffic_tracks_path" ON "traffic_tracks" USING GIST ("path")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop traffic_tracks
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_traffic_tracks_path"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "traffic_tracks"`);

    // Drop spatial indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_incidents_location"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_traffic_reports_location"`,
    );

    // Drop columns
    await queryRunner.query(`ALTER TABLE "incidents" DROP COLUMN "location"`);
    await queryRunner.query(
      `ALTER TABLE "traffic_reports" DROP COLUMN "location"`,
    );

    // Drop PostGIS extension
    await queryRunner.query(`DROP EXTENSION IF EXISTS postgis`);
  }
}
