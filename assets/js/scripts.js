const API_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Busca as coordenadas geográficas de uma cidade usando a API de geocodificação Open-Meteo.
 * 
 * @async
 * @function getCityCoordinates
 * @param {string} cityName - Nome da cidade a ser buscada (obrigatório, não vazio).
 * @returns {Promise<Object>} Objeto contendo as coordenadas e informações da cidade.
 * @returns {number} return.lat - Latitude da cidade.
 * @returns {number} return.lon - Longitude da cidade.
 * @returns {string} return.name - Nome oficial da cidade retornado pela API.
 * @returns {string} return.country - País onde a cidade se localiza.
 * 
 * @throws {Error} Lança erro se o nome da cidade estiver vazio ou não tiver sido fornecido.
 * @throws {Error} Lança erro se a resposta da API não for bem-sucedida (status !ok).
 * @throws {Error} Lança erro se nenhum resultado foi encontrado para a cidade informada.
 * 
 * @example
 * try {
 *   const coords = await getCityCoordinates('São Paulo');
 *   console.log(coords);
 *   // Output: { lat: -23.5505, lon: -46.6333, name: 'São Paulo', country: 'Brasil' }
 * } catch (err) {
 *   console.error(err.message); // ex: 'Cidade não encontrada'
 * }
 */
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

/**
 * Busca os dados do clima atual de uma localização usando a API de previsão Open-Meteo.
 * 
 * @async
 * @function getWeatherData
 * @param {number} lat - Latitude da localização (requerida).
 * @param {number} lon - Longitude da localização (requerida).
 * @returns {Promise<Object|null>} Objeto com os dados do clima atual ou null se indisponível.
 * @returns {number} return.temperature - Temperatura atual em graus Celsius.
 * @returns {number} return.weathercode - Código WMO do tipo de tempo (ex: 0 = céu limpo, 80 = chuva).
 * @returns {string} return.time - Data e hora no formato ISO (ex: '2025-11-10T14:30').
 * @returns {number} return.windspeed - Velocidade do vento em km/h.
 * 
 * @throws {Error} Lança erro se a resposta da API não for bem-sucedida (status !ok).
 * 
 * @example
 * try {
 *   const weather = await getWeatherData(-23.5505, -46.6333);
 *   console.log(weather);
 *   // Output: { temperature: 25, weathercode: 1, time: '2025-11-10T14:30', windspeed: 8 }
 * } catch (err) {
 *   console.error(err.message); // ex: 'Erro ao buscar dados do clima'
 * }
 */
async function getWeatherData(lat, lon) {
    const params = new URLSearchParams({ latitude: lat, longitude: lon, current_weather: 'true', timezone: 'auto' });
    const res = await fetch(`${WEATHER_API_URL}?${params}`);
    if (!res.ok) throw new Error('Erro ao buscar dados do clima');
    const data = await res.json();
    // Open-Meteo returns current_weather with {temperature, windspeed, weathercode, time}
    return data.current_weather || null;
}

/**
 * Obtém a previsão diária para os próximos 5 dias (incluindo o dia atual) usando a API Open-Meteo.
 *
 * @async
 * @function get5DayForecast
 * @param {number} lat - Latitude da localização (requerida).
 * @param {number} lon - Longitude da localização (requerida).
 * @returns {Promise<Object|null>} Objeto `daily` retornado pela API contendo arrays com as datas e valores:
 *  - `time` (string[]) - datas no formato 'YYYY-MM-DD'
 *  - `temperature_2m_max` (number[]) - temperatura máxima diária em °C
 *  - `temperature_2m_min` (number[]) - temperatura mínima diária em °C
 *  - `weathercode` (number[]) - códigos WMO para o tipo de tempo de cada dia
 *  Retorna `null` se a propriedade `daily` não estiver presente na resposta.
 *
 * @throws {Error} Lança erro se a resposta da API não for bem-sucedida (status !ok).
 *
 * @example
 * try {
 *   const forecast = await get5DayForecast(-23.5505, -46.6333);
 *   // forecast.time => ['2025-11-10','2025-11-11', ...]
 *   // forecast.temperature_2m_max => [26, 27, ...]
 * } catch (err) {
 *   console.error(err.message);
 * }
 */
