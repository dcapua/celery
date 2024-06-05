import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const key = import.meta.env.VITE_API_KEY;

// DOM Elements
const inputFieldEl = document.querySelector('#searchInput');
const searchButtonEl = document.querySelector('#searchBtn');
const cityHeaderEl = document.querySelector('#cityHeader');

const mainDataContainers = document.querySelectorAll('.main-data-container');
const secondaryDataContainer = document.querySelector('#secondary-data-container');
const cityHeaderRow = document.querySelector('#city-header-row');
const conditionsEl = document.querySelector('#conditions');
const currentTempEl = document.querySelector('#currentTemp');
const highTempEl = document.querySelector('#highTemp');
const lowTempEl = document.querySelector('#lowTemp');
const feelsLikeEl = document.querySelector('#feelsLike');
const windEl = document.querySelector('#wind');
const humidityEl = document.querySelector('#humidity');

const pastSearchesEl = document.querySelector('#pastSearches');
const memoryButtonEl = document.querySelector('#memoryBtn');
const memoryListEl = document.querySelector('#memoryList');
const memoryModalEl = document.querySelector('#memoryModal');
const saveMemoryBtnEl = document.querySelector('#saveMemoryBtn');
const memoryNoteEl = document.querySelector('#memoryNote')

const whenSignedIn = document.querySelector('#whenSignedIn');
const whenSignedOut = document.querySelector('#whenSignedOut');
const signInBtn = document.querySelector('#signInBtn');
const signOutBtn = document.querySelector('#signOutBtn');
const userDetails = document.querySelector('#userDetails');

let pastSearches = [];
const pastSearchesFromLS = JSON.parse(localStorage.getItem('pastSearches'));

// Initialize past searches from localStorage
if (pastSearchesFromLS) {
    pastSearches = pastSearchesFromLS;
    renderSearches();
}

// Firebase setup
const firebaseConfig = {
    apiKey: "AIzaSyD5AqUt5eAigKC8v3bRrnCA7xPqlh1OnWM",
    authDomain: "playground-5e0a6.firebaseapp.com",
    databaseURL: "https://playground-5e0a6-default-rtdb.firebaseio.com",
    projectId: "playground-5e0a6",
    storageBucket: "playground-5e0a6.appspot.com",
    messagingSenderId: "371251362667",
    appId: "1:371251362667:web:0aebde19b65975751a6a2e"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// firestore
const db = getFirestore(app)
let memoriesRef;
let unsubscribe;

onAuthStateChanged(auth, user => {
    if (user) {
        saveMemoryBtnEl.onclick = async () => {
            try {
                const city = cityHeaderEl.textContent;
                const conditions = `${currentTempEl.textContent}, ${conditionsEl.textContent}`;
                const note = memoryNoteEl.value;

                memoriesRef = collection(db, 'memories');

                await addDoc(memoriesRef, {
                    uid: user.uid,
                    city: city,
                    conditions: conditions,
                    note: note,
                    createdAt: serverTimestamp()
                });

                console.log('Document successfully added!');
                memoryNoteEl.value = ''
            } catch (error) {
                console.error('Error adding document: ', error);
            }
        };

        // Set up the real-time listener for the authenticated user's memories
        const memoriesQuery = query(collection(db, 'memories'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));

        unsubscribe = onSnapshot(memoriesQuery, (querySnapshot) => {
            memoryListEl.innerHTML = ""; // Clear previous memories
            querySnapshot.forEach((doc) => {
                const memory = doc.data();
                const memoryElement = document.createElement('div');
                memoryElement.classList.add('list-group-item');
                const createdAt = memory.createdAt ? memory.createdAt.toDate().toLocaleString() : 'Unknown Date';
                memoryElement.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">${memory.city.split(', ')[0]}</h5>
                        <small class="text-body-secondary">${createdAt}</small>
                    </div>
                    <p class="mb-1">${memory.conditions}</p>
                    <p class="mb-1">${memory.note}</p>
                `;
                memoryListEl.appendChild(memoryElement);
            });
        }, (error) => {
            console.error('Error fetching real-time updates: ', error);
        });
    } else {
        console.log('User is not signed in');
        if (unsubscribe) {
            unsubscribe(); // Unsubscribe from the listener when the user signs out
        }
        memoryListEl.innerHTML = ``;
    }
});

const provider = new GoogleAuthProvider();

signInBtn.onclick = () => signInWithPopup(auth, provider);
signOutBtn.onclick = () => signOut(auth);

auth.onAuthStateChanged(user => {
    if (user) { // signed in
        whenSignedIn.hidden = false;
        whenSignedOut.hidden = true;
        signInBtn.hidden = true;
        signOutBtn.hidden = false;
        userDetails.innerHTML = `<p class = 'm-0'>${user.email} signed in</p>`
    } else { // signed out
        whenSignedIn.hidden = true;
        whenSignedOut.hidden = false;
        signInBtn.hidden = false;
        signOutBtn.hidden = true;
        userDetails.innerHTML = `<p class = 'm-0'>Sign in to write a memory!</p>`
    }
})

// needed because conditions from OpenWeatherMap aren't capitalized
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
        alert("Please perform a search first");
        return;
    }
    const modal = new bootstrap.Modal(memoryModalEl);
    modal.show();
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

    const lowTemp = Math.round(forecastData.main.temp_min);
    const highTemp = Math.round(forecastData.main.temp_max);
    const currentTemp = Math.round(forecastData.main.temp);
    const currentConditions = capitalizeFirstLetter(forecastData.weather[0].description);
    const feelsLikeTemp = Math.round(forecastData.main.feels_like);
    const windSpeed = Math.round(forecastData.wind.speed);
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
    cityHeaderRow.hidden = false;
    cityHeaderEl.innerHTML = `${city}, ${state}, ${country}`;
}

function renderWeatherData(currentConditions, currentTemp, highTemp, lowTemp, feelsLikeTemp, windSpeed, humidity) {
    mainDataContainers.forEach(container => {
        container.hidden = false;
    });
    secondaryDataContainer.hidden = false;

    conditionsEl.innerHTML = `${currentConditions}`;
    highTempEl.innerHTML = `${highTemp}°F`;
    currentTempEl.innerHTML = `${currentTemp}°F`;
    lowTempEl.innerHTML = `${lowTemp}°F`;
    feelsLikeEl.innerHTML = `${feelsLikeTemp}°F`;
    windEl.innerHTML = `${windSpeed} MPH`;
    humidityEl.innerHTML = `${humidity}%`;

}