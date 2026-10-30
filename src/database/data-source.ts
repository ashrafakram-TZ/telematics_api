import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Telemetry } from '../modules/telemetry/entites/telemetry.entity';
import { Device } from '../modules/devices/entites/device.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true',
  entities: [Telemetry, Device],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
});
