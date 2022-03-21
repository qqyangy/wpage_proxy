const {Writable} = require('stream');

class MyWriteStream extends Writable {
  constructor(dt, opt) {
    super(opt);
    this.dataBuffer=dt;
  }
  //实现 _write() 方法
  _write(chunk, encoding, callback) {
    this.dataBuffer=this.dataBuffer?Buffer.concat([this.dataBuffer,chunk],this.dataBuffer.length+chunk.length):chunk;
    callback();
  }
  then(fn){
    return new Promise(resolve=>{
        if(this._writableState.finished){
            resolve(fn(this.dataBuffer));
        }else{
            this.on("finish",()=>{
                resolve(fn(this.dataBuffer));
            })
        }
    })
  }
}

module.exports={MyWriteStream}