async function get5DayForecast(lat, lon) {
    // calcula as datas de início e fim (5 dias incluindo hoje)
    const today = new Date();
    const startDate = today.toISOString().slice(0, 10);
    const end = new Date(today);
    end.setDate(end.getDate() + 4); // +4 para totalizar 5 dias (hoje + 4 dias seguintes)
    const endDate = end.toISOString().slice(0, 10);

    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        daily: 'temperature_2m_max,temperature_2m_min,weathercode',
        timezone: 'auto',
        start_date: startDate,
        end_date: endDate
    });

    const res = await fetch(`${WEATHER_API_URL}?${params}`);
    if (!res.ok) throw new Error('Erro ao buscar previsão de 5 dias');
    const data = await res.json();
    return data.daily || null;
}

/**
 * Converte um código WMO de tipo de tempo em uma descrição textual em português.
 * 
 * @function getWeatherDescription
 * @param {number} code - Código WMO do tipo de tempo (ex: 0 = céu limpo, 80 = chuva leve).
 * @returns {string} Descrição em português do tipo de tempo. Retorna 'Condição desconhecida' se o código não for mapeado.
 * 
 * @example
 * const desc = getWeatherDescription(80);
 * console.log(desc); // Output: 'Pancadas de chuva leves'
 * 
 * const unknown = getWeatherDescription(999);
 * console.log(unknown); // Output: 'Condição desconhecida'
 */
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

/**
 * Converte um código WMO de tipo de tempo em uma classe de ícone da biblioteca Weather Icons.
 * 
 * @function getWeatherIcon
 * @param {number} code - Código WMO do tipo de tempo (ex: 0 = céu limpo, 80 = chuva leve).
 * @returns {string} Classe CSS do ícone Weather Icons correspondente (ex: 'wi-rain', 'wi-snow').
 *                   Retorna 'wi-na' (não disponível) se o código não for mapeado.
 * 
 * @example
 * const iconClass = getWeatherIcon(80);
 * console.log(iconClass); // Output: 'wi-rain'
 * 
 * // Uso prático no HTML:
 * // <i class="wi weather-icon wi-rain"></i>
 */
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

