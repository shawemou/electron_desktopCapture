const { app, BrowserWindow, Tray, ipcMain, dialog } = require('electron')
const path = require('path')

let mainWindow

app.on('window-all-closed', () => {
    if (process.platform != 'darwin') {
        app.quit()
    }
})

/**
 *默认情况下, 网页的 cookie 和缓存将存储在 userData(c:/user/admin/AppData) 目录下。
 * 如果要更改这个位置, 你需要在 app 模块中的  ready 事件被触发之前重写 userData 的路径。
 */
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


