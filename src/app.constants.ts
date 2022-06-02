export class AppConstants {
  static readonly MINUTES = 1;

  static readonly WEATHER_API = 'http://api.openweathermap.org/data/2.5/';
  static readonly api_key = '5a22a470f771df1701d7b310f7af0c11';

  static readonly A = 5281;
  static readonly v_min = 1;
  static readonly v_nom = 17;
  static readonly v_max = 25;
  static readonly P_nom = 2000;
  static readonly R = 8314.5;
  // Mechanical and electrical efficiency
  static readonly efficiency = 0.8;

  static readonly A_solar = 100;
  static readonly performance_ratio = 0.75;
  static readonly solar_efficiency = 0.17;
}

export const enum SourceType {
  Wind = 1,
  Solar,
}
