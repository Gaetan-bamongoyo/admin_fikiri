import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrajets1780458000000 implements MigrationInterface {
  name = 'CreateTrajets1780458000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "trajets_category_enum" AS ENUM (
        'home', 'work', 'church', 'market', 'other'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "trajets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "user_id" uuid NOT NULL,
        "label" character varying(100) NOT NULL,
        "category" "trajets_category_enum",
        "address" character varying(255) NOT NULL,
        "latitude" numeric(10,7) NOT NULL,
        "longitude" numeric(10,7) NOT NULL,
        "location" geography(Point, 4326) NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_trajets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_trajets_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_trajets_user_id" ON "trajets" ("user_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_trajets_location" ON "trajets" USING GIST ("location")`,
    );

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_trajets_user_label"
        ON "trajets" ("user_id", "label")
        WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_trajets_user_label"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_trajets_location"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_trajets_user_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "trajets"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "trajets_category_enum"`);
  }
}
