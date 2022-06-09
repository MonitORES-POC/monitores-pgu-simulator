import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import {
  ClientKafka,
  EventPattern,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';
import { PgusService } from './pgus.service';
import { CreatePguDto } from './dto/create-pgu.dto';
import { UpdatePguDto } from './dto/update-pgu.dto';

@Controller()
export class PgusController implements OnModuleInit {
  constructor(
    private readonly pgusService: PgusService,
    @Inject('API_SERVICE') private readonly apiClient: ClientKafka,
  ) {}

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

  onModuleInit() {
    this.apiClient.subscribeToResponseOf('get_constraint');
  }
}
