const electron = require('electron');
const path = require('path');

electron.app.whenReady().then(() => {
  let win = new electron.BrowserWindow({
    width: 171,
    height: 97,
    alwaysOnTop: true,
    backgroundColor: '#0a0a0a',
    frame: false,
    resizable: false,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });

  electron.ipcMain.on('moved', (e, x, y) => {
    const [x1, y1] = win.getPosition();
    win.setPosition(x1 + x, y1 + y);
  });

  electron.ipcMain.on('resized', (e, size) => {
    if (size.width === 0 && size.height === 0) return;

    const rect = win.getBounds();

    const newWidth = Math.round(size.width * 1.5);
    const newHeight = Math.round(size.height * 2.25);

    const offsetX = Math.round((rect.width - newWidth) / 2);
    const offsetY = Math.round((rect.height - newHeight) / 2);

    rect.x += offsetX;
    rect.y += offsetY;
    rect.width = newWidth;
    rect.height = newHeight;

    win.setBounds(rect);
  });

  // win.webContents.toggleDevTools();

  win.setMenu(null);
  win.loadFile('index.html', {
    query: {
      'color': electron.systemPreferences.getAccentColor(),
    },
  });
});
