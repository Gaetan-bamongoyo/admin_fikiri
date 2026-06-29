import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSearchMetroToUserPreferences1780600000000
  implements MigrationInterface
{
  name = 'AddSearchMetroToUserPreferences1780600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "search_metro_enum" AS ENUM ('auto', 'kinshasa', 'goma')
    `);

    await queryRunner.query(`
      ALTER TABLE "user_preferences"
      ADD COLUMN "search_metro" "search_metro_enum" NOT NULL DEFAULT 'auto'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_preferences" DROP COLUMN "search_metro"
    `);

    await queryRunner.query(`DROP TYPE "search_metro_enum"`);
  }
}
