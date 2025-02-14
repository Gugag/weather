// Replace with your OpenWeatherMap API key
const apiKey = "d80569366e57c4dc822965201a095ff6";

const weatherForm = document.getElementById("weatherForm");
const cityInput = document.getElementById("cityInput");
const forecastTypeSelect = document.getElementById("forecastTypeSelect");
const weatherDisplay = document.getElementById("weatherDisplay");

// Separate divs for hourly and daily forecast
const hourlyForecastDisplay = document.getElementById("hourlyForecastDisplay");
const dailyForecastDisplay = document.getElementById("dailyForecastDisplay");

// Listen for form submission (manual city search)
weatherForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const city = cityInput.value.trim();
  const forecastType = forecastTypeSelect.value;
  if (city !== "") {
    getWeather(city);
    getForecast(city, forecastType);
  }
});

// Fetch current weather by city name
function getWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${apiKey}&units=metric`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.cod === 200) {
        displayCurrentWeather(data);
      } else {
        weatherDisplay.innerHTML = `<p class="error">City not found. Please try again.</p>`;
      }
    })
    .catch((error) => {
      console.error("Error fetching current weather:", error);
      weatherDisplay.innerHTML = `<p class="error">An error occurred. Please try again later.</p>`;
    });
}

// Display current weather information
function displayCurrentWeather(data) {
  const { name, main, weather } = data;
  const temp = Math.round(main.temp);
  const description = weather[0].description;
  const iconCode = weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  weatherDisplay.innerHTML = `
    <div class="current-weather">
      <h2>${name}</h2>
      <img src="${iconUrl}" alt="${description}" />
      <p class="temp">${temp}°C</p>
      <p class="description">${description}</p>
    </div>
  `;
}

// Fetch forecast by city name
function getForecast(city, forecastType) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
    city
  )}&appid=${apiKey}&units=metric`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.cod === "200") {
        // Clear previous displays
        hourlyForecastDisplay.innerHTML = "";
        dailyForecastDisplay.innerHTML = "";

        if (forecastType === "hourly") {
          displayHourlyForecast(data);
        } else if (forecastType === "next12") {
          displayForecastForNext12Hours(data);
        } else {
          const days = parseInt(forecastType, 10);
          if (!isNaN(days) && days >= 1 && days <= 5) {
            displayDailyForecast(data, days);
          }
        }
      } else {
        hourlyForecastDisplay.innerHTML = `<p class="error">Forecast data not found.</p>`;
        dailyForecastDisplay.innerHTML = "";
      }
    })
    .catch((error) => {
      console.error("Error fetching forecast data:", error);
      hourlyForecastDisplay.innerHTML = `<p class="error">Error fetching forecast data.</p>`;
      dailyForecastDisplay.innerHTML = "";
    });
}

// Display next 24-hour forecast (3-hour intervals) – existing function
function displayHourlyForecast(data) {
  const next24Hours = data.list.slice(0, 8);

  let hourlyHTML = `<h2>Next 24-Hour Forecast</h2>`;
  hourlyHTML += `<div class="forecast-container">`;

  next24Hours.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const timeLabel = date.toLocaleString(undefined, {
      weekday: "short",
      hour: "numeric",
      hour12: true,
    });
    const temp = Math.round(item.main.temp);
    const description = item.weather[0].description;
    const iconCode = item.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    hourlyHTML += `
      <div class="forecast-card">
        <h3>${timeLabel}</h3>
        <img src="${iconUrl}" alt="${description}" />
        <p class="temp">${temp}°C</p>
        <p class="description">${description}</p>
      </div>
    `;
  });

  hourlyHTML += `</div>`;
  hourlyForecastDisplay.innerHTML = hourlyHTML;
}

