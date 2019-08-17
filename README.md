# tinyPng2
一个有点2的基于tinypng图片压缩服务的图片压缩工具；只支持png、JPEG格式图片，无需api key

稳定性依赖于当前网络环境访问 https://tinypng.com/ 的性能

勉强能用~ 不要声张~

**ps: 基于网络，无网络时无法使用**

## require

node version >=12.4.0

## Install

`npm install -g tinyPng2`

## Usage

```shell
cd dirOfImage #进入指定目录
tinyPng2 *.(png|jpeg)
```

## use it as a module



`npm install tinyPng2 --save`

```javascript
const tinyPng = require('../index.js')
const imgReadStream = fs.createReadStream(filePath)

tinyPng(imgReadStream).then((resultBuf)=>{
  // resultBuf 压缩后得图片，Buffer
})

// 用完后记得调用； tinyPng.close(),  tinyPng起了一个子进程来对 tinypng网站做爬虫
tinyPng.close()
```

**ps: 只适用于单线程调用， tinyPng不能同时发起俩， 得在then回调之后再发起下一个，如下**

```javascript

run(imagePaths).then(()=>{
  console.log('done')
  tinyPng.close();
}).catch((er)=>{
  console.error('run Error:', er)
  tinyPng.close();
})

async function run(filePaths) {
  const len = filePaths.length
  for (let i=0; i<len; i++) {
    const filePath = filePaths[i]
    const imgReadStream = fs.createReadStream(filePath)
    console.log('compress:', filePath)
    const resultBuf = await tinyPng(imgReadStream)
    // console.log(resultBuf)
    const pathObj = path.parse(filePath);
    pathObj.name = pathObj.name + '_tiny'
    pathObj.base = ''
    const newPath = path.format(pathObj)
    // console.log(newPath)
    const wStream = fs.createWriteStream(newPath) 
    const pass = new PassThrough()
    pass.pipe(wStream)
    pass.end(resultBuf)
    console.log('compressed:', newPath)
  }
}
```