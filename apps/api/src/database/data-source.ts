import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from './database.config';

config({ path: ['.env.local', '.env'] });

export default new DataSource(buildDatabaseOptions());
