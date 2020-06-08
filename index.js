const clock = document.getElementById('clock');
const closeButton = document.getElementById('closeButton');

const ipc = require('electron').ipcRenderer;

closeButton.onclick = () => window.close();

ipc.on('color', (e, color) => {
  console.log('got color', color);

  const style = document.createElement('style');
  style.innerHTML = `button:hover { background: #${color} }`;
  document.documentElement.append(style);
});

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

function refreshClock() {
  clock.innerText = new Date().toLocaleTimeString();
}

refreshClock();
setInterval(refreshClock, 1000);
