const clock = document.getElementById('clock');
const closeButton = document.getElementById('closeButton');

const ipc = require('electron').ipcRenderer;

closeButton.onclick = () => window.close();

document.onmousedown = (e) => {
  document.onmousemove = (e) => {

    ipc.send('moved', e.movementX, e.movementY);

    // console.log('mousemove', e.movementX, e.movementY);
  };
};

document.onmouseup = (e) => {
  document.onmousemove = null;
};

function refreshClock() {
  clock.innerText = new Date().toLocaleTimeString();
}

refreshClock();
setInterval(refreshClock, 1000);
