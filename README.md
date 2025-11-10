# 🌤️ Projeto Clima

Um aplicativo web simples e intuitivo para consultar informações climáticas em tempo real de qualquer cidade do mundo.

## 📋 Descrição

O **Projeto Clima** permite aos usuários buscar informações meteorológicas de uma cidade digitando seu nome. A interface exibe a temperatura atual, descrição do clima e um ícone visual representando as condições meteorológicas.

## ✨ Funcionalidades

- 🔍 **Busca de cidade**: Digite o nome de qualquer cidade para obter dados climáticos
- 🌡️ **Temperatura em tempo real**: Exibe a temperatura atual em Celsius
- 🎨 **Descrição do clima**: Mostra o tipo de clima (céu limpo, chuva, neve, etc.)
- 🎭 **Ícones visuais**: Representação gráfica do clima usando a biblioteca Weather Icons
- ⏰ **Data e hora**: Exibe quando os dados foram atualizados
- 📱 **Design responsivo**: Interface com efeito glass (vidro fosco) e background personalizado
- 🟢 **Paleta de cores verde**: Design moderno com tons esverdeados
- ⬅️ **Botão voltar**: Permite retornar à busca facilmente

## 🛠️ Tecnologias Utilizadas

### Front-end
- **HTML5**: Estrutura semântica da página
- **CSS3**: Estilo com efeito glass, gradientes e animações
- **JavaScript**: Lógica de busca e manipulação do DOM

### APIs Externas
- **Open-Meteo Geocoding API**: Converte nome da cidade em coordenadas (latitude/longitude)
- **Open-Meteo Forecast API**: Obtém dados climáticos atuais

### Ícones
- **Weather Icons**: Biblioteca CDN para ícones climáticos

### Testes
- **Jest**: Framework de testes unitários com mocks de requisições HTTP

## 📁 Estrutura do Projeto

```
projeto_clima/
├── index.html                  # Página principal
├── package.json               # Dependências e scripts npm
├── README.md                  # Este arquivo
├── assets/
│   ├── css/
│   │   └── styles.css        # Estilos (glass effect, cores, responsive)
│   ├── img/
│   │   └── background.jpg    # Imagem de fundo
│   └── js/
│       └── scripts.js        # Lógica principal (com JSDoc)
└── tests/
    └── scripts.test.js       # Testes unitários com Jest
```

## 🚀 Como Usar

### 1. Instalar dependências

```bash
npm install
```

### 2. Abrir no navegador

Abra o arquivo `index.html` em seu navegador preferido (Chrome, Firefox, Safari, Edge).

Ou use um servidor local:

```bash
# Com Python 3
python -m http.server 8000

# Com Node.js (com live-server)
npx live-server
```

### 3. Buscar uma cidade

1. Digite o nome da cidade no campo de entrada
2. Clique no botão "Buscar" ou pressione Enter
3. Veja as informações climáticas aparecerem
4. Clique em "Voltar" para fazer outra busca

## 💻 Exemplo de Uso

```javascript
// Buscar coordenadas de uma cidade
const coords = await getCityCoordinates('São Paulo');
// Resultado: { lat: -23.5505, lon: -46.6333, name: 'São Paulo', country: 'Brasil' }

// Obter dados climáticos
const weather = await getWeatherData(-23.5505, -46.6333);
// Resultado: { temperature: 25, weathercode: 80, time: '2025-11-10T14:30', windspeed: 8 }

// Converter código de clima em descrição
const desc = getWeatherDescription(80);
// Resultado: 'Pancadas de chuva leves'

// Obter ícone para o clima
const icon = getWeatherIcon(80);
// Resultado: 'wi-rain'

// Formatar data/hora
const formatted = formatDateTimeLocal('2025-11-10T14:30');
// Resultado: '10/11/2025 14:30'
```

## 🧪 Testes

O projeto inclui testes unitários abrangentes usando Jest.

### Executar os testes

```bash
npm test
```

### Cobertura de testes

Os testes cobrem os seguintes cenários:

