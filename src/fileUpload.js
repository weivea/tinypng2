const inspect = require('util').inspect;
const Busboy = require('busboy');
module.exports=function (opt){
  return (req, res, next) => {
    if (req.method === 'POST') {
      var busboy = new Busboy({ headers: req.headers });
      busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
        file.on('data', function(data) {
          console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
          console.log(data);
        });
        file.on('end', function() {
          console.log('File [' + fieldname + '] Finished');
        });
      });
      busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        console.log('Field [' + fieldname + ']: value: ' + inspect(val));
        next();
      });
      busboy.on('finish', function() {
        console.log('finish')
        next();
      });
      
      req.pipe(busboy);
    } else {
      return next();
    }
  };
}