import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { PgusService } from './pgus.service';
import { CreatePguDto } from './dto/create-pgu.dto';
import { UpdatePguDto } from './dto/update-pgu.dto';

@Controller()
export class PgusController {
  constructor(private readonly pgusService: PgusService) {}

  @EventPattern('createPgu')
  create(data: any) {
    return this.pgusService.create(data.value);
  }

  @MessagePattern('findAllPgus')
  findAll() {
    return this.pgusService.findAll();
  }

  @MessagePattern('findOnePgu')
  findOne(@Payload() id: number) {
    return this.pgusService.findOne(id);
  }

  @MessagePattern('updatePgu')
  update(@Payload() updatePgusDto: UpdatePguDto) {
    return this.pgusService.update(updatePgusDto.id, updatePgusDto);
  }

  @MessagePattern('removePgu')
  remove(@Payload() id: number) {
    return this.pgusService.remove(id);
  }
}
