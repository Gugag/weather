 // Replace with your OpenWeatherMap API key
    const apiKey = "d80569366e57c4dc822965201a095ff6";

    const weatherForm = document.getElementById("weatherForm");
    const cityInput = document.getElementById("cityInput");
    const forecastTypeSelect = document.getElementById("forecastTypeSelect");
    const weatherDisplay = document.getElementById("weatherDisplay");

    // Separate divs for hourly and daily forecast
    const hourlyForecastDisplay = document.getElementById("hourlyForecastDisplay");
    const dailyForecastDisplay = document.getElementById("dailyForecastDisplay");

    // Listen for form submission
    weatherForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const city = cityInput.value.trim();
      const forecastType = forecastTypeSelect.value;  // "hourly" or "1"..."5"
      if (city !== "") {
        getWeather(city);
        getForecast(city, forecastType);
      }
    });

    // Fetch current weather data
    function getWeather(city) {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

      fetch(url)
        .then(response => response.json())
        .then(data => {
          if (data.cod === 200) {
            displayCurrentWeather(data);
          } else {
            weatherDisplay.innerHTML = `<p class="error">City not found. Please try again.</p>`;
          }
        })
        .catch(error => {
          console.error("Error fetching current weather:", error);
          weatherDisplay.innerHTML = `<p class="error">An error occurred. Please try again later.</p>`;
        });
    }

    // Display current weather
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

    // Fetch forecast data (3-hour intervals for up to 5 days)
    function getForecast(city, forecastType) {
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

      fetch(url)
        .then(response => response.json())
        .then(data => {
          if (data.cod === "200") {
            // Clear both hourly and daily sections
            hourlyForecastDisplay.innerHTML = "";
            dailyForecastDisplay.innerHTML = "";

            // If user selected "hourly", show next 24 hours
            if (forecastType === "hourly") {
              displayHourlyForecast(data);
            } 
            // Otherwise, parse the forecastType as an integer and show that many days
            else {
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
        .catch(error => {
          console.error("Error fetching forecast data:", error);
          hourlyForecastDisplay.innerHTML = `<p class="error">Error fetching forecast data.</p>`;
          dailyForecastDisplay.innerHTML = "";
        });
    }

    // Display next 24 hours (3-hour intervals)
    function displayHourlyForecast(data) {
      // data.list is in 3-hour increments, so the first 8 entries represent ~24 hours
      const next24Hours = data.list.slice(0, 8);

      let hourlyHTML = `<h2>Next 24-Hour Forecast</h2>`;
      hourlyHTML += `<div class="forecast-container">`;

      next24Hours.forEach(item => {
        const date = new Date(item.dt_txt);
        // e.g., "Thu 3 PM"
        const timeLabel = date.toLocaleString(undefined, {
          weekday: 'short',
          hour: 'numeric',
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

    // Display daily forecast (filtering items for 12:00:00) up to 'days'
    function displayDailyForecast(data, days) {
      const forecastItems = data.list.filter(item => item.dt_txt.includes("12:00:00"));
      const forecastToDisplay = forecastItems.slice(0, days);

      let forecastHTML = `<h2>${days}-Day Forecast</h2><div class="forecast-container">`;

      forecastToDisplay.forEach(item => {
        const date = new Date(item.dt_txt);
        const dayName = date.toLocaleDateString(undefined, { weekday: 'long' });
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
