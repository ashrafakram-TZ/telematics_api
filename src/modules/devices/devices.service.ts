import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { AppException } from '../../common/exceptions/app.exception';
import { offset, paginate, Paginated } from '../../common/utils/paginate';
import { Device } from './device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { DeviceQueryDto } from './dto/device-query.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DevicesService {
  constructor(@InjectRepository(Device) private readonly devices: Repository<Device>) {}

  create(dto: CreateDeviceDto): Promise<Device> {
    return this.devices.save(this.devices.create(dto));
  }

  async findAll({ page, limit, search }: DeviceQueryDto): Promise<Paginated<Device>> {
    const where = search ? [{ imei: ILike(`%${search}%`) }, { name: ILike(`%${search}%`) }] : {};
    const result = await this.devices.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: offset(page, limit),
      take: limit,
    });
    return paginate(result, page, limit);
  }

  async findOne(id: number): Promise<Device> {
    const device = await this.devices.findOneBy({ id });
    if (!device) throw AppException.notFound('Device not found');
    return device;
  }

  async update(id: number, dto: UpdateDeviceDto): Promise<Device> {
    const device = await this.findOne(id);
    return this.devices.save(this.devices.merge(device, dto));
  }

  async remove(id: number): Promise<{ id: number }> {
    await this.findOne(id);
    await this.devices.softDelete(id);
    return { id };
  }
}
