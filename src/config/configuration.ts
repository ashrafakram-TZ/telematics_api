import { ConfigType, registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  host: process.env.HOST ?? '::',
  port: Number(process.env.PORT ?? 3000),
  timeZone: process.env.APP_TIMEZONE ?? 'Asia/Kolkata',
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}));

export const dbConfig = registerAs('db', () => ({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true',
  poolSize: Number(process.env.DB_POOL_SIZE ?? 10),
}));

export const mqttConfig = registerAs('mqtt', () => ({
  enabled: process.env.MQTT_ENABLED === 'true',
  url: process.env.MQTT_URL ?? '',
  username: process.env.MQTT_USERNAME || undefined,
  password: process.env.MQTT_PASSWORD || undefined,
  clientId: process.env.MQTT_CLIENT_ID ?? '',
}));

export type AppConfig = ConfigType<typeof appConfig>;
export type DbConfig = ConfigType<typeof dbConfig>;
export type MqttConfig = ConfigType<typeof mqttConfig>;
