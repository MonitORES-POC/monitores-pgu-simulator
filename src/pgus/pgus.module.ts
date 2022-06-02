import { Module } from '@nestjs/common';
import { PgusService } from './pgus.service';
import { PgusController } from './pgus.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { WeatherService } from 'src/weather/weather.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'API_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'monitores-api',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'monitores-api-consumer',
          },
        },
      },
    ]),
    ScheduleModule.forRoot(),
    HttpModule,
  ],
  controllers: [PgusController],
  providers: [PgusService, WeatherService],
})
export class PgusModule {}
