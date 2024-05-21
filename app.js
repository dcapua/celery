import { initializeApp } from "firebase/app"
import { getDatabase, ref, push, onValue, remove } from "firebase/database";

const key = import.meta.env.VITE_API_KEY;

// DOM Elements
const inputFieldEl = document.querySelector('.search-input');
const searchButtonEl = document.querySelector('.search-button');
const currentTempEl = document.querySelector('.current-temp');
const highTempEl = document.querySelector('.high-temp');
const lowTempEl = document.querySelector('.low-temp');
const currentConditionsEl = document.querySelector('.conditions');
const pastSearchesEl = document.querySelector('.past-searches');
const cityHeaderEl = document.querySelector('.city-header');
const memoryButtonEl = document.querySelector('.memory-button')

let pastSearches = [];
const pastSearchesFromLS = JSON.parse(localStorage.getItem('pastSearches'));

// Initialize past searches from localStorage
if (pastSearchesFromLS) {
    pastSearches = pastSearchesFromLS;
    renderSearches();
}

// DB 
const firebaseConfig = {
    databaseURL: "https://playground-5e0a6-default-rtdb.firebaseio.com/"
}

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
let memoriesInDB = ref(database, "Memories");

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

// Save Search to Local Storage and Render
function saveAndRenderSearch(city, state, country) {
    pastSearches.unshift(`${city}, ${state}, ${country}`);
    if (pastSearches.length > 3) {
        pastSearches.pop();
    }
    localStorage.setItem('pastSearches', JSON.stringify(pastSearches));
    renderSearches();
}

// Perform Search
async function performSearch(cityName) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${key}&units=imperial`;
    try {
        const forecastResponse = await axios.get(forecastUrl);
        const forecastData = await forecastResponse.data;

        const lat = forecastData.coord.lat;
        const lon = forecastData.coord.lon;

        const locationUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&appid=${key}`;

        try {
            const locationResponse = await axios.get(locationUrl);
            const locationData = await locationResponse.data;
            updateUI(locationData, forecastData);
    
        } catch (error) {
            console.error('Error:', error);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

// Update Weather UI
function updateUI(locationData, forecastData) {

    const lowTemp = forecastData.main.temp_min;
    const highTemp = forecastData.main.temp_max;
    const currentTemp = forecastData.main.temp;
    const currentConditions = forecastData.weather[0].description;
    const city = locationData[0].name;
    const state = locationData[0].state;
    const country = locationData[0].country;

    renderHeader(city, state, country);
    renderCurrentTemp(currentTemp);
    renderHighTemp(highTemp);
    renderLowTemp(lowTemp);
    renderCurrentConditions(currentConditions);
    saveAndRenderSearch(city, state, country);
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
            performSearch(cityName);
        });
    });
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

function saveMemoryToFirebase(city, state, country) {
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
}