// Display forecast for the next 12 hours (in 3-hour intervals) starting from current time
function displayForecastForNext12Hours(data) {
  // Use the Unix timestamp (in milliseconds) for accurate comparisons
  const nowMs = Date.now();
  const twelveHoursLaterMs = nowMs + 12 * 60 * 60 * 1000;

  // Filter forecast items that fall between now and 12 hours from now
  const forecastForNext12 = data.list.filter((item) => {
    const forecastTimeMs = item.dt * 1000;
    return forecastTimeMs >= nowMs && forecastTimeMs <= twelveHoursLaterMs;
  });

  let forecastHTML = `<h2>Next 12 Hours Forecast</h2>`;
  forecastHTML += `<div class="forecast-container">`;

  if (forecastForNext12.length === 0) {
    forecastHTML += `<p>No forecast data available for the next 12 hours.</p>`;
  } else {
    forecastForNext12.forEach((item) => {
      const forecastTime = new Date(item.dt * 1000);
      const timeLabel = forecastTime.toLocaleString(undefined, {
        weekday: "short",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      const temp = Math.round(item.main.temp);
      const description = item.weather[0].description;
      const iconCode = item.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

      forecastHTML += `
        <div class="forecast-card">
          <h3>${timeLabel}</h3>
          <img src="${iconUrl}" alt="${description}" />
          <p class="temp">${temp}°C</p>
          <p class="description">${description}</p>
        </div>
      `;
    });
  }

  forecastHTML += `</div>`;
  // Here we use the same container as hourly forecast.
  hourlyForecastDisplay.innerHTML = forecastHTML;
}

// Display daily forecast (12:00:00 entries) for a specified number of days
function displayDailyForecast(data, days) {
  const forecastItems = data.list.filter((item) =>
    item.dt_txt.includes("12:00:00")
  );
  const forecastToDisplay = forecastItems.slice(0, days);

  let forecastHTML = `<h2>${days}-Day Forecast</h2><div class="forecast-container">`;

  forecastToDisplay.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dayName = date.toLocaleDateString(undefined, { weekday: "long" });
    const temp = Math.round(item.main.temp);
    const description = item.weather[0].description;
    const iconCode = item.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    forecastHTML += `
      <div class="forecast-card">
        <h3>${dayName}</h3>
        <img src="${iconUrl}" alt="${description}" />
        <p class="temp">${temp}°C</p>
        <p class="description">${description}</p>
      </div>
    `;
  });

  forecastHTML += `</div>`;
  dailyForecastDisplay.innerHTML = forecastHTML;
}

// New functions: Fetch weather and forecast by geographic coordinates
function getWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.cod === 200) {
        displayCurrentWeather(data);
      } else {
        weatherDisplay.innerHTML = `<p class="error">Unable to fetch weather for your location.</p>`;
      }
    })
    .catch((error) => {
      console.error("Error fetching weather by coordinates:", error);
      weatherDisplay.innerHTML = `<p class="error">An error occurred fetching weather data.</p>`;
    });
}

function getForecastByCoords(lat, lon, forecastType) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.cod === "200") {
        hourlyForecastDisplay.innerHTML = "";
        dailyForecastDisplay.innerHTML = "";

        if (forecastType === "hourly") {
          displayHourlyForecast(data);
        } else if (forecastType === "next12") {
          displayForecastForNext12Hours(data);
        } else {
          const days = parseInt(forecastType, 10);
          if (!isNaN(days) && days >= 1 && days <= 5) {
            displayDailyForecast(data, days);
          }
        }
      } else {
        hourlyForecastDisplay.innerHTML = `<p class="error">Unable to fetch forecast for your location.</p>`;
        dailyForecastDisplay.innerHTML = "";
      }
    })
    .catch((error) => {
      console.error("Error fetching forecast by coordinates:", error);
      hourlyForecastDisplay.innerHTML = `<p class="error">An error occurred fetching forecast data.</p>`;
      dailyForecastDisplay.innerHTML = "";
    });
}

// Automatically fetch weather based on user's current location on page load
document.addEventListener("DOMContentLoaded", function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        getWeatherByCoords(lat, lon);
        // Use the currently selected forecast type (default is "hourly", "next12", etc.)
        getForecastByCoords(lat, lon, forecastTypeSelect.value);
      },
      (error) => {
        console.error("Geolocation error:", error);
        // Optionally, display a message or fallback to a default location here.
      }
    );
  } else {
    console.error("Geolocation is not supported by your browser.");
  }
});
