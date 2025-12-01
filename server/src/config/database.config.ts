import { registerAs } from '@nestjs/config';

type PG = 'postgres'

export default registerAs('databaseConfig', () => ({
  type: 'postgres' as PG,
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '') || 5432,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: true // done, the tables can be created automatically. This will not be done in PROD,
}));