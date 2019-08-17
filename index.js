const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http')
const https = require('https');
const FormData = require('form-data');
const eventName = require('./eventName.js')
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

let readyFlag = false;
let subProcess

initElectronServer()

/**
 * 初始化 electron 爬虫服务
 */
function initElectronServer() {
  subProcess = exec('node_modules/.bin/electron main.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`electron 爬虫服务 执行的错误: ${error}`);
      return;
    }
  });
  subProcess.stdout.on('data', (data) => {
    if(data.indexOf(eventName.SEVER_READY) !== -1) {
      readyFlag = true;
      console.log('electron 爬虫服务 ready');
      myEmitter.emit(eventName.SEVER_READY)
    }
    if (/^[_]{4}/.test(data)) {
      console.log(data)
    }
  });
}



module.exports = async function tinyPng(img) {
  await waitServReady()
  const imgUrl = await getTinyUrl(img)
  const imgBuf = await getMiniImage(imgUrl)
  return imgBuf
}
module.exports.close = function() {
  subProcess && subProcess.kill();
}

/**
 * 等待爬虫服务启动
 */
function waitServReady() {
  return new Promise((resolve, reject) => {
    if (readyFlag) {
      resolve()
    } else {
      myEmitter.addListener(eventName.SEVER_READY, ()=>{
        resolve()
        myEmitter.removeAllListeners([eventName.SEVER_READY])
      })
    }
  });
}

/**
 * 通过爬虫服务获取压缩图片的URL
 * @param {Buffer || fs.ReadStream} img 
 */
function getTinyUrl(img) {
  return new Promise((resolve, reject)=>{
    if (img instanceof Buffer) {
      img = fs.createReadStream(img)
    } else if (!(img instanceof fs.ReadStream)) {
      reject(new Error('Type of img shuld be "Buffer" or "fs.ReadStream"'))
      return;
    }
    const form = new FormData();
    form.append('file', img);//'file'是服务器接受的key
    const headers = form.getHeaders()//这个不能少
    const request = http.request({
      method: 'post',
      host: '127.0.0.1',
      port: 7256,
      path: '/upload/',
      headers: headers
    },function(res){
      const chunks = [];
      let size = 0;
      res.on('data',function(buffer){
        chunks.push(buffer);
        size+= buffer.length;
      })
      res.on('end',()=>{
        const buf = Buffer.concat(chunks,size)
        const re = JSON.parse(''+buf)
        const url = re.output.url + '/re.png'
        resolve(url)
      })
    })
    request.on('error', (e) => {
      console.error(e);
      reject(e)
    });
    form.pipe(request)
  })
}

/**
 * 通过url获取压缩厚的图片
 * @param {String} url 
 */
function getMiniImage(url) {
  return new Promise((resolve, reject)=>{
    var chunks = [];
    var size = 0;
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error('net work error for get: '+ url))
        return
      }
      res.on('data', (chunk) => {
        chunks.push(chunk);
        size+= chunk.length;
      });
      res.on('end', () => {
        var buf = Buffer.concat(chunks,size);
        resolve(buf)
      });
    });
    req.on('error', (e) => {
      reject(e)
    })
  })
}
