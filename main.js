const electron = require('electron');

function createWindow() {
  // Create the browser window.
  let win = new electron.BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
  });

  // and load the index.html of the app.
  win.loadFile('index.html');
};

electron.app.whenReady().then(createWindow);
