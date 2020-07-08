const clock = document.getElementById('clock');
const [closeButton] = document.getElementsByTagName('button');
const [input] = document.getElementsByTagName('textarea');
const helpBox = document.getElementById('help');
const container = document.getElementById('container');
const extras = document.getElementById('extras');


// Setup state

input.value = localStorage.getItem('format') ?? '[dddd]\n[MMMM Do]\n[h:mm:ss A]';

let hourlyWeatherData = null;
let halfDailyWeatherData = null;

let oldText;
let formatter;
let oldRect;
reformat();

let size = 24;

setupWindowsButtonColor();
refreshClock();
setInterval(refreshClock, 1000);




// Close button

closeButton.onclick = () => window.close();

window.onblur = () => {
  closeButton.hidden = true;
};

window.onfocus = () => {
  setTimeout(() => {
    closeButton.hidden = false;
  }, 0);
};

function setupWindowsButtonColor() {
  const color = new URLSearchParams(location.search).get('color');
  const style = document.createElement('style');
  style.nonce = 'clock';
  style.innerHTML = `button:hover { background: #${color} }`;
  document.documentElement.append(style);
}


// Drag to move

document.onmousedown = (e) => {
  if (e.target === closeButton || e.target === input) return;
  e.preventDefault();

  document.onmousemove = (e) => {
    e.preventDefault();
    window.moveBy(e.movementX, e.movementY);
  };

  document.onmouseup = (e) => {
    e.preventDefault();
    document.onmousemove = null;
    document.onmouseup = null;
  };
};


// Scroll to resize

document.onmousewheel = (e) => {
  if (e.target === clock) {
    const by = (e.deltaY > 0 ? -1 : 1) * 2;
    size += by;
    size = Math.max(size, 11);
    fixClockSize();
  }
};


// Auto sizing

function fixClockSize(skipMoveWindow) {
  if (!oldRect) {
    oldRect = clock.getBoundingClientRect();
    window.resizeTo(oldRect.width + 2, oldRect.height + 2);
    return;
  }

  clock.style.fontSize = size + 'pt';
  const rect = clock.getBoundingClientRect();

  const newWidth = Math.max(100, rect.width);
  const newHeight = Math.max(100, rect.height);

  const diffX = newWidth - oldRect.width;
  const diffY = newHeight - oldRect.height;

  window.resizeTo(clock.clientWidth + 2, container.clientHeight + 2);
  if (!skipMoveWindow) {
    window.moveBy(-diffX / 2, -diffY / 2);
  }

  oldRect = {
    width: newWidth,
    height: newHeight,
  };
}


// Display

document.onkeydown = (e) => {
  if (document.activeElement !== input) {
    // if (e.key === 'c') {
    //   e.preventDefault();
    //   document.body.classList.toggle('color');
    //   refreshClock();
    // }
  }

  if (e.keyCode === 27) {
    // Escape hides/shows the format field
    if (extras.hidden) {
      extras.hidden = false;
      input.focus();
      fixTextareaSize();
      fixClockSize(true);
    }
    else {
      extras.hidden = true;

      fixClockSize(true);
      refreshClock();
    }
  }
};

function refreshClock() {
  const newTime = formatter();
  if (oldText !== newTime) {
    oldText = newTime;
    clock.innerHTML = newTime;

    // for (const el of clock.getElementsByTagName('span')) {
    //   el.style.color = el.dataset['color'];
    // }
  }

  fixClockSize();
}

function interpretWeatherString(str) {
  if (!hourlyWeatherData || !halfDailyWeatherData) return '[...]';

  const mapping = {
    "n": () => halfDailyWeatherData.properties.periods[0].name,
    "tt": () => hourlyWeatherData.properties.periods[0].temperatureTrend,
    "tu": () => hourlyWeatherData.properties.periods[0].temperatureUnit,
    "t": () => hourlyWeatherData.properties.periods[0].temperature,
    "ws": () => hourlyWeatherData.properties.periods[0].windSpeed,
    "wd": () => hourlyWeatherData.properties.periods[0].windDirection,
    "i": () => `<img src="${hourlyWeatherData.properties.periods[0].icon}">`,
    "sf": () => hourlyWeatherData.properties.periods[0].shortForecast,
    "df": () => halfDailyWeatherData.properties.periods[0].detailedForecast,
  };

  const regex = new RegExp(Object.keys(mapping).join('|'), 'g');

  return str.replace(regex, (str) => {
    const fn = mapping[str];
    return fn();
  });
}

function reformat() {
  const formatFns = {
    text: (str) => str.replace(/\n/g, '<br>'),
    time: (str) => moment().format(str),
    weather: (str) => interpretWeatherString(str),
  };

  const str = input.value;
  const pairs = ['}', ...str.split(/(\{|\}|\[|\])/)];
  const chunks = [];
  const modes = {
    '[': 'time',
    '{': 'weather',
    ']': 'text',
    '}': 'text',
    'EOS': 'text',
  };

  for (let i = 0; i < pairs.length; i += 2) {
    chunks.push({
      type: modes[pairs[i]],
      str: pairs[i + 1],
    });
  }

  // format = format.replace('Happy Birthday, David!', '<span class="rainbow-text">$&</span>');

  formatter = () => {
    let html = '';
    for (const { type, str } of chunks) {
      html += formatFns[type](str);
    }
    return html;
  };

}

input.oninput = () => {
  localStorage.setItem('format', input.value);
  fixTextareaSize();
  reformat();
  refreshClock();
};

function fixTextareaSize() {
  input.style.height = '5px';
  input.style.height = input.scrollHeight + 'px';
}

fetch('https://api.weather.gov/points/42.3194,-88.4461').then(r => r.json()).then(json => {
  const hourlyUrl = json.properties.forecastHourly;
  const halfDailyUrl = json.properties.forecast;

  async function updateWeatherData() {
    console.log('refreshing weather data');

    const hourlyResult = await fetch(hourlyUrl);
    hourlyWeatherData = await hourlyResult.json();
    console.log(hourlyWeatherData);

    const halfDailyResult = await fetch(halfDailyUrl);
    halfDailyWeatherData = await halfDailyResult.json();
    console.log(halfDailyWeatherData);
  }

  updateWeatherData();
  setInterval(() => {
    updateWeatherData();
  }, 1000 * 60 /* refresh every minute */);
});
