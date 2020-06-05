const electron = require('electron');

electron.app.whenReady().then(() => {
  let win = new electron.BrowserWindow({
    width: 800,
    height: 600,
    alwaysOnTop: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    },
  });

  electron.ipcMain.on('moved', (e, x, y) => {
    const [x1, y1] = win.getPosition();
    win.setPosition(x1 + x, y1 + y);
  });

  win.webContents.toggleDevTools();

  win.setMenu(null);
  win.loadFile('index.html');
});
