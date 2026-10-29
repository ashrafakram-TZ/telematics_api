import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  Max,
  Min,
  ValidateIf,
  validateSync,
} from 'class-validator';

const toBoolean = ({ value }: { value: unknown }) => value === true || value === 'true';

export class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: string = 'development';

  @IsString()
  @IsNotEmpty()
  HOST: string = '::';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsTimeZone()
  APP_TIMEZONE: string = 'Asia/Kolkata';

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsInt()
  DB_PORT: number = 5432;

  @IsString()
  @IsNotEmpty()
  DB_USER: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  @Transform(toBoolean)
  @IsBoolean()
  DB_SSL: boolean = false;

  @IsInt()
  @Min(1)
  DB_POOL_SIZE: number = 10;

  @Transform(toBoolean)
  @IsBoolean()
  MQTT_ENABLED: boolean = false;

  @ValidateIf((env: EnvironmentVariables) => env.MQTT_ENABLED)
  @IsString()
  @IsNotEmpty()
  MQTT_URL: string;

  @IsOptional()
  @IsString()
  MQTT_USERNAME?: string;

  @IsOptional()
  @IsString()
  MQTT_PASSWORD?: string;

  @ValidateIf((env: EnvironmentVariables) => env.MQTT_ENABLED)
  @IsString()
  @IsNotEmpty()
  MQTT_CLIENT_ID: string;

  @IsString()
  @IsNotEmpty()
  MQTT_TOPIC_FILTER: string = 'telematics/+/telemetry';
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const [error] = validateSync(env);
  if (error) {
    const reason = Object.values(error.constraints ?? {})[0] ?? 'is invalid';
    throw new Error(`Invalid env ${error.property}: ${reason}`);
  }
  return env;
}
