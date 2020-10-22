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
let feastsForToday = null;
let feastCountryIndex = 46;

let oldText;
let formatter;
let oldRect;
reformat();

let size = 12;

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
  if (e.target.closest('#clock')) {
    const by = (e.deltaY > 0 ? -1 : 1) * 2;
    size += by;
    size = Math.max(size, 11);
    fixClockSize();
  }
};


// toggle devtools

window.addEventListener('keydown', (e) => {
  if (e.key === 'F12') {
    toggleDevTools();
  }
});



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

    for (const node of document.querySelectorAll('[data-width]')) {
      node.style.maxWidth = node.dataset.width;
    }

    for (const node of document.querySelectorAll('[data-size]')) {
      node.style.fontSize = (130 + (node.dataset.size * 30)) + '%';
    }

    // for (const el of clock.getElementsByTagName('span')) {
    //   el.style.color = el.dataset['color'];
    // }
  }

  fixClockSize();
}

function interpretWeatherString(str) {
  if (!hourlyWeatherData || !hourlyWeatherData.properties || !halfDailyWeatherData) return '[...]';

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

function useRomcal(str) {
  if (!feastsForToday) return '&lt;...&gt;';

  const country = Romcal.Countries[feastCountryIndex];

  const mapping = {
    "fd": () => `
      [
        <span class="change-feast-left">&larr;</span>
        <span class="change-feast-right">&rarr;</span>
      ]`.replace(/\n| {2,}/g, '') +
      `${upperCaseCountry(country)}: ${feastsForToday.map(feast => feast.name).join('\n')}`,
  };

  const regex = new RegExp(Object.keys(mapping).join('|'), 'g');

  return str.replace(regex, (str) => {
    const fn = mapping[str];
    return fn();
  });
}

function upperCaseCountry(c) {
  return (c.split(/([A-Z][a-z]+)/g)
    .filter(s => s.length > 0)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(' '));
}

window.addEventListener('click', (e) => {
  if (e.target.className === 'change-feast-left') {
    changeFeastDay(-1);
  }
  else if (e.target.className === 'change-feast-right') {
    changeFeastDay(1);
  }
});

function changeFeastDay(by) {
  feastCountryIndex += by;
  if (feastCountryIndex < 0) feastCountryIndex = Romcal.Countries.length - 1;
  else if (feastCountryIndex === Romcal.Countries.length) feastCountryIndex = 0;
  updateRomcalData();
}

function reformat() {
  const formatFns = {
    text: (str) => str.replace(/\n/g, '<br>'),
    time: (str) => moment().format(str),
    weather: (str) => interpretWeatherString(str),
    romcal: (str) => useRomcal(str),
  };

  const str = input.value;
  const pairs = ['}', ...str.split(/(\{|\}|\[|\]|<|>)/)];
  const chunks = [];
  const modes = {
    '[': 'time',
    '{': 'weather',
    '<': 'romcal',
    ']': 'text',
    '}': 'text',
    '>': 'text',
    'EOS': 'text',
  };

  for (let i = 0; i < pairs.length; i += 2) {

    let str = pairs[i + 1];
    let sizer = str.match(/^\++/);
    if (sizer) {
      sizer = sizer[0];
      str = str.substr(sizer.length);
      sizer = sizer.length;
      console.log(sizer);
    }

    chunks.push({
      sizer,
      type: modes[pairs[i]],
      str,
    });
  }

  // format = format.replace('Happy Birthday, David!', '<span class="rainbow-text">$&</span>');

  console.log(chunks)
  formatter = () => {
    let html = '';
    for (const { type, str, sizer } of chunks) {
      const sizing = str => sizer
        ? `<span data-size="${sizer}">${str}</span>`
        : str;
      html += sizing(formatFns[type](str));
    }
    console.log(html);
    return (html
      .replace(/\n/g, '<br>')
      .replace(/%(\d+)%(.+?)%%/g, '<span data-width="$1em" class="limit">$2</span>'));
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

function updateRomcalData() {
  console.log('refreshing romcal data');

  // This is sync and takes about 1s to run.
  const country = Romcal.Countries[feastCountryIndex];
  feastsForToday = Romcal.calendarFor({ country }, true).filter(date => date.moment.isSame(new Date(), 'day'));

  refreshClock();
}

// Run every hour
setInterval(updateRomcalData, 1000 * 60 * 60);
updateRomcalData();
