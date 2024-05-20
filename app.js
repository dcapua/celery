import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js"

const key = 'jLEvUxwMLZTRT1isLd2DmdvYr6tzafoB';

// DOM Elements
const inputFieldEl = document.querySelector('.search-input');
const searchButtonEl = document.querySelector('.search-button');
const currentTempEl = document.querySelector('.current-temp');
const highTempEl = document.querySelector('.high-temp');
const lowTempEl = document.querySelector('.low-temp');
const currentConditionsEl = document.querySelector('.conditions');
const pastSearchesEl = document.querySelector('.past-searches');
const cityHeaderEl = document.querySelector('.city-header');
const memoryButtonEl = document.querySelector('remember-button')

let pastSearches = [];
const pastSearchesFromLS = JSON.parse(localStorage.getItem('pastSearches'));

// DB 
const firebaseConfig = {
    databaseURL: "https://playground-5e0a6-default-rtdb.firebaseio.com/"
}
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)
const memoriesInDB = ref(database, "Memories")

// Initialize past searches from localStorage
if (pastSearchesFromLS) {
    pastSearches = pastSearchesFromLS;
    renderSearches();
}

// Event Listeners
inputFieldEl.addEventListener('keyup', (event) => {
    if (event.keyCode === 13) {
        searchButtonEl.click();
    }
});

searchButtonEl.addEventListener('click', () => {
    const cityName = inputFieldEl.value;
    if (!cityName) {
        alert('Please enter a city name');
        return;
    }
    
    performSearch(cityName);
    clearInputField();
});

memoryButtonEl.addEventListener('click', () => {
    const cityStateCountry = cityHeaderEl.textContent.split(', ');
    if (cityStateCountry.length === 3) {
        const [city, state, country] = cityStateCountry;
        saveMemoryToFirebase(city, state, country);
    } else {
        alert('Please perform a search first');
    }
})

// Functions

const saveMemoryToFirebase = (city, state, country) => {
    push(memoriesInDB, {
        city,
        state,
        country,
        timestamp: new Date().toISOString()
    })
    .then(() => {
        alert('Memory saved');
    })
    .catch((error) => {
        console.error('Error saving memory:', error);
    });
};

// Save Search to Local Storage and Render
function saveAndRenderSearch(city, state, country) {
    pastSearches.unshift(`${city}, ${state}, ${country}`);
    if (pastSearches.length > 3) {
        pastSearches.pop();
    }
    localStorage.setItem('pastSearches', JSON.stringify(pastSearches));
    renderSearches();
}

// Render Past Searches
function renderSearches() {
    let render = '';
    for (const query of pastSearches) {
        render += `<li class='past-search-item list-group-item'>${query}</li>`;
    }
    pastSearchesEl.innerHTML = render;
    addClickEventsToSearchItems();
}

// Add Click Events to Past Searches
function addClickEventsToSearchItems() {
    const searchItems = document.querySelectorAll('.past-search-item');
    searchItems.forEach(item => {
        item.addEventListener('click', (event) => {
            const cityName = event.target.textContent;
            // saveSearch(cityName);
            performSearch(cityName);
        });
    });
}

// Perform Search
async function performSearch(cityName) {
    const locationUrl = `http://dataservice.accuweather.com/locations/v1/cities/search?apikey=${key}&q=${cityName}`;
    try {
        const locationResponse = await axios.get(locationUrl);
        const locationData = locationResponse.data;

        if (locationData.length === 0) {
            alert('City not found.');
            return;
        }

        const locationKey = locationData[0].Key;
        const forecastUrl = `http://dataservice.accuweather.com/forecasts/v1/daily/1day/${locationKey}?apikey=${key}`;
        const currentConditionsUrl = `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${key}`;

        const [forecastResponse, currentConditionsResponse] = await Promise.all([
            axios.get(forecastUrl),
            axios.get(currentConditionsUrl)
        ]);

        const forecastData = await forecastResponse.json();
        const currentConditionsData = await currentConditionsResponse.json();

        updateUI(locationData, forecastData, currentConditionsData);

    } catch (error) {
        console.error('Error:', error);
    }
}

// Update Weather UI
function updateUI(locationData, forecastData, currentConditionsData) {

    const lowTemp = forecastData.DailyForecasts[0].Temperature.Minimum.Value;
    const highTemp = forecastData.DailyForecasts[0].Temperature.Maximum.Value;
    const currentTemp = currentConditionsData[0].Temperature.Imperial.Value;
    const currentConditions = currentConditionsData[0].WeatherText;
    const city = locationData[0].EnglishName;
    const state = locationData[0].AdministrativeArea.EnglishName;
    const country = locationData[0].Country.ID;

    renderHeader(city, state, country);
    renderCurrentTemp(currentTemp);
    renderHighTemp(highTemp);
    renderLowTemp(lowTemp);
    renderCurrentConditions(currentConditions);
    saveAndRenderSearch(city, state, country);
}

function clearInputField() {
    inputFieldEl.value = '';
}

function renderHeader(city, state, country) {
    cityHeaderEl.innerHTML = `${city}, ${state}, ${country}`;
}

function renderCurrentTemp(temp) {
    currentTempEl.innerHTML = `Current: ${temp} F`;
}

function renderHighTemp(temp) {
    highTempEl.innerHTML = `High: ${temp} F`;
}

function renderLowTemp(temp) {
    lowTempEl.innerHTML = `Low: ${temp} F`;
}

function renderCurrentConditions(conditions) {
    currentConditionsEl.innerHTML = `Conditions: ${conditions}`;
}