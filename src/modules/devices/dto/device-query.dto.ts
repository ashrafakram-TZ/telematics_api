import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class DeviceQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Matches imei or name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
