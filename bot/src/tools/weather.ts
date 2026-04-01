import { FunctionCallingConfigMode, Type } from "@google/genai";
import type { FunctionDeclaration } from "@google/genai";

// WMO Weather interpretation codes → human-readable descriptions
const WMO: Record<number, string> = {
	0: "Clear sky ☀️",
	1: "Mainly clear 🌤",
	2: "Partly cloudy ⛅",
	3: "Overcast ☁️",
	45: "Foggy 🌫",
	48: "Icy fog 🌫",
	51: "Light drizzle 🌦",
	53: "Moderate drizzle 🌦",
	55: "Heavy drizzle 🌧",
	61: "Slight rain 🌧",
	63: "Moderate rain 🌧",
	65: "Heavy rain 🌧",
	71: "Slight snow 🌨",
	73: "Moderate snow 🌨",
	75: "Heavy snow ❄️",
	77: "Snow grains ❄️",
	80: "Slight showers 🌦",
	81: "Moderate showers 🌧",
	82: "Heavy showers 🌧",
	85: "Slight snow showers 🌨",
	86: "Heavy snow showers ❄️",
	95: "Thunderstorm ⛈",
	96: "Thunderstorm with hail ⛈",
	99: "Thunderstorm with heavy hail ⛈",
};

export const weatherFunctionDeclaration: FunctionDeclaration = {
	name: "get_weather",
	description:
		"Get current weather conditions for any city in the world. Use this when the user asks about weather.",
	parameters: {
		type: Type.OBJECT,
		properties: {
			city: {
				type: Type.STRING,
				description: 'City name, e.g. "Lagos", "London", "New York"',
			},
			country_code: {
				type: Type.STRING,
				description:
					'Optional 2-letter ISO country code to disambiguate cities, e.g. "NG", "GB", "US"',
			},
		},
		required: ["city"],
	},
};

interface GeoResult {
	latitude: number;
	longitude: number;
	name: string;
	country: string;
	timezone: string;
}

interface WeatherCurrent {
	temperature_2m: number;
	apparent_temperature: number;
	relative_humidity_2m: number;
	wind_speed_10m: number;
	weather_code: number;
	precipitation: number;
}

export async function getWeather(
	city: string,
	countryCode?: string,
): Promise<string> {
	try {
		// Step 1: Geocode the city name
		const geoUrl =
			`https://geocoding-api.open-meteo.com/v1/search` +
			`?name=${encodeURIComponent(city)}` +
			`${countryCode ? `&country_code=${countryCode.toUpperCase()}` : ""}` +
			`&count=1&language=en&format=json`;

		const geoRes = await fetch(geoUrl);
		const geoData = (await geoRes.json()) as { results?: GeoResult[] };

		if (!geoData.results?.[0]) {
			return `Could not find location: "${city}". Try adding a country code (e.g. country_code: "NG").`;
		}

		const { latitude, longitude, name, country, timezone } =
			geoData.results[0];

		// Step 2: Fetch current weather
		const weatherUrl =
			`https://api.open-meteo.com/v1/forecast` +
			`?latitude=${latitude}&longitude=${longitude}` +
			`&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,precipitation` +
			`&timezone=${encodeURIComponent(timezone)}` +
			`&wind_speed_unit=kmh`;

		const weatherRes = await fetch(weatherUrl);
		const weatherData = (await weatherRes.json()) as {
			current: WeatherCurrent;
		};

		const c = weatherData.current;
		const condition = WMO[c.weather_code] ?? `Code ${c.weather_code}`;

		const lines = [
			`🌍 *Weather in ${name}, ${country}*`,
			`${condition}`,
			`🌡 Temp: *${c.temperature_2m}°C* (feels like ${c.apparent_temperature}°C)`,
			`💧 Humidity: ${c.relative_humidity_2m}%`,
			`💨 Wind: ${c.wind_speed_10m} km/h`,
		];
		if (c.precipitation > 0) {
			lines.push(`🌧 Precipitation: ${c.precipitation} mm`);
		}

		return lines.join("\n");
	} catch (error) {
		return `Failed to fetch weather: ${error instanceof Error ? error.message : "Unknown error"}`;
	}
}

// Void import to avoid unused warning — FunctionCallingConfigMode is re-exported
// so callers can use it without a second import
export { FunctionCallingConfigMode };
