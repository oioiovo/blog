const { app, BrowserWindow } = require('electron')
const { fork } = require('node:child_process')
const path = require('node:path')

let serverProc = null

function startServer() {
  serverProc = fork(path.join(__dirname, 'server.mjs'), [], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  })
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    title: '博客管理后台',
    autoHideMenuBar: true,
  })
  await win.loadURL('http://localhost:3001')
}

app.whenReady().then(() => {
  startServer()
  // 等 server 起来
  setTimeout(createWindow, 1500)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  if (serverProc) serverProc.kill()
})
