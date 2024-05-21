document.addEventListener("DOMContentLoaded", function() {
    const apiKey = 'P4nqcaa6RucUZQaC31q3DuB3yQj6Ang3';

    document.getElementById('get-weather-btn').addEventListener('click', function() {
        const city = document.getElementById('city-input').value;
        if (city) {
            const encodedCity = encodeURIComponent(city);
            const locationUrl = `http://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=${encodedCity}`;


            fetch(locationUrl)
                .then(response => response.json())
                .then(locationData => {
                    if (locationData.length > 0) {
                        const locationKey = locationData[0].Key;
                        const weatherUrl = `http://dataservice.accuweather.com/forecasts/v1/daily/1day/${locationKey}?apikey=${apiKey}&details=true`;

                        return fetch(weatherUrl)
                            .then(response => response.json())
                            .then(weatherData => {
                                if (weatherData.DailyForecasts && weatherData.DailyForecasts.length > 0) {
                                    const data = weatherData.DailyForecasts[0];
                                    console.log('Weather data received:', data);

                                    const temperatureCelsius = convertFahrenheitToCelsius(data.Temperature.Minimum.Value) + " to " + convertFahrenheitToCelsius(data.Temperature.Maximum.Value) + " °C";
                                    const feelsLikeCelsius = convertFahrenheitToCelsius(data.RealFeelTemperature.Minimum.Value) + " to " + convertFahrenheitToCelsius(data.RealFeelTemperature.Maximum.Value) + " °C";

                                    const conditionText = data.Day.IconPhrase;
                                    const windSpeedKph = data.Day.Wind ? data.Day.Wind.Speed.Value : 'N/A';
                                    const windDirection = data.Day.Wind ? data.Day.Wind.Direction.Localized : 'N/A';
                                    const pressureMb = data.Day.Pressure ? data.Day.Pressure.Value : 'N/A';
                                    const precipitationMm = data.Day.TotalLiquid ? data.Day.TotalLiquid.Value : 'N/A';
                                    const humidity = data.Day.RelativeHumidity !== undefined ? data.Day.RelativeHumidity : 'N/A';
                                    const cloudCover = data.Day.CloudCover !== undefined ? data.Day.CloudCover : 'N/A';
                                    const windGustKph = data.Day.WindGust ? data.Day.WindGust.Speed.Value : 'N/A';

                                    document.getElementById('temperature').textContent = `Temperature: ${temperatureCelsius}`;
                                    document.getElementById('feels-like').textContent = `Feels Like: ${feelsLikeCelsius}`;
                                    document.getElementById('condition').textContent = `Condition: ${conditionText}`;
                                    document.getElementById('wind-speed').textContent = `Wind Speed: ${windSpeedKph} kph`;
                                    document.getElementById('wind-direction').textContent = `Wind Direction: ${windDirection}`;
                                    document.getElementById('pressure').textContent = `Pressure: ${pressureMb} mb`;
                                    document.getElementById('precipitation').textContent = `Precipitation: ${precipitationMm} mm`;
                                    document.getElementById('humidity').textContent = `Humidity: ${humidity}%`;
                                    document.getElementById('cloud-cover').textContent = `Cloud Cover: ${cloudCover}%`;
                                    document.getElementById('wind-gust').textContent = `Wind Gust: ${windGustKph} kph`;

                                    const conditionIconName = getConditionIcon(conditionText);
                                    addWeatherIcon(conditionIconName);

                                    displayAlert('Weather data fetched successfully!', 'success');
                                } else {
                                    throw new Error('No weather data available');
                                }
                            });
                    } else {
                        throw new Error('City not found');
                    }
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                    displayAlert(error.message, 'error');
                });
        } else {
            displayAlert('Please enter a city name', 'error');
        }
    });

    function convertFahrenheitToCelsius(fahrenheit) {
        return ((fahrenheit - 32) * 5 / 9).toFixed(2);
    }

    function displayAlert(message, type) {
        const alertMessage = document.getElementById('alertMessage');
        alertMessage.textContent = message;
        alertMessage.className = `alert ${type}`;
        alertMessage.style.display = "block";

        setTimeout(() => {
            alertMessage.style.display = "none";
            alertMessage.classList.remove(type);
        }, 3000);
    }

    function getConditionIcon(conditionPhrase) {
        switch (conditionPhrase.toLowerCase()) {
            case 'sunny':
            case 'mostly sunny':
            case 'partly sunny':
            case 'intermittent clouds':
            case 'hazy sunshine':
            case 'partly cloudy':
            case 'fair (night)':
                return 'sun';
            case 'mostly cloudy':
            case 'cloudy':
            case 'dreary (overcast)':
                return 'cloud';
            case 'fog':
            case 'haze':
                return 'smog';
            case 'showers':
            case 'mostly cloudy w/ showers':
            case 'partly sunny w/ showers':
            case 'partly cloudy w/ showers (night)':
            case 'mostly cloudy w/ showers (day)':
                return 'cloud-showers-heavy';
            case 'rain':
            case 'mostly cloudy w/ t-storms (day)':
            case 'partly sunny w/ t-storms':
            case 'mostly cloudy w/ t-storms (night)':
            case 'partly cloudy w/ t-storms (night)':
            case 't-storms':
            case 'isolated t-storms':
            case 'scattered t-storms':
                return 'bolt';
            case 'flurries':
            case 'mostly cloudy w/ flurries':
            case 'mostly cloudy w/ flurries (night)':
            case 'mostly cloudy w/ flurries (day)':
            case 'scattered flurries':
            case 'snow showers':
                return 'snowflake';
            case 'snow':
            case 'mostly cloudy w/ snow':
            case 'partly sunny w/ snow':
            case 'mostly cloudy w/ snow (night)':
            case 'mostly cloudy w/ snow (day)':
            case 'scattered snow showers':
            case 'scattered snow':
            case 'heavy snow':
                return 'snowflake';
            default:
                return 'question'; // Default icon
        }
    }
    

    async function addWeatherIcon(iconName) {
        try {
            const { default: icon } = await import('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js');
            const iconElement = document.createElement('i');
            iconElement.classList.add('fas', `fa-${iconName}`, 'weather-icon');
            document.getElementById('weather-info').appendChild(iconElement);
        } catch (error) {
            console.error('Error loading weather icon:', error);
        }
    }
});
