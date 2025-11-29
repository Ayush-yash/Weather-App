// OpenWeatherMap API Configuration
const API_KEY = '9ee40c3c1134f9d3e5afe1f5b09978b5';
const ICON_URL = 'https://openweathermap.org/img/wn/';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const emptyState = document.getElementById('emptyState');
const weatherContent = document.getElementById('weatherContent');

// Weather data elements
const cityName = document.getElementById('cityName');
const weatherDescription = document.getElementById('weatherDescription');
const weatherIcon = document.getElementById('weatherIcon');
const temp = document.getElementById('temp');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const forecastList = document.getElementById('forecastList');
const aqiElement = document.getElementById('aqi');

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherByCity(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherByCity(city);
        }
    }
});

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherByCoords(lat, lon);
            },
            (error) => {
                hideLoading();
                showError('Unable to get your location. Please search manually.');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
});

// API Functions
async function fetchWeatherByCity(city) {
    showLoading();
    
    try {
        // Fetch current weather
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;
        const weatherResponse = await fetch(weatherUrl);
        
        if (!weatherResponse.ok) {
            throw new Error('City not found');
        }
        
        const weatherData = await weatherResponse.json();
        
        // Fetch 5-day forecast (free API)
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();
        
        // Fetch Air Quality Index
        const lat = weatherData.coord.lat;
        const lon = weatherData.coord.lon;
        const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        const aqiResponse = await fetch(aqiUrl);
        const aqiData = await aqiResponse.json();
        
        displayWeather(weatherData, forecastData, aqiData);
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showError(`Error: ${error.message}`);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        // Fetch current weather
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        
        // Fetch 5-day forecast using city name
        const city = weatherData.name;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();
        
        // Fetch Air Quality Index
        const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        const aqiResponse = await fetch(aqiUrl);
        const aqiData = await aqiResponse.json();
        
        displayWeather(weatherData, forecastData, aqiData);
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showError(`Error: ${error.message}`);
    }
}

// Display Functions
function displayWeather(weatherData, forecastData, aqiData) {
    // Update current weather
    cityName.textContent = weatherData.name;
    weatherDescription.textContent = weatherData.weather[0].description;
    weatherIcon.src = `${ICON_URL}${weatherData.weather[0].icon}@2x.png`;
    weatherIcon.alt = weatherData.weather[0].description;
    temp.textContent = weatherData.main.temp.toFixed(1);
    humidity.textContent = weatherData.main.humidity;
    windSpeed.textContent = weatherData.wind.speed.toFixed(1);
    
    // Format sunrise and sunset times
    const sunriseTime = new Date(weatherData.sys.sunrise * 1000);
    const sunsetTime = new Date(weatherData.sys.sunset * 1000);
    sunrise.textContent = formatTime(sunriseTime);
    sunset.textContent = formatTime(sunsetTime);
    
    // Display Air Quality Index
    if (aqiData && aqiData.list && aqiData.list[0]) {
        displayAQI(aqiData.list[0].main.aqi);
    }
    
    // Display forecast
    displayForecast(forecastData);
    
    // Show weather content
    emptyState.classList.add('hidden');
    weatherContent.classList.remove('hidden');
    
    // Clear input
    cityInput.value = '';
}

function displayForecast(forecastData) {
    forecastList.innerHTML = '';
    
    if (!forecastData || !forecastData.list) {
        return; // No forecast data available
    }
    
    // Group forecast by day (5-day forecast has 3-hour intervals)
    const dailyForecasts = {};
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();
        
        if (!dailyForecasts[dayKey]) {
            dailyForecasts[dayKey] = {
                temps: [],
                weather: item.weather[0],
                dt: item.dt
            };
        }
        dailyForecasts[dayKey].temps.push(item.main.temp);
    });
    
    // Display first 5 days
    Object.values(dailyForecasts).slice(0, 5).forEach(day => {
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const maxTemp = Math.round(Math.max(...day.temps));
        const minTemp = Math.round(Math.min(...day.temps));
        const avgTemp = Math.round(day.temps.reduce((a, b) => a + b, 0) / day.temps.length);
        
        forecastItem.innerHTML = `
            <div class="day">${dayName}</div>
            <img src="${ICON_URL}${day.weather.icon}@2x.png" alt="${day.weather.description}">
            <div class="temp-main">${avgTemp}°C</div>
            <div class="temps">${maxTemp}° / ${minTemp}°</div>
        `;
        
        forecastList.appendChild(forecastItem);
    });
}

// Utility Functions
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

function showLoading() {
    loadingSpinner.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    emptyState.classList.add('hidden');
    weatherContent.classList.add('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    emptyState.classList.add('hidden');
    weatherContent.classList.add('hidden');
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
        errorMessage.classList.add('hidden');
        emptyState.classList.remove('hidden');
    }, 5000);
}

// AQI Display Function
function displayAQI(aqiLevel) {
    const aqiLabels = {
        1: { text: 'Good', class: 'aqi-good' },
        2: { text: 'Fair', class: 'aqi-fair' },
        3: { text: 'Moderate', class: 'aqi-moderate' },
        4: { text: 'Poor', class: 'aqi-poor' },
        5: { text: 'Very Poor', class: 'aqi-very-poor' }
    };
    
    const aqi = aqiLabels[aqiLevel] || { text: 'Unknown', class: '' };
    aqiElement.textContent = aqi.text;
    aqiElement.className = 'aqi-value ' + aqi.class;
}

console.log('Weather App Loaded! API Key:', API_KEY ? 'Present ✓' : 'Missing ✗');
