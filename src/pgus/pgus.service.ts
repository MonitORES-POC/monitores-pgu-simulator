import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { AppConstants, SourceType } from 'src/app.constants';
import { SolarWeatherDto } from 'src/weather/dto/solar-weather.dto';
import { WindWeatherDto } from 'src/weather/dto/wind-weather.dto';
import { WeatherService } from 'src/weather/weather.service';
import { CreatePguDto } from './dto/create-pgu.dto';
import { UpdatePguDto } from './dto/update-pgu.dto';
import { createPguEvent } from './events/create-pgu.event';
import { MeasureEvent } from './events/measure.event';

@Injectable()
export class PgusService {
  private logger: Logger = new Logger('PgusService');
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private weatherService: WeatherService,
    @Inject('API_SERVICE') private readonly apiClient: ClientKafka,
  ) {}

  create(createPguEvent: createPguEvent) {
    const jobName = 'pgu-' + createPguEvent.newPgu.id;

    if (createPguEvent.newPgu.sourceTypeId === SourceType.Wind) {
      const newJob = new CronJob(`*/${AppConstants.MINUTES} * * * *`, () => {
        this.weatherService.getWindWeatherData().subscribe((windWeather) => {
          this.produceWindPower(windWeather, createPguEvent.newPgu.id);
        });
        this.logger.warn(
          `time (${AppConstants.MINUTES}) for job ${jobName} to run!`,
        );
      });
      this.schedulerRegistry.addCronJob(jobName, newJob);
      newJob.start();
    } else if (createPguEvent.newPgu.sourceTypeId === SourceType.Solar) {
      const newJob = new CronJob(`*/${AppConstants.MINUTES} * * * *`, () => {
        this.weatherService.getSolarWeatherData().subscribe((solarWeather) => {
          this.produceWindPower(solarWeather, createPguEvent.newPgu.id);
        });
        this.logger.warn(
          `time (${AppConstants.MINUTES}) for job ${jobName} to run!`,
        );
      });
      this.schedulerRegistry.addCronJob(jobName, newJob);
      newJob.start();
    }

    this.logger.warn(
      `job ${jobName} added for each minute at ${AppConstants.MINUTES} minutes!`,
    );
  }

  findAll() {
    return `This action returns all pgus`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pgus`;
  }

  update(id: number, updatePgusDto: UpdatePguDto) {
    return `This action updates a #${id} pgus`;
  }

  remove(id: number) {
    return `This action removes a #${id} pgus`;
  }

  produceWindPower(weatherData: WindWeatherDto, id: number) {
    let powerOutput: number;
    if (
      weatherData.windSpeed >= AppConstants.v_max ||
      weatherData.windSpeed <= AppConstants.v_min
    ) {
      powerOutput = 0;
    } else if (weatherData.windSpeed >= AppConstants.v_nom) {
      powerOutput = AppConstants.P_nom;
    } else {
      const rho: number =
        (weatherData.pressure * 100 * 29) /
        (AppConstants.R * weatherData.temperature);
      let c_p: number;
      if (weatherData.windSpeed < 3) {
        c_p = 0.1;
      } else if (weatherData.windSpeed >= 3 && weatherData.windSpeed < 13) {
        c_p = 0.45;
      } else if (weatherData.windSpeed >= 13) {
        c_p = 0.15;
      }
      powerOutput =
        (0.5 *
          c_p *
          AppConstants.A *
          rho *
          weatherData.windSpeed ** 3 *
          AppConstants.efficiency) /
        1000;
    }

    const now = new Date();
    console.log('wind power emitted by pgu' + id + ':' + powerOutput);
    this.apiClient.emit('pgu-' + id, new MeasureEvent(now, powerOutput));
  }

  produceSolarPower(weatherData: SolarWeatherDto, id: number) {
    const powerOutput: number =
      AppConstants.A_solar *
      AppConstants.solar_efficiency *
      AppConstants.performance_ratio *
      weatherData.globalHorizontalIrradiance;
    const now = new Date();
    console.log('solar power emitted by pgu' + id + ':' + powerOutput);
    this.apiClient.emit('pgu-' + id, new MeasureEvent(now, powerOutput));
  }
}
