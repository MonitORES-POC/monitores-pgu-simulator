import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PgusModule } from './pgus/pgus.module';
import { WeatherService } from './weather/weather.service';

@Module({
  imports: [PgusModule, HttpModule],
  controllers: [AppController],
  providers: [AppService, WeatherService],
})
export class AppModule {}
