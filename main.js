const electron = require('electron');

electron.app.whenReady().then(() => {
  let win = new electron.BrowserWindow({
    width: 171,
    height: 97,
    opacity: 0.75,
    alwaysOnTop: true,
    backgroundColor: '#0a0a0a',
    frame: false,
    resizable: false,
    show: false,
    webPreferences: {
      preload: require('path').join(__dirname, 'preload.js'),
    },
  });

  electron.ipcMain.on('devtools', () => {
    win.webContents.toggleDevTools();
  });

  win.setMenu(null);

  win.loadFile('index.html', {
    query: {
      'color': electron.systemPreferences.getAccentColor(),
    },
  });

  win.once('ready-to-show', () => {
    win.show();
  });
});
