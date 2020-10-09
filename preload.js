const { ipcRenderer } = require('electron');

window.toggleDevTools = () => ipcRenderer.send('devtools');
