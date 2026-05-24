export type WeatherSnapshot = {
  tempF: number;
  description: string;
  cityLabel: string;
};

type GeocodingResult = {
  results?: Array<{
    name?: string;
    admin1?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  }>;
};

type ForecastResult = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
};

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "clear",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  48: "foggy",
  51: "light drizzle",
  53: "drizzle",
  55: "heavy drizzle",
  56: "freezing drizzle",
  57: "freezing drizzle",
  61: "light rain",
  63: "rainy",
  65: "heavy rain",
  66: "freezing rain",
  67: "freezing rain",
  71: "light snow",
  73: "snowy",
  75: "heavy snow",
  77: "snow grains",
  80: "rain showers",
  81: "rain showers",
  82: "heavy rain showers",
  85: "snow showers",
  86: "heavy snow showers",
  95: "thunderstorms",
  96: "thunderstorms with hail",
  99: "thunderstorms with hail",
};

function weatherCodeToDescription(code: number | undefined): string {
  if (code === undefined) {
    return "variable";
  }
  return WMO_DESCRIPTIONS[code] ?? "variable";
}

function formatCityLabel(result: NonNullable<GeocodingResult["results"]>[number]) {
  const parts = [result.name, result.admin1, result.country].filter(Boolean);
  return parts.join(", ");
}

export async function fetchWeatherForCity(city: string): Promise<WeatherSnapshot | null> {
  const geocodeUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geocodeUrl.searchParams.set("name", city.trim());
  geocodeUrl.searchParams.set("count", "1");
  geocodeUrl.searchParams.set("language", "en");
  geocodeUrl.searchParams.set("format", "json");

  const geocodeResponse = await fetch(geocodeUrl);
  if (!geocodeResponse.ok) {
    return null;
  }

  const geocodeData = (await geocodeResponse.json()) as GeocodingResult;
  const location = geocodeData.results?.[0];
  if (
    location?.latitude === undefined ||
    location.longitude === undefined
  ) {
    return null;
  }

  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.searchParams.set("latitude", String(location.latitude));
  forecastUrl.searchParams.set("longitude", String(location.longitude));
  forecastUrl.searchParams.set("current", "temperature_2m,weather_code");
  forecastUrl.searchParams.set("temperature_unit", "fahrenheit");
  forecastUrl.searchParams.set("timezone", "auto");

  const forecastResponse = await fetch(forecastUrl);
  if (!forecastResponse.ok) {
    return null;
  }

  const forecastData = (await forecastResponse.json()) as ForecastResult;
  const tempC = forecastData.current?.temperature_2m;
  if (tempC === undefined) {
    return null;
  }

  return {
    tempF: Math.round(tempC),
    description: weatherCodeToDescription(forecastData.current?.weather_code),
    cityLabel: formatCityLabel(location) || city.trim(),
  };
}
