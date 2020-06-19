const ipc = require('electron').ipcRenderer;

const clock = document.getElementById('clock');
const closeButton = document.getElementById('closeButton');

closeButton.onclick = () => window.close();

const color = new URLSearchParams(location.search).get('color');
const style = document.createElement('style');
style.innerHTML = `button:hover { background: #${color} }`;
document.documentElement.append(style);

let size = 24;
const fixClockSize = () => {
  clock.style.fontSize = size + 'pt';
  const rect = clock.getBoundingClientRect();
  ipc.send('resized', {
    width: rect.width,
    height: rect.height,
  });
};
setTimeout(() => {
  fixClockSize();
}, 0);

/**@type{any}*/(document).onmousewheel = (e) => {
  const by = (e.deltaY > 0 ? -1 : 1) * 2;
  size += by;
  fixClockSize();
};

document.onmousedown = (e) => {
  if (e.target === closeButton) return;
  e.preventDefault();

  document.onmousemove = (e) => {
    e.preventDefault();
    ipc.send('moved', e.movementX, e.movementY);
  };
};

window.onblur = () => {
  closeButton.hidden = true;
};

window.onfocus = () => {
  setTimeout(() => {
    closeButton.hidden = false;
  }, 0);
};

document.onmouseup = (e) => {
  document.onmousemove = null;
};

let seconds = false;

clock.ondblclick = () => {
  seconds = !seconds;
  refreshClock();
  fixClockSize();
};

function refreshClock() {
  clock.innerText = new Date().toLocaleTimeString([], { timeStyle: seconds ? 'medium' : 'short' });
}

refreshClock();
setInterval(refreshClock, 1000);
