import { MigrationInterface, QueryRunner } from 'typeorm';

export class TrafficSpeedSamples1780457000000 implements MigrationInterface {
  name = 'TrafficSpeedSamples1780457000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "traffic_speed_samples" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "user_id" uuid,
        "latitude" numeric(10,7) NOT NULL,
        "longitude" numeric(10,7) NOT NULL,
        "location" geography(Point, 4326) NOT NULL,
        "speed_mps" double precision,
        "recorded_at" TIMESTAMPTZ NOT NULL,
        "source" character varying(32) NOT NULL DEFAULT 'navigation',
        CONSTRAINT "PK_traffic_speed_samples" PRIMARY KEY ("id"),
        CONSTRAINT "FK_traffic_speed_samples_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_traffic_speed_samples_location"
        ON "traffic_speed_samples" USING GIST ("location")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_traffic_speed_samples_recorded_at"
        ON "traffic_speed_samples" ("recorded_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_traffic_speed_samples_recorded_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_traffic_speed_samples_location"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "traffic_speed_samples"`);
  }
}
