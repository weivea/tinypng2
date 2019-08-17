const path = require('path');
const fs = require('fs')
const { app, BrowserWindow, ipcMain } = require('electron')
const eventName = require('./eventName.js')

const express = require('express')
const fileUpload = require('express-fileupload');
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();


let eventTmp;
let resultTmp

const sever = express()
sever.use(fileUpload());

sever.post('/upload', function(req, res) {
  console.log('file.name >>>', req.files.file.name); // eslint-disable-line
  (async function (dataBuffer) {
    let event = await getEvent()
    let result = await getResult(event, dataBuffer)
    if(result === eventName.ERROR) {
      event = await getEvent()
      result = await getResult(event, dataBuffer)
    }
    return result
  })(req.files.file.data).then((re)=>{
    res.send(re)
  }).catch((err)=>{
    res.send(err)
  })
});

sever.listen(7256)

ipcMain.on(eventName.PAGE_READY, (event, arg) => {
  console.log('page ready') 
  console.log(eventName.SEVER_READY)
  eventTmp = event;
  myEmitter.emit(eventName.PAGE_READY)
})

ipcMain.on(eventName.RESPONSE, (event, arg) => {
  console.log(arg)
  resultTmp = arg;
  myEmitter.emit(eventName.RESPONSE)

})

// 出现ERROR时，一般都是次数达到上限，刷新一下页面
ipcMain.on(eventName.ERROR, (event, arg) => {
  console.log('----刷新页面------------------------')
  eventTmp = null;
  myEmitter.emit(eventName.ERROR)
  setTimeout(()=>{
    win.webContents.reload();
  }, 3000)
})

function getEvent() {
  return new Promise((resolve, reject) => {
    if (eventTmp ) {
      resolve(eventTmp)
    } else {
      console.log('等待PAGE_READY')
      myEmitter.addListener(eventName.PAGE_READY, ()=>{
        console.log('eventName.PAGE_READY')
        resolve(eventTmp)
        myEmitter.removeAllListeners([eventName.PAGE_READY])
      })
    }
  })
}
function getResult(event, dataBuffer) {
  event.reply(eventName.IMAGE, dataBuffer)
  resultTmp = null
  var re = new Promise((resolve, reject) => {
    myEmitter.addListener(eventName.RESPONSE, ()=>{
      resolve(resultTmp)
      myEmitter.removeAllListeners([eventName.RESPONSE])
      myEmitter.removeAllListeners([eventName.ERROR])
    })
    myEmitter.addListener(eventName.ERROR, ()=>{
      resolve(eventName.ERROR)
      myEmitter.removeAllListeners([eventName.RESPONSE])
      myEmitter.removeAllListeners([eventName.ERROR])
    })
  })
  return re
}


/**
 * 初始化electron
 */
// 保持对window对象的全局引用，如果不这么做的话，当JavaScript对象被
// 垃圾回收的时候，window对象将会自动的关闭
let win
function createWindow () {
  // 创建浏览器窗口。
  win = new BrowserWindow({
    width: 800,
    height: 700,
    show: false,
    webPreferences: {
      // nodeIntegration: true,
      preload: path.join(process.cwd(), 'tinypng/index.js')
    }
  })
  // 加载index.html文件
  win.loadURL('https://tinypng.com/')
  // 打开开发者工具
  // win.webContents.openDevTools()
  // 当 window 被关闭，这个事件会被触发。
  win.on('closed', () => {
    // 取消引用 window 对象，如果你的应用支持多窗口的话，
    // 通常会把多个 window 对象存放在一个数组里面，
    // 与此同时，你应该删除相应的元素。
    win = null
  })
}
// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', createWindow)
// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (win === null) {
    createWindow()
  }
})