✅ Busca válida de uma cidade  
✅ Cidade não encontrada  
✅ Validação de entrada vazia  
✅ Falha na conexão com a API  
✅ Limite de requisições excedido (erro 429)  
✅ Conexão lenta/timeout  
✅ Resposta JSON com formato inesperado  

## 📖 Documentação das Funções

Todas as funções principais estão documentadas em **padrão JSDoc** no arquivo `assets/js/scripts.js`:

### `getCityCoordinates(cityName)`
Busca as coordenadas geográficas de uma cidade.

**Parâmetros:**
- `cityName` (string): Nome da cidade

**Retorna:**
- Promise com objeto: `{lat, lon, name, country}`

**Exceções:**
- Erro se a cidade não for encontrada
- Erro se o nome estiver vazio

### `getWeatherData(lat, lon)`
Busca os dados climáticos atuais de uma localização.

**Parâmetros:**
- `lat` (number): Latitude
- `lon` (number): Longitude

**Retorna:**
- Promise com objeto: `{temperature, weathercode, time, windspeed}`

**Exceções:**
- Erro se a API retornar uma resposta inválida

### `getWeatherDescription(code)`
Converte um código WMO em descrição textual.

**Parâmetros:**
- `code` (number): Código WMO do clima

**Retorna:**
- String com a descrição em português

### `getWeatherIcon(code)`
Mapeia um código WMO para uma classe de ícone.

**Parâmetros:**
- `code` (number): Código WMO do clima

**Retorna:**
- String com a classe CSS do ícone

### `formatDateTimeLocal(isoString)`
Formata uma data/hora ISO em padrão brasileiro.

**Parâmetros:**
- `isoString` (string): Data/hora em formato ISO

**Retorna:**
- String formatada em DD/MM/YYYY HH:MM

## 🎨 Design e Estilos

O projeto apresenta um design moderno com:

- **Glass Effect**: Painel de informações com efeito vidro fosco (backdrop-filter blur)
- **Background**: Imagem personalizada com sobreposição
- **Paleta de cores**: Tons esverdeados para botões, texto e ícones
- **Raindrop Overlay**: Textura sutil de gotas de chuva no painel
- **Sombras sutis**: Profundidade visual nos elementos
- **Responsivo**: Adapta-se a diferentes tamanhos de tela

## 🔧 Configuração de Cores Principais

| Elemento | Cor | Hex |
|----------|-----|-----|
| Ícone do clima | Verde escuro | `#0f5f3f` |
| Botão buscar | Verde | Gradiente esverdeado |
| Botão voltar | Verde | Gradiente esverdeado |
| Fundo do painel | Semitransparente | `rgba(255, 255, 255, 0.1)` |
| Texto de erro | Vermelho claro | `#ff6b6b` |

## 📊 Status do Projeto

- ✅ Funcionalidade completa
- ✅ Testes unitários (7/7 passando)
- ✅ Documentação JSDoc
- ✅ Design responsivo
- ✅ Tratamento de erros
- ✅ Validação de entrada

## 🐛 Tratamento de Erros

O aplicativo trata os seguintes erros com clareza:

- **"Cidade não encontrada. Tente novamente."** - Quando a cidade não existe no banco de dados
- **Mensagem de erro genérica** - Quando há problemas na conexão com a API
- Validação de campos vazios - O formulário não permite buscas sem nome de cidade

## 📝 Notas Importantes

- As coordenadas e dados climáticos são obtidos através de APIs gratuitas do Open-Meteo
- Não é necessário registrar chave de API
- A aplicação funciona offline após o carregamento (assets locais)
- Os dados climáticos são atualizados em tempo real a cada busca

## 🤝 Contribuições

Este é um projeto educacional. Sinta-se livre para:

- Melhorar o design
- Adicionar novas funcionalidades
- Otimizar o código
- Adicionar mais testes

## 📄 Licença

Este projeto é de código aberto e pode ser usado livremente.

## 👨‍💻 Desenvolvedor

**Sofia Araújo** - Projeto Clima  
Desenvolvido em Novembro de 2025

---

**Aproveite a consulta de clima!** 🌤️☀️🌧️❄️
