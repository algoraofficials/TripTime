export interface DestinationWeather {
  destination: string;
  tempC: number;
  tempF: number;
  condition: string;
  icon: 'sun' | 'cloud-sun' | 'rain' | 'thunder';
  humidity: number;
  windSpeedKm: number;
  forecast: string;
}

export const DESTINATION_WEATHER_DATA: Record<string, DestinationWeather> = {
  "Cox's Bazar": {
    destination: "Cox's Bazar",
    tempC: 30,
    tempF: 86,
    condition: 'Sunny Coastal Breeze',
    icon: 'sun',
    humidity: 72,
    windSpeedKm: 18,
    forecast: 'Clear coastal skies, perfect for beach & rail arrival',
  },
  "Sylhet": {
    destination: "Sylhet",
    tempC: 27,
    tempF: 80,
    condition: 'Passing Tea Drizzle',
    icon: 'rain',
    humidity: 84,
    windSpeedKm: 12,
    forecast: 'Lush tea garden showers expected this afternoon',
  },
  "Chittagong": {
    destination: "Chittagong",
    tempC: 29,
    tempF: 84,
    condition: 'Partly Cloudy',
    icon: 'cloud-sun',
    humidity: 76,
    windSpeedKm: 15,
    forecast: 'Mild maritime breeze along Karnaphuli riverbank',
  },
  "Saint Martin's Island": {
    destination: "Saint Martin's Island",
    tempC: 31,
    tempF: 88,
    condition: 'Tropical Sunshine',
    icon: 'sun',
    humidity: 70,
    windSpeedKm: 22,
    forecast: 'Calm turquoise sea waters & clear ship navigation',
  },
  "Sreemangal": {
    destination: "Sreemangal",
    tempC: 26,
    tempF: 78,
    condition: 'Cool Valley Fog',
    icon: 'cloud-sun',
    humidity: 80,
    windSpeedKm: 10,
    forecast: 'Pleasant temperatures for Lawachara trekking',
  },
  "Dhaka": {
    destination: "Dhaka",
    tempC: 32,
    tempF: 90,
    condition: 'Warm & Sunny',
    icon: 'sun',
    humidity: 68,
    windSpeedKm: 14,
    forecast: 'High visibility for airport & rail departures',
  },
  "Sundarbans": {
    destination: "Sundarbans",
    tempC: 28,
    tempF: 82,
    condition: 'Humid Mangrove Canopy',
    icon: 'cloud-sun',
    humidity: 88,
    windSpeedKm: 16,
    forecast: 'Ideal riverboat safari transit weather',
  },
  "Kuakata": {
    destination: "Kuakata",
    tempC: 29,
    tempF: 84,
    condition: 'Coastal Breeze',
    icon: 'sun',
    humidity: 74,
    windSpeedKm: 20,
    forecast: 'Clear horizon for sunrise & sunset views',
  },
};

export function getDestinationWeather(destination: string): DestinationWeather {
  const matchKey = Object.keys(DESTINATION_WEATHER_DATA).find((key) =>
    destination.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(destination.toLowerCase())
  );

  if (matchKey && DESTINATION_WEATHER_DATA[matchKey]) {
    return DESTINATION_WEATHER_DATA[matchKey];
  }

  return {
    destination: destination || 'Bangladesh Transit Hub',
    tempC: 28,
    tempF: 82,
    condition: 'Pleasant Tropical Climate',
    icon: 'sun',
    humidity: 75,
    windSpeedKm: 15,
    forecast: 'Favorable transit & arrival conditions',
  };
}
