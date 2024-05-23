import { initializeApp } from "firebase/app"
import { getDatabase, ref, push, onValue} from "firebase/database";

const key = import.meta.env.VITE_API_KEY;

// DOM Elements
const inputFieldEl = document.querySelector('.search-input');
const searchButtonEl = document.querySelector('.search-button');
const cityHeaderEl = document.querySelector('.city-header');

const conditionsEl = document.querySelector('.conditions');
const currentTempEl = document.querySelector('.current-temp');
const highTempEl = document.querySelector('.high-temp');
const lowTempEl = document.querySelector('.low-temp');
const feelsLikeEl = document.querySelector('.feels-like');
const windEl = document.querySelector('.wind');
const humidityEl = document.querySelector('.humidity');

const pastSearchesEl = document.querySelector('.past-searches');
const memoryButtonEl = document.querySelector('.memory-button');
const memoryListEl = document.querySelector('.memory-list');
const memoryModalEl = document.querySelector('#memoryModal');
const saveMemoryBtnEl = document.querySelector('#saveMemoryBtn');
const memoryNoteEl = document.querySelector('#memoryNote')

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

onValue(memoriesInDB, (snapshot) => {
    if (snapshot.exists()) {
        let memoriesArray = Object.entries(snapshot.val());
        memoriesArray.reverse();
        let render = '';
        for (const memory of memoriesArray) {
            const currentMemory = memory[1];
            render += `<li class='memory-item list-group-item'>
            <div><strong>City:</strong> ${currentMemory.city}</div>
            <div><strong>Conditions:</strong> ${currentMemory.conditions}</div>
            <div><strong>Date:</strong> ${currentMemory.timestamp}</div>
            <p><strong>Note:</strong> ${currentMemory.note}</p>
                       </li>`;
        }
        memoryListEl.innerHTML = render;
    }
});

const capitalizeFirstLetter = (string) => {
    if (!string) return string;
    return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
};


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
    if (cityHeaderEl.textContent.length == 0){
        alert("Please perform a search first!");
        return;
    }
    const modal = new bootstrap.Modal(memoryModalEl);
    modal.show();
})

saveMemoryBtnEl.addEventListener('click', () => {
    const city = cityHeaderEl.textContent;
    const conditions = `${currentTempEl.textContent}, ${conditionsEl.textContent}`;
    const note = memoryNoteEl.value;
    saveMemoryToFirebase(city, conditions, note);
})

// Functions

// Save Search to Local Storage and Render
function saveAndRenderSearch(city) {
    const newSearch = `${city}`;
    const index = pastSearches.indexOf(newSearch);
    if (index !== -1) {
        // Remove the duplicate entry from the array
        pastSearches.splice(index, 1);
    }
    pastSearches.unshift(`${city}`);
    if (pastSearches.length > 3) {
        pastSearches.pop();
    }
    localStorage.setItem('pastSearches', JSON.stringify(pastSearches));
    renderSearches();
}

// Perform Search
async function performSearch(city) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&units=imperial`;
    const locationUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${key}`
    try {
        const forecastResponse = await axios.get(forecastUrl);
        const forecastData = await forecastResponse.data;

        const locationResponse = await axios.get(locationUrl);
        const locationData = await locationResponse.data;

        updateUI(forecastData, locationData);
    } catch (error) {
        alert("Please enter a proper city name. If the wrong city is displayed, enter the city in the following format: Chicago, IL, US")
        console.error('Error:', error);
    }
}

// Update Weather UI
function updateUI(forecastData, locationData) {

    const lowTemp = forecastData.main.temp_min;
    const highTemp = forecastData.main.temp_max;
    const currentTemp = forecastData.main.temp;
    const currentConditions = capitalizeFirstLetter(forecastData.weather[0].description);
    const feelsLikeTemp = forecastData.main.feels_like;
    const windSpeed = forecastData.wind.speed;
    const humidity = forecastData.main.humidity;
    const city = locationData[0].name;
    const state = locationData[0].state;
    const country = locationData[0].country;
    
    renderHeader(city, state, country);
    renderWeatherData(currentConditions, currentTemp, highTemp, lowTemp, feelsLikeTemp, windSpeed, humidity);
    saveAndRenderSearch(city);
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

function renderWeatherData(currentConditions, currentTemp, highTemp, lowTemp, feelsLikeTemp, windSpeed, humidity) {
    conditionsEl.innerHTML = `${currentConditions}`;
    highTempEl.innerHTML = `${highTemp} F`;
    currentTempEl.innerHTML = `${currentTemp} F`;
    lowTempEl.innerHTML = `${lowTemp} F`;
    feelsLikeEl.innerHTML = `${feelsLikeTemp} F`;
    windEl.innerHTML = `${windSpeed} MPH`;
    humidityEl.innerHTML = `${humidity}%`;

}

async function saveMemoryToFirebase(city, conditions, note) {
    try {
        await push(memoriesInDB, {
            city,
            conditions,
            note,
            timestamp: new Date().toLocaleString()
        })
    } catch(error) {
        console.error('Error saving memory:', error);
    }
}