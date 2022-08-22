import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { catchError, map, Observable, of } from 'rxjs';
import { AppConstants } from 'src/app.constants';
import { SolarWeatherDto } from './dto/solar-weather.dto';
import { WindWeatherDto } from './dto/wind-weather.dto';
import * as dfd from 'danfojs-node';
import { DataFrame } from 'danfojs-node/dist/danfojs-base';

@Injectable()
export class WeatherService {
  private logger: Logger = new Logger('weather');
  private productionData;
  private dataIndex = 0;

  constructor(private httpService: HttpService) {
    this.initData();
  }

  async initData() {
    const excel: DataFrame = await dfd.readCSV(
      'src/dataset/WindForecast_20220807-20220810.csv',
    );
    this.productionData = excel['Measuredupscaled'].values;
  }

  getHistoricalProductionData() {
    const powerOutput: number = parseFloat(this.productionData[this.dataIndex]);
    this.dataIndex = (this.dataIndex + 1) % this.productionData.length;
    return powerOutput;
  }

  getWindWeatherData(): Observable<any> {
    return this.httpService
      .get(AppConstants.WEATHER_API + 'weather', {
        params: { appid: AppConstants.api_key, lat: 51.36, lon: 3.11 },
      })
      .pipe(
        catchError(this.handleError<any>('getting weather', null)),
        map((res) => {
          if (res === null || res.data['cod'] === '404') {
            console.log('City not found');
            return null;
          }
          const windData: WindWeatherDto = {} as WindWeatherDto;
          windData.pressure = res.data['main']['pressure'];
          windData.temperature = res.data['main']['temp'];
          windData.windSpeed = res.data['wind']['speed'];
          return windData;
        }),
      );
  }

  getSolarWeatherData(): Observable<any> {
    return this.httpService
      .get(AppConstants.WEATHER_API + 'solar_radiation', {
        params: { appid: AppConstants.api_key, lat: 22, lon: -80.8 },
      })
      .pipe(
        catchError(this.handleError<any>('getting weather', null)),
        map((res) => {
          if (res === null || res.data['cod'] === '404') {
            console.log('City not found');
            return null;
          }
          const solarData: SolarWeatherDto = {} as SolarWeatherDto;
          solarData.globalHorizontalIrradiance =
            res.data['list']['radiation']['ghi'];
          return solarData;
        }),
      );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      this.logger.error(JSON.stringify(error)); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.logger.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
