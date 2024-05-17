const key = 'jLEvUxwMLZTRT1isLd2DmdvYr6tzafoB';
const inputFieldEl = document.querySelector('#search-input');
const searchButtonEl = document.querySelector('#search-button');
const currentTempEl = document.querySelector('.current-temp');
const highTempEl = document.querySelector('.high-temp');
const lowTempEl = document.querySelector('.low-temp');
const currentConditionsEl = document.querySelector('.conditions');
const pastSearchesEl = document.querySelector('.past-searches');

// if localStorage has past searches, display them below

inputFieldEl.addEventListener('keyup', function(event) {
    if (event.keyCode === 13) { // Check if Enter key is pressed (keyCode 13)
      searchButtonEl.click(); // Simulate clicking the search button
    }
});


searchButtonEl.addEventListener('click', async() => {
    const cityName = inputFieldEl.value;
    if (!cityName) {
        alert('Please enter a city name');
        return;
    }

    saveSearch(cityName);

    const locationUrl = `http://dataservice.accuweather.com/locations/v1/cities/search?apikey=${key}&q=${cityName}`
    try {
        const locationResponse = await axios.get(locationUrl);
        const locationData = locationResponse.data;

        if (locationData.length === 0) {
            weatherInfo.textContent = 'City not found.';
            return;
        }

        const locationKey = locationData[0].Key;
        const forecastUrl = `http://dataservice.accuweather.com/forecasts/v1/daily/1day/${locationKey}?apikey=${key}`;
        const currentConditionsUrl = `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${key}`;

        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();
        const currentConditionsResponse = await fetch(currentConditionsUrl);
        const currentConditionsData = await currentConditionsResponse.json();

        const lowTemp = forecastData.DailyForecasts[0].Temperature.Minimum.Value;
        const highTemp = forecastData.DailyForecasts[0].Temperature.Maximum.Value;
        const currentTemp = currentConditionsData[0].Temperature.Imperial.Value;
        const currentConditions = currentConditionsData[0].WeatherText;

        currentTempEl.innerHTML = `Current: ${currentTemp} F`;
        highTempEl.innerHTML = `High: ${highTemp} F`;
        lowTempEl.innerHTML = `Low: ${lowTemp} F`;
        currentConditionsEl.innerHTML = `Conditions: ${currentConditions}`;

    } catch(error) {
        console.error('Error: ',error);
    }

    clearInputField();

})

function saveSearch(query) {
    let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    recentSearches.unshift(query)
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    pastSearchesEl.innerHTML = ''
    for (const search of recentSearches) {
        pastSearchesEl.innerHTML += `<li>${search}</li>`
    }
}

function clearInputField() {
    inputFieldEl.value = ''
}