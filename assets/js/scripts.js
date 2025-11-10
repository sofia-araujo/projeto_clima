const API_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

// Busca latitude/longitude e retorna um objeto com lat, lon, name e country
async function getCityCoordinates(cityName) {
    if (!cityName || !cityName.trim()) {
        throw new Error('Nome da cidade é obrigatório');
    }
    const url = `${API_BASE_URL}?name=${encodeURIComponent(cityName)}&count=1&language=pt&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro ao buscar coordenadas da cidade');
    const data = await res.json();
    if (!data.results || data.results.length === 0) throw new Error('Cidade não encontrada');
    const r = data.results[0];
    return { lat: r.latitude, lon: r.longitude, name: r.name, country: r.country };
}

// Busca o clima atual via Open-Meteo (current_weather)
async function getWeatherData(lat, lon) {
    const params = new URLSearchParams({ latitude: lat, longitude: lon, current_weather: 'true', timezone: 'auto' });
    const res = await fetch(`${WEATHER_API_URL}?${params}`);
    if (!res.ok) throw new Error('Erro ao buscar dados do clima');
    const data = await res.json();
    // Open-Meteo returns current_weather with {temperature, windspeed, weathercode, time}
    return data.current_weather || null;
}

function getWeatherDescription(code) {
    const map = {
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
    return map[code] || 'Condição desconhecida';
}

function getWeatherIcon(code) {
    // Map weather codes to weather-icons classes
    // Reference: Open-Meteo weather codes
    if (code === 0) return 'wi-day-sunny';
    if (code === 1) return 'wi-day-sunny';
    if (code === 2) return 'wi-day-cloudy';
    if (code === 3) return 'wi-cloud';
    if (code === 45 || code === 48) return 'wi-fog';
    if ([51,53,55,61,63,65,80,81,82].includes(code)) return 'wi-rain';
    if ([71,73,75,85,86].includes(code)) return 'wi-snow';
    if (code === 77) return 'wi-hail';
    if ([95,96,99].includes(code)) return 'wi-thunderstorm';
    return 'wi-na';
}

function formatDateTimeLocal(isoString) {
    // isoString expected like 'YYYY-MM-DDTHH:MM' or 'YYYY-MM-DDTHH:MM:SS'
    if (!isoString) return new Date().toLocaleString('pt-BR');
    // split date and time
    const parts = isoString.split('T');
    if (parts.length >= 2) {
        const date = parts[0].split('-'); // [YYYY,MM,DD]
        const time = parts[1].split(':'); // [HH,MM,...]
        const day = date[2];
        const month = date[1];
        const year = date[0];
        const hour = time[0];
        const minute = time[1] || '00';
        return `${day}/${month}/${year} ${hour}:${minute}`;
    }
    // fallback to locale formatting
    try {
        return new Date(isoString).toLocaleString('pt-BR');
    } catch (e) {
        return isoString;
    }
}

// Run browser-only interface code only when DOM is available
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
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
    // container pai para alternar visual (remover background quando mostrar apenas o painel)
    const container = document.querySelector('.container');

    // Função para mostrar o formulário de busca
    function showSearchForm() {
        searchForm.style.display = 'flex';
        weatherInfo.style.display = 'none';
        error.style.display = 'none';
        cityInput.value = '';
        // ao mostrar o formulário, exibir o título
        if (pageTitle) pageTitle.style.display = 'block';
        // restaurar visual do container pai
        if (container) container.classList.remove('no-bg');
    }

    // Função para esconder o formulário de busca
    function hideSearchForm() {
        searchForm.style.display = 'none';
    }

    // Evento de clique no botão voltar
    if (backBtn) backBtn.addEventListener('click', showSearchForm);

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

            // Buscar dados do clima (current_weather)
            const weather = await getWeatherData(cityData.lat, cityData.lon);
            if (!weather) throw new Error('Dados de clima indisponíveis');

            // Exibir resultados solicitados: cidade, país, temperatura e descrição
            const cityEl = document.getElementById('cityName');
            const tempEl = document.getElementById('temperature');
            const desc = getWeatherDescription(weather.weathercode);

            if (cityEl) cityEl.textContent = `${cityData.name}, ${cityData.country}`;
            if (tempEl) tempEl.textContent = `${Math.round(weather.temperature)}°C`;

            // criar/atualizar elemento de descrição (se existir no HTML, caso contrário criamos)
            let descEl = document.getElementById('description');
            if (!descEl) {
                descEl = document.createElement('div');
                descEl.id = 'description';
                descEl.className = 'weather-description';
                const current = document.querySelector('.current-weather');
                if (current) current.appendChild(descEl);
            }
            descEl.textContent = desc;

            // mostrar data/hora da consulta (usando o campo time retornado por Open-Meteo)
            let datetimeEl = document.getElementById('datetime');
            const formatted = formatDateTimeLocal(weather.time);
            if (!datetimeEl) {
                datetimeEl = document.createElement('div');
                datetimeEl.id = 'datetime';
                datetimeEl.className = 'datetime';
                if (cityEl && cityEl.parentNode) {
                    // inserir logo após o elemento cityEl
                    cityEl.insertAdjacentElement('afterend', datetimeEl);
                } else {
                    const info = document.getElementById('weatherInfo');
                    if (info) info.insertBefore(datetimeEl, info.firstChild);
                }
            }
            datetimeEl.textContent = `Atualizado em: ${formatted}`;

            // atualizar ou criar ícone de clima usando weather-icons
            let iconEl = document.getElementById('weatherIcon');
            const iconClass = getWeatherIcon(weather.weathercode);
            if (!iconEl) {
                iconEl = document.createElement('i');
                iconEl.id = 'weatherIcon';
                iconEl.className = `wi weather-icon ${iconClass}`;
                const current = document.querySelector('.current-weather');
                if (current) current.insertBefore(iconEl, current.firstChild);
            } else {
                // substituir classes preservando 'wi' e 'weather-icon'
                iconEl.className = `wi weather-icon ${iconClass}`;
            }

            loading.style.display = 'none';
            weatherInfo.style.display = 'block';
            // esconder título ao mostrar as informações
            if (pageTitle) pageTitle.style.display = 'none';
            // tornar o container pai visualmente invisível (manter layout)
            if (container) container.classList.add('no-bg');
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

}

// Export functions for unit tests (Node environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getCityCoordinates,
        getWeatherData,
        getWeatherDescription,
        getWeatherIcon,
        formatDateTimeLocal
    };
}