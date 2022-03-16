const {Writable} = require('stream');

class MyWriteStream extends Writable {
  constructor(dt, opt) {
    super(opt);
  }
  //实现 _write() 方法
  _write(chunk, encoding, callback) {
    this.dataBuffer=this.dataBuffer?Buffer.concat([this.dataBuffer,chunk],this.dataBuffer.length+chunk.length):chunk;
    callback();
  }
  then(fn){
      return this._writableState.finished?fn(this.dataBuffer):this.on("finish",fn.bind(null,this.dataBuffer));//监听完成状态
  }
}

module.exports={MyWriteStream}