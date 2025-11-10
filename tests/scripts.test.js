const {
  getCityCoordinates,
  getWeatherData,
  getWeatherDescription
} = require('../assets/js/scripts.js');

describe('API functions', () => {
  beforeEach(() => {
    // reset mock
    global.fetch = jest.fn();
  });

  test('Nome de cidade válido retorna dados meteorológicos', async () => {
    // Mock geocoding response
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { latitude: -23.55, longitude: -46.63, name: 'São Paulo', country: 'Brazil' }
          ]
        })
      })
      // Mock weather response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ current_weather: { temperature: 25.4, weathercode: 63, time: '2025-11-10T15:00' } })
      });

    const city = await getCityCoordinates('São Paulo');
    expect(city).toHaveProperty('lat', -23.55);
    expect(city).toHaveProperty('lon', -46.63);
    expect(city).toHaveProperty('name', 'São Paulo');

    const weather = await getWeatherData(city.lat, city.lon);
    expect(weather).toHaveProperty('temperature');
    expect(typeof weather.temperature).toBe('number');
    expect(getWeatherDescription(weather.weathercode)).toMatch(/Chuva|Garoa|Chuva/);
  });

  test('Nome de cidade inexistente lança exceção tratada', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) });

    await expect(getCityCoordinates('CidadeInexistenteXyz')).rejects.toThrow('Cidade não encontrada');
  });

  test('Entrada vazia retorna erro de validação', async () => {
    await expect(getCityCoordinates('')).rejects.toThrow('Nome da cidade é obrigatório');
    await expect(getCityCoordinates('   ')).rejects.toThrow('Nome da cidade é obrigatório');
  });

  test('Falha da API gera resposta adequada (erro de rede / timeout)', async () => {
    // First, geocoding works
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ latitude: 0, longitude: 0, name: 'X', country: 'Y' }] }) });
    // Then the weather fetch fails (simulate network error)
    global.fetch.mockRejectedValueOnce(new Error('Network request failed'));

    const city = await getCityCoordinates('X');
    await expect(getWeatherData(city.lat, city.lon)).rejects.toThrow(/Network request failed/);

    // Also test non-ok response
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    await expect(getWeatherData(1, 1)).rejects.toThrow('Erro ao buscar dados do clima');
  });

  test('Limite de requisições da API excedido (429)', async () => {
    // geocoding works
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ latitude: 1, longitude: 1, name: 'A', country: 'B' }] }) });
    // weather API responds with 429
    global.fetch.mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({ message: 'Too Many Requests' }) });

    const city = await getCityCoordinates('A');
    await expect(getWeatherData(city.lat, city.lon)).rejects.toThrow('Erro ao buscar dados do clima');

    // also test geocoding limit
    global.fetch.mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({ message: 'Too Many Requests' }) });
    await expect(getCityCoordinates('B')).rejects.toThrow('Erro ao buscar coordenadas da cidade');
  });

  test('Conexão de rede lenta/instável (rejeição/timeout)', async () => {
    // geocoding works
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ latitude: 2, longitude: 2, name: 'C', country: 'D' }] }) });
    // weather fetch rejects simulating timeout
    global.fetch.mockRejectedValueOnce(new Error('timeout'));

    const city = await getCityCoordinates('C');
    await expect(getWeatherData(city.lat, city.lon)).rejects.toThrow(/timeout/);
  });

  test('Mudança inesperada no formato da resposta JSON', async () => {
    // geocoding returns valid coords
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ latitude: -10, longitude: 10, name: 'D', country: 'E' }] }) });
    // weather returns unexpected shape (no current_weather)
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ unexpected: true }) });

    const city = await getCityCoordinates('D');
    const weather = await getWeatherData(city.lat, city.lon);
    expect(weather).toBeNull();
  });
});
