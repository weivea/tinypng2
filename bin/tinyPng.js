#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { PassThrough } = require('stream');
const tinyPng = require('../index.js')
const filePaths =  process.argv.slice(2)

const filePaths2 = filePaths.filter((p)=>{
  if (!/.+\.(png|jpg|jpeg)$/.test(p)) {
    console.error(p, 'invalid file type!!')
    return false
  }
  if(/_tiny\.(png|jpg|jpeg)$/.test(p)) {
    return false
  }
  return true
})

console.log(filePaths2)

run(filePaths2).then(()=>{
  console.log('done')
  tinyPng.close();
}).catch((er)=>{
  console.error('run Error:', er)
  tinyPng.close();
})

/**
 * 
 * @param {Array[String]} filePaths 
 */
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

