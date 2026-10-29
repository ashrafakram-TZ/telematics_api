import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Device } from '../modules/devices/device.entity';
import { Telemetry } from '../modules/telemetry/telemetry.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true',
  entities: [Device, Telemetry],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
});
