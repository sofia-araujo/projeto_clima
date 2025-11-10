const API_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

async function getCityCoordinates(cityName) {
    try {
        const response = await fetch(`${API_BASE_URL}?name=${encodeURIComponent(cityName)}&count=1&language=pt&format=json`);
        
        if (!response.ok) {
            throw new Error('Erro ao buscar coordenadas da cidade');
        }

        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            throw new Error('Cidade não encontrada');
        }

        return {
            lat: data.results[0].latitude,
            lon: data.results[0].longitude,
            name: data.results[0].name,
            country: data.results[0].country
        };
    } catch (error) {
        throw error;
    }
}

async function getWeatherData(lat, lon) {
    try {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code',
            timezone: 'auto'
        });

        const response = await fetch(`${WEATHER_API_URL}?${params}`);
        
        if (!response.ok) {
            throw new Error('Erro ao buscar dados do clima');
        }

        const data = await response.json();
        return data.current;
    } catch (error) {
        throw error;
    }
}

function getWeatherDescription(weatherCode) {
    const descriptions = {
        0: 'Céu limpo',
        1: 'Predominantemente limpo',
        2: 'Parcialmente nublado',
        3: 'Nublado',
        45: 'Neblina',
        48: 'Neblina com geada',
        51: 'Garoa leve',
        53: 'Garoa moderada',
        55: 'Garoa intensa',
        61: 'Chuva leve',
        63: 'Chuva moderada',
        65: 'Chuva forte',
        71: 'Neve leve',
        73: 'Neve moderada',
        75: 'Neve forte',
        77: 'Granizo',
        80: 'Pancadas de chuva leves',
        81: 'Pancadas de chuva moderadas',
        82: 'Pancadas de chuva fortes',
        85: 'Pancadas de neve leves',
        86: 'Pancadas de neve fortes',
        95: 'Tempestade',
        96: 'Tempestade com granizo leve',
        99: 'Tempestade com granizo forte'
    };

    return descriptions[weatherCode] || 'Condição desconhecida';
}

// Interface
const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const weatherInfo = document.getElementById('weatherInfo');
const backBtn = document.getElementById('backBtn');
// referenciar o título principal para mostrar/ocultar quando necessário
const pageTitle = document.querySelector('h1');

// Função para mostrar o formulário de busca
function showSearchForm() {
    searchForm.style.display = 'flex';
    weatherInfo.style.display = 'none';
    error.style.display = 'none';
    cityInput.value = '';
    // ao mostrar o formulário, exibir o título
    if (pageTitle) pageTitle.style.display = 'block';
}

// Função para esconder o formulário de busca
function hideSearchForm() {
    searchForm.style.display = 'none';
}

// Evento de clique no botão voltar
backBtn.addEventListener('click', showSearchForm);

searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cityName = cityInput.value.trim();
    
    if (!cityName) {
        return;
    }

    // Limpar estados anteriores
    error.style.display = 'none';
    weatherInfo.style.display = 'none';
    loading.style.display = 'block';
    searchBtn.disabled = true;

    try {
        // Buscar coordenadas da cidade
        const cityData = await getCityCoordinates(cityName);
        
        // Buscar dados do clima
        const weatherData = await getWeatherData(cityData.lat, cityData.lon);

        // Exibir resultados
        document.getElementById('cityName').textContent = `${cityData.name}, ${cityData.country}`;
        document.getElementById('temperature').textContent = `${Math.round(weatherData.temperature_2m)}°C`;

    loading.style.display = 'none';
    weatherInfo.style.display = 'block';
    // esconder título ao mostrar as informações
    if (pageTitle) pageTitle.style.display = 'none';
    hideSearchForm();

    } catch (err) {
        loading.style.display = 'none';
        // Mostrar mensagem específica quando a cidade não for encontrada
        let message = 'Cidade não encontrada. Tente novamente.';
        if (err && err.message && !err.message.toLowerCase().includes('cidade')) {
            // para outros erros, mostramos a mensagem original ou fallback
            message = err.message || 'Erro ao buscar dados do clima. Tente novamente.';
        }
        error.textContent = message;
        error.style.display = 'block';
    } finally {
        searchBtn.disabled = false;
    }
});