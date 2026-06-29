import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserHabitProfiles1750000000000 implements MigrationInterface {
  name = 'AddUserHabitProfiles1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_habit_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "user_id" uuid NOT NULL,
        "frequent_zones" jsonb,
        "frequent_hours" jsonb,
        CONSTRAINT "PK_user_habit_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_habit_profiles_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_user_habit_profiles_user"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_habit_profiles_user_id"
      ON "user_habit_profiles" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_user_habit_profiles_user_id"`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "user_habit_profiles"`);
  }
}
