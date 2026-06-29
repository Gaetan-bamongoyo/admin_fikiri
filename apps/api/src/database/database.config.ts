import { join } from 'node:path';
import { DataSourceOptions } from 'typeorm';

export interface DatabaseConfigOptions {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  synchronize?: boolean;
}

export function buildDatabaseOptions(
  overrides: DatabaseConfigOptions = {},
): DataSourceOptions {
  return {
    type: 'postgres',

    host: overrides.host ?? process.env.DB_HOST ?? 'localhost',
    port: overrides.port ?? parseInt(process.env.DB_PORT ?? '5432', 10),
    username: overrides.username ?? process.env.DB_USERNAME ?? 'postgres',
    password: overrides.password ?? process.env.DB_PASSWORD ?? 'postgres',
    database: overrides.database ?? process.env.DB_NAME ?? 'fikiri_traffic',

    // IMPORTANT FIX (entities mieux compatibles prod + docker)
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],

    //  FIX SAFE (évite bug migration path en dev + docker)
    migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],

    migrationsTableName: 'typeorm_migrations',

    synchronize: overrides.synchronize ?? process.env.DB_SYNCHRONIZE === 'true',
  };
}
