import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TelemetryQueryDto } from './dto/telemetry-query.dto';
import { TelemetryService } from './telemetry.service';

@ApiTags('Telemetry')
@Controller('devices/:id/telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Get('latest')
  latest(@Param('id', ParseIntPipe) id: number) {
    return this.telemetryService.latest(id);
  }

  @Get()
  history(@Param('id', ParseIntPipe) id: number, @Query() query: TelemetryQueryDto) {
    return this.telemetryService.history(id, query);
  }
}
