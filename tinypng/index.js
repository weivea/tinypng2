const eventName = require('../eventName.js')
const { ipcRenderer } = require('electron')

function run(data) {
  console.log('-----开始压缩图片--------------------------------------')
  console.log(data)
  const abView = toArrayBufferView(data)
  const aBlob = new Blob([abView]);
  var r = new XMLHttpRequest;
  r.open("POST", "/web/shrink"),
  r.upload.onprogress = console.log,
  r.onload = function(resqonse){
    console.log(resqonse)
    if(r.readyState == 4) {
      if (r.status == 201 ) {
        console.log(r.responseText)
        ipcRenderer.send(eventName.RESPONSE, r.responseText)
      }else {
        ipcRenderer.send(eventName.ERROR)
      }
    }
  };
  r.onabort = function(){
    console.log('onabort', arguments)
    ipcRenderer.send(eventName.ERROR)
  };
  r.onerror = function(){
    console.error(arguments)
    ipcRenderer.send(eventName.ERROR)
  };
  r.send(aBlob)
}

function toArrayBufferView(buf) {
  var ab = new ArrayBuffer(buf.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
      view[i] = buf[i];
  }
  return view;
}

window.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send(eventName.PAGE_READY)
})
ipcRenderer.on(eventName.IMAGE, (event, arg) => {
  run(arg)
})