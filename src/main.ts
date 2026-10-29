import 'dotenv/config';
import { networkInterfaces } from 'os';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { setupApp } from './app.setup';
import { AppConfig, MqttConfig } from './config/configuration';
import { TELEMETRY_TOPIC } from './mqtt/mqtt.constants';

function reachableHosts(host: string): string[] {
  if (host !== '::' && host !== '0.0.0.0') return [host];
  const lan = Object.values(networkInterfaces())
    .flatMap((nets) => nets ?? [])
    .filter((net) => net.family === 'IPv4' && !net.internal)
    .map((net) => net.address);
  return ['localhost', ...lan];
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const config = app.get(ConfigService);
  const appCfg = config.getOrThrow<AppConfig>('app');
  const mqttCfg = config.getOrThrow<MqttConfig>('mqtt');

  setupApp(app);
  app.enableCors({ origin: appCfg.corsOrigins.length ? appCfg.corsOrigins : appCfg.env !== 'production' });
  app.enableShutdownHooks();

  if (appCfg.env !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Telematics API').setVersion('0.1.0').build(),
    );
    SwaggerModule.setup('api/docs', app, document, { swaggerOptions: { defaultModelsExpandDepth: -1 } });
  }

  if (mqttCfg.enabled) {
    app.connectMicroservice<MicroserviceOptions>(
      {
        transport: Transport.MQTT,
        options: {
          url: mqttCfg.url,
          clientId: mqttCfg.clientId,
          username: mqttCfg.username,
          password: mqttCfg.password,
          reconnectPeriod: 5000,
        },
      },
      { inheritAppConfig: true },
    );
  }

  await app.listen(appCfg.port, appCfg.host);
  for (const host of reachableHosts(appCfg.host)) {
    logger.log(`HTTP listening on http://${host}:${appCfg.port}/api`);
  }

  if (mqttCfg.enabled) {
    app
      .startAllMicroservices()
      .then(() => logger.log(`MQTT subscribed to ${TELEMETRY_TOPIC} on ${mqttCfg.url}`))
      .catch((error: Error) => logger.error(`MQTT failed to start: ${error.message}`));
  }
}

void bootstrap();
