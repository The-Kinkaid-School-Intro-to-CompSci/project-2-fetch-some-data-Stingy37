// things to do:
// [ NONE FOR NOW ]
// end of things to do

// create global variables
let temperature = [];
let precipitation = [];
let wind = [];
let text_overview = null;
let nws_api_url = 'https://api.weather.gov';
let opencage_api_key = '12bf5ff15bd544edb62e3a2df58265ed';   

// More global variables for image file paths (perhaps these should be constants??)
const filepath_hot_temp = '../assets/hot_temp.png';
const filepath_moderate_temp = '../assets/moderate_temp.webp';
const filepath_low_temp = '../assets/low_temp.webp';

const filepath_high_precip = '../assets/high_precip.webp';
const filepath_moderate_precip = '../assets/moderate_precip.png';
const filepath_low_precip = '../assets/low_precip.png';

const filepath_high_wind = '../assets/high_wind.png';
const filepath_moderate_wind = '../assets/moderate_wind.webp';
const filepath_low_wind = '../assets/low_wind.webp';
// End of global variables



// Function to update HTML elements with global variables created through info. retrieved from NWS API
function update_weather_info() {
    // clears previous HTML content so that it works for multiple usage 
    document.getElementById('forecast_temperature_content').innerHTML = '';
    document.getElementById('forecast_precipitation_content').innerHTML = '';
    document.getElementById('forecast_wind_content').innerHTML = '';
    document.getElementById('forecast_text_content').innerHTML = '';

    // Makes sure high temp/low temp are in correct indexes (high must be in 0, low must be in 1)
    if (temperature[1] > temperature[0]) {
        let low_temp = temperature[0];
        temperature[0] = temperature[1];
        temperature[1] = low_temp;
    }

    // updates corresponding HTML divs with weather information by using .innerHTML to write new HTML
    document.getElementById('forecast_temperature_content').innerHTML = `<p>High: ${temperature[0]} °F, Low: ${temperature[1]} °F</p>`;
    if (precipitation !== null){
        document.getElementById('forecast_precipitation_content').innerHTML = `<p>Precipitation: ${precipitation} %</p>`; 
    } else {
        document.getElementById('forecast_precipitation_content').innerHTML = `<p>Precipitation: 0%</p>`; 
    }
    document.getElementById('forecast_wind_content').innerHTML = `<p>Wind: ${wind}</p>`;
    document.getElementById('forecast_text_content').innerHTML = `<p>${text_overview}</p>`;

    // Update or change images depending on highest temperature (index 0) -> 3 conditions either high, moderate, or low
    if (temperature[0] > 80) {
        document.getElementById('temp_image').src = filepath_hot_temp;
    } else if (temperature[0] > 60) {
        document.getElementById('temp_image').src = filepath_moderate_temp;
    } else {
        document.getElementById('temp_image').src = filepath_low_temp;
    }

    // Precip
    if (precipitation > 70) {
        document.getElementById('precip_image').src = filepath_high_precip;
    } else if (precipitation > 30) {
        document.getElementById('precip_image').src = filepath_moderate_precip;
    } else {
        document.getElementById('precip_image').src = filepath_low_precip;
    }

    // Wind, Data from API is a string, so I need to extract relevant info (aka windspeed) from that before comparing 
    // Process = First join array into a single string, then use a function I found from stackoverflow which returns only integer values
    let wind_string = wind.join(" ");
    let wind_speed = find_int_in_str(wind_string);
    if (wind_speed > 25) {
        document.getElementById('wind_image').src = filepath_high_wind;
    } else if (wind_speed > 15) {
        document.getElementById('wind_image').src = filepath_moderate_wind;
    } else {
        document.getElementById('wind_image').src = filepath_low_wind;
    }
}

// Source -> https://stackoverflow.com/questions/17076030/how-can-i-find-int-values-within-a-string, modified a little for Javascript
function find_int_in_str(str) {
    clean = str.replace("\\D+", "");
    i = parseInt(clean);
    console.log('Windspeed with only integers:', i);

    return i;
}

// Uses another API (opencage) to convert a user's entered location into coordinates for NWS - it only accepts XY coordinates
// https://opencagedata.com/api
async function get_coordinates(location) {
    let opencage_url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${opencage_api_key}`;

    try {
        let api_response = await fetch(opencage_url);
        let opencage_json = await api_response.json();

        let latitude = opencage_json.results[0].geometry.lat;
        let longitude = opencage_json.results[0].geometry.lng;
            return { latitude, longitude };
        }

    catch (error) {
        console.error('Error', error);
    }
}

// Function to fetch grid forecast for a specific location (lat and long)
async function get_gridpoint_forecast(latitude, longitude) {
    try {

        const grindpoint_url = `${nws_api_url}/points/${latitude},${longitude}`;

        let grindpoint_response = await fetch(grindpoint_url);
        let gridpoint_json = await grindpoint_response.json();

        console.log('Gridpoint JSON:', gridpoint_json);

        let grid_forecast_url = gridpoint_json.properties.forecast;

        let forecast_response = await fetch(grid_forecast_url);
        let forecast_data = await forecast_response.json();

        console.log('Forecast Data:', forecast_data);

        return forecast_data;
    }
   catch (error) {
        console.error('Error', error);
    }
}

// Function to extract today's forecast from forecast data (which contains multiple days ) - after extracting, it updates the 
// wind, precip, and temp global variables so that it can be used in update_weather_info
function extract_today_forecast(forecast_data) {

    let todays_forecast = forecast_data.properties.periods[0];
    let tonights_forecast = forecast_data.properties.periods[1];

    // update temperature global variable
    temperature.push(todays_forecast.temperature);
    temperature.push(tonights_forecast.temperature);

    // update precipitation global variable
    precipitation.push(todays_forecast.probabilityOfPrecipitation.value);

    // update wind global variable
    wind.push(todays_forecast.windSpeed);
    wind.push(tonights_forecast.windSpeed);

    text_overview = todays_forecast.detailedForecast

    //                                    **** LATER ON - compare dates and find correct periods that way ****** //
    // console.log(new Date(todays_forecast.startTime));

    // let todays_date = new Date();
    // console.log('Todays Date:', todays_date)
    
}

async function form_submission_event(event) {
    event.preventDefault() 

    // Reset global variables for multiple uses
    temperature = [];
    precipitation = [];
    wind = [];
    text_overview = null;

    let location = document.getElementById('search_field').value;

    try{
        let lat_long = await get_coordinates(location);
        console.log('Latitude and Longitude:', lat_long)

        let forecast_data = await get_gridpoint_forecast(lat_long.latitude, lat_long.longitude);

        extract_today_forecast(forecast_data);
        update_weather_info();
    }

    catch(error) {
        console.error('Error', error)
    }
}


async function runProgram() {
    console.log('runProgram');

    document.getElementById('search_form').addEventListener('submit', form_submission_event);

}

document.addEventListener('DOMContentLoaded', runProgram);