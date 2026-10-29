# Telematics API

NestJS backend for GPS/IoT vehicle devices. Devices are identified by IMEI and publish telemetry over MQTT. The API stores each message as a time-series row and exposes device status and history over REST.

Stack: NestJS 10, TypeORM, PostgreSQL, MQTT (hybrid app: REST and MQTT run in one process).

## Setup

```bash
npm install
cp .env.example .env
npm run migration:run
npm run start:dev
```

Requirements: Node 20+, PostgreSQL 14+ and any MQTT broker. All connection details come from `.env`, and the app fails fast at startup if a value is missing or invalid.

Docker is optional. `npm run docker:up` starts Postgres 16 and Mosquitto 2 locally. To use them, set `DB_*` to match, and set `MQTT_URL=mqtt://localhost:1883`.

Set `MQTT_ENABLED=false` to run the REST API only.

CORS: when `CORS_ORIGINS` is empty, any origin is allowed outside production, and every origin is blocked in production. For live, set it to the allowed domains, separated by commas, e.g. `CORS_ORIGINS=https://app.example.com`.

Swagger is served at `/api/docs` outside production.

Times are stored in UTC and returned in `APP_TIMEZONE` (default `Asia/Kolkata`), e.g. `2026-10-29T13:00:06.000+05:30`. Pass `from`/`to` filters with an offset, e.g. `2026-10-29T09:00:00+05:30`.

## Response format

```json
{ "status": 200, "message": "OK", "data": {} }
{ "status": 200, "message": "OK", "data": { "items": [], "total": 0, "page": 1, "limit": 20 } }
{ "status": 404, "error": "NOT_FOUND", "message": "Device not found" }
```

Errors are produced in one place, `src/common/filters/all-exceptions.filter.ts`. Services throw `AppException` (for example `AppException.notFound('Device not found')`) or any Nest `HttpException`. Postgres constraint errors are mapped automatically: a duplicate key becomes 409 and invalid input becomes 400. Unknown errors return 500 with a generic message, and the stack is written to the log only.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | `{ db, mqtt }`; `mqtt` is `up`, `down` or `disabled` |
| POST | `/api/devices` | Register a device (`imei` must be 15 digits) |
| GET | `/api/devices?page&limit&search` | List devices |
| GET | `/api/devices/:id` | Get a device |
| PATCH | `/api/devices/:id` | Update a device |
| DELETE | `/api/devices/:id` | Soft delete a device |
| GET | `/api/devices/:id/telemetry/latest` | Latest position |
| GET | `/api/devices/:id/telemetry?from&to&page&limit` | Position history (ISO dates) |

## MQTT

Devices publish to the topic `telematics/{imei}/telemetry`, which can be changed with `MQTT_TOPIC_FILTER`.

```json
{ "ts": 1793259595, "lat": 13.0827, "lng": 80.2707, "spd": 42, "hdg": 180, "ign": 1, "odo": 12345.6, "fuel": 56 }
```

`ts` must be the current Unix time in seconds (10 digits). The example value above is already too old to be accepted. In Postman, use `{{$timestamp}}` without quotes. Milliseconds (13 digits) and date strings are rejected.

| Key | Meaning | Rule |
|---|---|---|
| `ts` | Device time, Unix seconds | Required; no older than 30 days and no more than 5 minutes ahead |
| `lat`, `lng` | Position | Required; -90 to 90 and -180 to 180 |
| `spd` | Speed (km/h) | Optional; ≥ 0 |
| `hdg` | Heading (degrees) | Optional; 0 to 359 |
| `ign` | Ignition | Optional; 0 or 1 |
| `odo` | Odometer (km) | Optional; ≥ 0 |
| `fuel` | Fuel (%) | Optional; 0 to 100 |

Messages that are invalid, or that come from an unregistered or inactive IMEI, are logged and dropped. They never crash the process. If the broker is unreachable, HTTP still starts and the MQTT client keeps retrying every 5 seconds.

Test publish:

```bash
mosquitto_pub -h broker.hivemq.com -t telematics/860000000000001/telemetry \
  -m '{"ts":'$(date +%s)',"lat":13.0827,"lng":80.2707,"spd":42,"ign":1}'
```

Public brokers are open to anyone, so use them only for the POC. Give each running instance a unique `MQTT_CLIENT_ID`.

## Scripts

| Script | Purpose |
|---|---|
| `start:dev` / `build` / `start:prod` | Run in watch mode, compile, run the compiled build |
| `lint` / `format` | ESLint and Prettier |
| `migration:generate -- src/database/migrations/Name` | Generate a migration from entity changes |
| `migration:run` / `migration:revert` | Apply or roll back migrations |
| `docker:up` / `docker:down` | Start or stop the optional local Postgres and Mosquitto |
| `test:e2e` | Smoke tests (need a migrated database) |

## Structure

```
src/
  main.ts                 bootstrap: HTTP, Swagger, MQTT microservice
  app.setup.ts            global prefix, validation pipe, error filter, response interceptor
  config/                 env validation and typed config
  common/                 AppException, error filter, response interceptor, pagination, base entity
  database/               TypeORM module, CLI data source, migrations
  mqtt/                   topic constant, connection status service
  modules/health|devices|telemetry
```
