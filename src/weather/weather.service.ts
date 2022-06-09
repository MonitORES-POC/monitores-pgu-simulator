import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { AppConstants } from 'src/app.constants';
import { SolarWeatherDto } from './dto/solar-weather.dto';
import { WindWeatherDto } from './dto/wind-weather.dto';

@Injectable()
export class WeatherService {
  constructor(private httpService: HttpService) {}

  getWindWeatherData(): Observable<any> {
    return this.httpService
      .get(AppConstants.WEATHER_API + 'weather', {
        params: { appid: AppConstants.api_key, lat: 51.36, lon: 3.11 },
      })
      .pipe(
        map((res) => {
          if (res.data['cod'] === '404') {
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
        map((res) => {
          if (res.data['cod'] === '404') {
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
}
