export class AppConstants {
  static readonly MINUTES = 1;
  static readonly ConstraintPeriod = 5 * 60 * 1000;

  static readonly WEATHER_API = 'http://api.openweathermap.org/data/2.5/';
  static readonly api_key = '5a22a470f771df1701d7b310f7af0c11';

  static readonly Awind = 5281;
  static readonly AirMolarMass = 0.029;
  static readonly Vcutin = 1;
  static readonly Vnom = 17;
  static readonly Vcutoff = 25;
  static readonly Pnom = 2000;
  static readonly R = 8.3145;
  // Mechanical and electrical efficiency
  static readonly WindEfficiency = 0.8;

  static readonly Asolar = 100;
  static readonly PR = 0.75;
  static readonly SolarEfficiency = 0.17;
}

export const enum SourceType {
  Wind = 1,
  Solar,
}
