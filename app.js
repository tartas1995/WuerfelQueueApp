const { app, BrowserWindow } = require('electron')
require(`${__dirname}/modules/Header/node/HeaderInterface`)

const isDev = true;
app.commandLine.appendSwitch('--ignore-certificate-errors')

app.on('ready', () => {
  let mainWindow = null
  let windowLoaded = false

  mainWindow = new BrowserWindow({
    center: true,
    height: 720,
    width: 1280,
    show: false,
    title: 'WürfelQueue App',
    backgroundColor: '#303030',
    webPreferences: {
      nodeIntegration: true,
    }
  })

  if (isDev) {
    mainWindow.openDevTools()
  }

  mainWindow.setMenu(null)
  mainWindow.loadURL(`file://${__dirname}/web/index.html`)

  mainWindow.webContents.on('did-finish-load', () => {
    windowLoaded = true
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
