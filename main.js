const { app, BrowserWindow, Tray, ipcMain, dialog } = require('electron')
const path = require('path')

let mainWindow

app.on('window-all-closed', () => {
    if (process.platform != 'darwin') {
        app.quit()
    }
})

app.setPath('userData', __dirname + '/saved_recordings')

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 300,
        height: 115,
        frame: true,
        webPreferences: { nodeIntegration: true },
        backgroundColor: '#D6D8DC',
        // //是否隐藏菜单栏
        autoHideMenuBar: true
    })

    mainWindow.loadURL('file://' + __dirname + '/index.html')

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    //可做修改3:可以在打开软件的一瞬间隐藏(录屏无感)
    // mainWindow.hide()
    mainWindow.on('ready-to-show', () => {
        // mainWindow.hide()
    })


    //接收save-dialog指令
    ipcMain.on('save-dialog', (event) => {
        const options = {
            title: '保存录屏文件',
            filters: [
                { name: 'video', extensions: ['webm'] }
            ],
            defaultPath: "录屏.webm"
        }
        //发送saved-file指令
        dialog.showSaveDialog(mainWindow, options).then(result => {
            event.sender.send('saved-file', result)
        })
    })
})


