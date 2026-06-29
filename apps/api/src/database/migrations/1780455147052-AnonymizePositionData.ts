import { MigrationInterface, QueryRunner } from 'typeorm';

export class AnonymizePositionData1780455147052 implements MigrationInterface {
  name = 'AnonymizePositionData1780455147052';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_preferences" DROP CONSTRAINT "FK_user_preferences_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "traffic_reports" DROP CONSTRAINT "FK_traffic_reports_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_confirmations" DROP CONSTRAINT "FK_incident_confirmations_incident"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_confirmations" DROP CONSTRAINT "FK_incident_confirmations_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" DROP CONSTRAINT "FK_incidents_reporter"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_transactions" DROP CONSTRAINT "FK_loyalty_transactions_user"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_traffic_reports_geo_time"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_incidents_status_expires"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_incidents_lat_lng"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_loyalty_transactions_user_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_confirmations" DROP CONSTRAINT "UQ_incident_confirmations_incident_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preferences" ADD "anonymize_position_data" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "traffic_reports" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c261da1f6af288576795667792" ON "traffic_reports" ("latitude", "longitude", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ace29fa2e75b52787633b6ce89" ON "incidents" ("status", "expires_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9431ecd43b645758319dd4ca4" ON "incidents" ("latitude", "longitude") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4b304a9e7e0ea4d1055535d9c1" ON "loyalty_transactions" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_confirmations" ADD CONSTRAINT "UQ_c4b3610909d4f5c2e8aeb2802c9" UNIQUE ("incident_id", "user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preferences" ADD CONSTRAINT "FK_458057fa75b66e68a275647da2e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "traffic_reports" ADD CONSTRAINT "FK_1e03c4ec23dc6f6562feb9ba22c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_confirmations" ADD CONSTRAINT "FK_ff529ad3606f31f01e8f534c5a1" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_confirmations" ADD CONSTRAINT "FK_e100a3fc94d44481384a1b7ceaa" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" ADD CONSTRAINT "FK_997933e2e9897cd680e453805ca" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "FK_c4d462b2bc48d9304b31bcab46b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loyalty_transactions" DROP CONSTRAINT "FK_c4d462b2bc48d9304b31bcab46b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" DROP CONSTRAINT "FK_997933e2e9897cd680e453805ca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_confirmations" DROP CONSTRAINT "FK_e100a3fc94d44481384a1b7ceaa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_confirmations" DROP CONSTRAINT "FK_ff529ad3606f31f01e8f534c5a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "traffic_reports" DROP CONSTRAINT "FK_1e03c4ec23dc6f6562feb9ba22c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preferences" DROP CONSTRAINT "FK_458057fa75b66e68a275647da2e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_confirmations" DROP CONSTRAINT "UQ_c4b3610909d4f5c2e8aeb2802c9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4b304a9e7e0ea4d1055535d9c1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9431ecd43b645758319dd4ca4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ace29fa2e75b52787633b6ce89"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c261da1f6af288576795667792"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "traffic_reports" ALTER COLUMN "user_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preferences" DROP COLUMN "anonymize_position_data"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_confirmations" ADD CONSTRAINT "UQ_incident_confirmations_incident_user" UNIQUE ("incident_id", "user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_loyalty_transactions_user_time" ON "loyalty_transactions" ("created_at", "user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_incidents_lat_lng" ON "incidents" ("latitude", "longitude") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_incidents_status_expires" ON "incidents" ("status", "expires_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_traffic_reports_geo_time" ON "traffic_reports" ("created_at", "latitude", "longitude") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email") `,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "FK_loyalty_transactions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" ADD CONSTRAINT "FK_incidents_reporter" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_confirmations" ADD CONSTRAINT "FK_incident_confirmations_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_confirmations" ADD CONSTRAINT "FK_incident_confirmations_incident" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "traffic_reports" ADD CONSTRAINT "FK_traffic_reports_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preferences" ADD CONSTRAINT "FK_user_preferences_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
