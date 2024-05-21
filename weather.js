document.addEventListener("DOMContentLoaded", function() {
    const apiKey = 'ca4113d28b1e440b94c53503242105';

    document.getElementById('get-weather-btn').addEventListener('click', function() {
        const city = document.getElementById('city-input').value;
        if (city) {
            const encodedCity = encodeURIComponent(city);
            const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodedCity}`;

            fetch(apiUrl)
                .then(response => {
                    return response.json().then(data => {
                        if (!response.ok) {
                            throw new Error(data.error.message);
                        }
                        return data;
                    });
                })
                .then(data => {
                    const temperatureCelsius = data.current.temp_c;
                    const feelsLikeCelsius = data.current.feelslike_c;
                    const conditionText = data.current.condition.text;
                    const windSpeedKph = data.current.wind_kph;
                    const windDirection = data.current.wind_dir;
                    const pressureMb = data.current.pressure_mb;
                    const precipitationMm = data.current.precip_mm;
                    const humidity = data.current.humidity;
                    const cloudCover = data.current.cloud;
                    const windGustMph = data.current.gust_mph;
                    const windGustKph = data.current.gust_kph;

                    document.getElementById('temperature').textContent = `Temperature: ${temperatureCelsius} °C`;
                    document.getElementById('feels-like').textContent = `Feels Like: ${feelsLikeCelsius} °C `;
                    document.getElementById('condition').textContent = `Condition: ${conditionText}`;
                    document.getElementById('wind-speed').textContent = `Wind Speed: ${windSpeedKph} kph`;
                    document.getElementById('wind-direction').textContent = `Wind Direction: ${windDirection}`;
                    document.getElementById('pressure').textContent = `Pressure: ${pressureMb} mb `;
                    document.getElementById('precipitation').textContent = `Precipitation: ${precipitationMm} mm `;
                    document.getElementById('humidity').textContent = `Humidity: ${humidity}%`;
                    document.getElementById('cloud-cover').textContent = `Cloud Cover: ${cloudCover}%`; 
                    document.getElementById('wind-gust').textContent = `Wind Gust: ${windGustMph} mph / ${windGustKph} kph`;

                    const conditionIconName = getConditionIcon(conditionText);
                    importWeatherIcon(conditionIconName);

                    displayAlert('Weather data fetched successfully!', 'success');
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                    displayAlert(error.message, 'error');
                });
        } else {
            displayAlert('Please enter a city name', 'error');
        }
    });
});

function displayAlert(message, type) {
    const alertMessage = document.getElementById('alertMessage');
    alertMessage.textContent = message;
    alertMessage.classList.add(type);
    alertMessage.style.display = "block";
  
    setTimeout(() => {
        alertMessage.style.display = "none";
        alertMessage.classList.remove(type);
    }, 3000);
}

function getConditionIcon(condition) {
    switch (condition.toLowerCase()) {
        case 'clear':
        case 'sunny':
            return 'sun';
        case 'partly cloudy':
            return 'cloud-sun';
        case 'cloudy':
        case 'overcast':
            return 'cloud';
        case 'mist':
        case 'fog':
        case 'freezing fog':
            return 'smog';
        case 'patchy rain possible':
        case 'patchy light drizzle':
        case 'patchy light rain':
        case 'patchy light snow':
        case 'light freezing rain':
        case 'patchy freezing drizzle possible':
            return 'cloud-rain';
        case 'patchy snow possible':
        case 'patchy sleet possible':
        case 'light sleet':
        case 'light snow':
        case 'patchy light snow with thunder':
            return 'snowflake';
        case 'blowing snow':
        case 'blizzard':
        case 'patchy heavy snow':
        case 'heavy snow':
        case 'moderate snow':
        case 'patchy moderate snow':
        case 'patchy heavy snow with thunder':
            return 'snowflake';
        case 'thundery outbreaks possible':
        case 'light rain shower':
        case 'moderate or heavy rain shower':
        case 'torrential rain shower':
        case 'light rain':
        case 'moderate rain at times':
        case 'moderate rain':
        case 'heavy rain at times':
        case 'heavy rain':
        case 'light drizzle':
        case 'moderate or heavy rain with thunder':
        case 'light rain shower':
        case 'moderate or heavy rain shower':
        case 'torrential rain shower':
            return 'cloud-showers-heavy';
        case 'ice pellets':
            return 'snowflake';
        case 'light rain shower':
        case 'light rain':
        case 'moderate or heavy rain shower':
        case 'moderate or heavy rain':
            return 'cloud-rain';
        case 'patchy light rain with thunder':
        case 'moderate or heavy rain with thunder':
            return 'poo-storm';
        default:
            return null;
    }
}

async function importWeatherIcon(iconName) {
    try {
        const { default: icon } = await import(`https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js`);
        const iconElement = document.createElement('i');
        iconElement.classList.add('fas', `fa-${iconName}`, 'weather-icon');
        document.getElementById('weather-info').appendChild(iconElement);
    } catch (error) {
        console.error('Error loading weather icon:', error);
    }
}