/**
 * Formata uma string de data/hora ISO em formato legível em português brasileiro (DD/MM/YYYY HH:MM).
 * 
 * @function formatDateTimeLocal
 * @param {string} isoString - String de data/hora no formato ISO (ex: '2025-11-10T14:30' ou '2025-11-10T14:30:45').
 *                             Se vazio ou inválido, retorna a data/hora atual formatada.
 * @returns {string} Data e hora formatadas no padrão brasileiro (ex: '10/11/2025 14:30').
 * 
 * @example
 * const formatted = formatDateTimeLocal('2025-11-10T14:30');
 * console.log(formatted); // Output: '10/11/2025 14:30'
 * 
 * const current = formatDateTimeLocal('');
 * console.log(current); // Output: (data/hora atual formatada, ex: '10/11/2025 15:45')
 */
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
                // inserir após a descrição do clima
                let descEl = document.getElementById('description');
                if (descEl && descEl.parentNode) {
                    descEl.insertAdjacentElement('afterend', datetimeEl);
                } else {
                    const current = document.querySelector('.current-weather');
                    if (current) current.appendChild(datetimeEl);
                }
            }
            datetimeEl.textContent = `${formatted}`;

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

            // Obter e exibir previsão dos próximos 5 dias (inclui hoje)
            try {
                const daily = await get5DayForecast(cityData.lat, cityData.lon);
                // criar ou limpar container de forecast
                let forecastEl = document.getElementById('forecast5');
                if (!forecastEl) {
                    forecastEl = document.createElement('div');
                    forecastEl.id = 'forecast5';
                    forecastEl.className = 'forecast-5day';
                    const info = document.getElementById('weatherInfo');
                    const backButtonEl = document.getElementById('backBtn');
                    // preferir inserir a previsão antes do botão "Voltar" para melhor organização
                    if (info && backButtonEl && backButtonEl.parentNode === info) {
                        info.insertBefore(forecastEl, backButtonEl);
                    } else if (info) {
                        info.appendChild(forecastEl);
                    }
                } else {
                    forecastEl.innerHTML = '';
                }

                if (daily && Array.isArray(daily.time) && daily.time.length) {
                    // Adicionar título "Próximos dias"
                    const titleEl = document.createElement('h3');
                    titleEl.className = 'forecast-title';
                    titleEl.textContent = 'Próximos dias';
                    forecastEl.appendChild(titleEl);

                    const list = document.createElement('ul');
                    list.className = 'forecast-list';
                    for (let i = 0; i < daily.time.length; i++) {
                            const isoDate = daily.time[i]; // 'YYYY-MM-DD'
                            const [yy, mm, dd] = isoDate.split('-');
                            const formattedDate = `${dd}/${mm}/${yy}`;
                            // obter dia da semana em português (seg, ter, ...)
                            const dateObj = new Date(Number(yy), Number(mm) - 1, Number(dd));
                            const weekdays = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
                            const weekday = weekdays[dateObj.getDay()];
                            // converter para PascalCase (ex: 'segunda-feira' -> 'SegundaFeira')
                            const partsForPascal = weekday.split(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9]+/);
                            const weekdayPascal = partsForPascal.map(p => p ? (p.charAt(0).toLocaleUpperCase('pt-BR') + p.slice(1)) : '').join(' ');
                        const tmin = Math.round(daily.temperature_2m_min[i]);
                        const tmax = Math.round(daily.temperature_2m_max[i]);
                        const li = document.createElement('li');
                        li.className = 'forecast-item';

                        // Left: weekday above date
                        const left = document.createElement('div');
                        left.className = 'forecast-left';
                        const wd = document.createElement('div');
                        wd.className = 'forecast-weekday';
                        wd.textContent = weekdayPascal;
                        const dt = document.createElement('div');
                        dt.className = 'forecast-date';
                        dt.textContent = formattedDate;
                        left.appendChild(wd);
                        left.appendChild(dt);

                        // Center: icon + description
                        const center = document.createElement('div');
                        center.className = 'forecast-center';
                        const code = Array.isArray(daily.weathercode) ? daily.weathercode[i] : null;
                        const iconClass = (typeof getWeatherIcon === 'function' && code !== null) ? getWeatherIcon(code) : 'wi-na';
                        const iconEl = document.createElement('i');
                        iconEl.className = `wi forecast-icon ${iconClass}`;
                        iconEl.setAttribute('aria-hidden', 'true');
                        const descElDay = document.createElement('div');
                        descElDay.className = 'forecast-desc';
                        descElDay.textContent = getWeatherDescription(code);
                        center.appendChild(iconEl);
                        center.appendChild(descElDay);

                        // Right: max above min (stacked)
                        const right = document.createElement('div');
                        right.className = 'forecast-right';
                        const maxEl = document.createElement('div');
                        maxEl.className = 'temp-max';
                        maxEl.textContent = `${tmax}°C`;
                        const minEl = document.createElement('div');
                        minEl.className = 'temp-min';
                        minEl.textContent = `${tmin}°C`;
                        right.appendChild(maxEl);
                        right.appendChild(minEl);

                        // assemble
                        li.appendChild(left);
                        li.appendChild(center);
                        li.appendChild(right);
                        list.appendChild(li);
                    }
                    forecastEl.appendChild(list);
                }
            } catch (e) {
                // não interrompe exibição principal; loga em console para debug
                // eslint-disable-next-line no-console
                console.warn('Erro ao obter previsão de 5 dias', e);
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
        formatDateTimeLocal,
        get5DayForecast
    };
}