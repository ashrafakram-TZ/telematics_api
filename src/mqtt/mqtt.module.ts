import { Global, Module } from '@nestjs/common';
import { MqttStatusService } from './mqtt-status.service';

@Global()
@Module({
  providers: [MqttStatusService],
  exports: [MqttStatusService],
})
export class MqttModule {}
