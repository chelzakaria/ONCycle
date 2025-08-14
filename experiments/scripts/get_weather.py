"""Code reference : https://open-meteo.com/en/docs/historical-forecast-api"""

import openmeteo_requests
import pandas as pd
import requests_cache
from retry_requests import retry
from tqdm import tqdm


def fetch_weather_for_all_stations(start_date: str, end_date: str) -> pd.DataFrame:
    """
    Fetches weather data for all stations listed in the info.csv file
    between the given start and end dates.

    Args:
        start_date (str): Start date in 'YYYY-MM-DD' format.
        end_date (str): End date in 'YYYY-MM-DD' format.

    Returns:
        pd.DataFrame: DataFrame containing weather data for all stations.
    """

    def get_weather(
        latitude: float,
        longitude: float,
        station_name: str,
        start_date: str,
        end_date: str,
    ) -> pd.DataFrame:
        # Setup the Open-Meteo API client with cache and retry on error
        cache_session = requests_cache.CachedSession(".cache", expire_after=3600)
        retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
        openmeteo = openmeteo_requests.Client(session=retry_session)

        url = "https://historical-forecast-api.open-meteo.com/v1/forecast"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date,
            "end_date": end_date,
            "hourly": [
                "temperature_2m",
                "relative_humidity_2m",
                "dew_point_2m",
                "apparent_temperature",
                "precipitation",
                "visibility",
                "wind_speed_10m",
                "wind_direction_10m",
                "wind_gusts_10m",
                "uv_index",
                "cloud_cover",
                "surface_pressure",
            ],
            "timezone": "Africa/Casablanca",
        }
        try:
            responses = openmeteo.weather_api(url, params=params)
        except requests_cache.exceptions.Timeout:
            print(
                "Request timed out. Please check your internet connection or the API status."
            )
            return None

        response = responses[0]
        hourly = response.Hourly()
        hourly_df = pd.DataFrame(
            {
                "date": pd.date_range(
                    start=pd.to_datetime(hourly.Time(), unit="s", utc=True),
                    end=pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True),
                    freq=pd.Timedelta(seconds=hourly.Interval()),
                    inclusive="left",
                ).tz_convert("Africa/Casablanca"),
                "latitude": response.Latitude(),
                "longitude": response.Longitude(),
                "station_name": station_name,
                "timezone": response.Timezone(),
                "timezone_abbreviation": response.TimezoneAbbreviation(),
                "temperature": hourly.Variables(0).ValuesAsNumpy(),
                "relative_humidity": hourly.Variables(1).ValuesAsNumpy(),
                "dew_point": hourly.Variables(2).ValuesAsNumpy(),
                "apparent_temperature": hourly.Variables(3).ValuesAsNumpy(),
                "precipitation": hourly.Variables(4).ValuesAsNumpy(),
                "visibility": hourly.Variables(5).ValuesAsNumpy(),
                "wind_speed": hourly.Variables(6).ValuesAsNumpy(),
                "wind_direction": hourly.Variables(7).ValuesAsNumpy(),
                "wind_gusts": hourly.Variables(8).ValuesAsNumpy(),
                "uv_index": hourly.Variables(9).ValuesAsNumpy(),
                "cloud_cover": hourly.Variables(10).ValuesAsNumpy(),
                "surface_pressure": hourly.Variables(11).ValuesAsNumpy(),
            }
        )
        return hourly_df

    stations = pd.read_csv(
        "../data/info.csv",
        encoding="utf-8",
    )
    df = pd.DataFrame()
    for index, row in tqdm(enumerate(stations.itertuples()), total=len(stations)):
        station_name = row.NomGareFr
        latitude = float(row.Latitude.replace(",", "."))
        longitude = float(row.Longitude.replace(",", "."))
        weather_df = get_weather(
            latitude, longitude, station_name, start_date, end_date
        )
        if weather_df is not None:
            df = pd.concat([df, weather_df], ignore_index=True)
    df.to_csv(
        "../data/weather_data.csv",
        index=False,
    )
    print(f"Weather data saved to 'weather_data.csv' with {len(df)} records.")
    return df


# Example usage:
# df = fetch_weather_for_all_stations("2025-05-18", "2025-08-02")
# df.to_csv(
#     "../data/weather_data.csv",
#     index=False,
# )
