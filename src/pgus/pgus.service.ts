import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { lastValueFrom } from 'rxjs';
import { AppConstants, SourceType } from 'src/app.constants';
import { SolarWeatherDto } from 'src/weather/dto/solar-weather.dto';
import { WindWeatherDto } from 'src/weather/dto/wind-weather.dto';
import { WeatherService } from 'src/weather/weather.service';
import { ConstraintDto } from './dto/constraint.dto';
import { GetConstraintRequest } from './dto/get-constraint.request';
import { UpdatePguDto } from './dto/update-pgu.dto';
import { createPguEvent } from './events/create-pgu.event';
import { MeasureEvent } from './events/measure.event';

@Injectable()
export class PgusService {
  private logger: Logger = new Logger('PgusService');
  private static constraintArray: Array<ConstraintDto> = [];

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private weatherService: WeatherService,
    @Inject('API_SERVICE') private readonly apiClient: ClientKafka,
  ) {}

  create(createPguEvent: createPguEvent) {
    const jobName = 'pgu-' + createPguEvent.newPgu.id;
    if (createPguEvent.newPgu.sourceTypeId == SourceType.Wind) {
      const newJob = new CronJob(
        `*/${AppConstants.MINUTES} * * * *`,
        async () => {
          const powerLimit = await this.checkForConstraint(
            createPguEvent.newPgu.id,
          );
          this.weatherService.getWindWeatherData().subscribe((windWeather) => {
            this.produceWindPower(
              windWeather,
              createPguEvent.newPgu.id,
              createPguEvent.newPgu.amplificationFactor,
              powerLimit,
            );
          });
          this.logger.warn(
            `time (${AppConstants.MINUTES}) for job ${jobName} to run!`,
          );
        },
      );
      this.schedulerRegistry.addCronJob(jobName, newJob);
      newJob.start();
    } else if (createPguEvent.newPgu.sourceTypeId == SourceType.Solar) {
      const newJob = new CronJob(
        `*/${AppConstants.MINUTES} * * * *`,
        async () => {
          const powerLimit = await this.checkForConstraint(
            createPguEvent.newPgu.id,
          );
          this.weatherService
            .getSolarWeatherData()
            .subscribe((solarWeather) => {
              this.produceWindPower(
                solarWeather,
                createPguEvent.newPgu.id,
                createPguEvent.newPgu.amplificationFactor,
                powerLimit,
              );
            });
          this.logger.warn(
            `time (${AppConstants.MINUTES}) for job ${jobName} to run!`,
          );
        },
      );
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

  produceWindPower(
    weatherData: WindWeatherDto,
    id: number,
    amplificationFactor: number,
    powerLimit?: number,
  ) {
    let powerOutput: number;
    if (
      weatherData.windSpeed >= AppConstants.Vcutoff ||
      weatherData.windSpeed <= AppConstants.Vcutin
    ) {
      powerOutput = 0;
    } else if (weatherData.windSpeed >= AppConstants.Vnom) {
      powerOutput = AppConstants.Pnom;
    } else {
      const rho: number =
        (weatherData.pressure * 100 * AppConstants.AirMolarMass) /
        (AppConstants.R * weatherData.temperature);
      let Cp: number;
      if (weatherData.windSpeed < 3) {
        Cp = 0.1;
      } else if (weatherData.windSpeed >= 3 && weatherData.windSpeed < 13) {
        Cp = 0.45;
      } else if (weatherData.windSpeed >= 13) {
        Cp = 0.15;
      }
      powerOutput =
        (0.5 *
          Cp *
          AppConstants.Awind *
          rho *
          weatherData.windSpeed ** 3 *
          AppConstants.WindEfficiency) /
        1000;
    }
    if (powerLimit !== null && powerLimit !== undefined) {
      powerOutput =
        powerOutput <= powerLimit
          ? powerOutput * amplificationFactor
          : powerLimit * 0.9;
    }
    const now = new Date();
    console.log('wind power emitted by pgu' + id + ':' + powerOutput);
    this.apiClient.emit('pgu-measures', new MeasureEvent(id, now, powerOutput));
  }

  produceSolarPower(
    weatherData: SolarWeatherDto,
    id: number,
    amplificationFactor: number,
    powerLimit?: number,
  ) {
    let powerOutput: number =
      AppConstants.Asolar *
      AppConstants.SolarEfficiency *
      AppConstants.PR *
      weatherData.globalHorizontalIrradiance;
    if (powerLimit) {
      powerOutput =
        powerOutput <= powerLimit
          ? powerOutput * amplificationFactor
          : powerLimit * 0.9;
    }
    const now = new Date();
    console.log('solar power emitted by pgu' + id + ':' + powerOutput);
    this.apiClient.emit('pgu-measures', new MeasureEvent(id, now, powerOutput));
  }

  async checkForConstraint(id: number) {
    const res$ = this.apiClient.send(
      'get_constraint',
      new GetConstraintRequest(id),
    );
    const constraintDto: ConstraintDto = await lastValueFrom(res$);
    const applicationTime = new Date(constraintDto.constraint.applicationTime);
    const now = new Date();

    switch (constraintDto.statusId) {
      case 3:
      case 4: {
        return 0;
      }
      case 0:
      case 1: {
        if (
          constraintDto.constraint.powerLimit < 0 ||
          now.getTime() >
            applicationTime.getTime() + AppConstants.ConstraintPeriod
        ) {
          return null;
        } else if (now.getTime() < applicationTime.getTime()) {
          this.logger.warn(
            `PGU ${id} will be limited to ${constraintDto.constraint.powerLimit} in the next ${AppConstants.ConstraintPeriod}`,
          );
        } else {
          return constraintDto.constraint.powerLimit;
        }
      }
      case 2: {
        return constraintDto.contractPower;
      }
      default:
        return null;
    }
  }
}
