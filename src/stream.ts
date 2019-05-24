import { Duplex } from "stream";
import { SAXOptions } from './types'
import { XmlParser } from "./internal/xmlparser";
import { XmlMessage, messageEmitter } from './messages';

export function createStream(opt: SAXOptions) {
  return new SMAXStream(opt)
}
/**
 * 
 */
export class SMAXStream extends Duplex {

  queue: XmlMessage[] = []
  _parser: XmlParser

  constructor(opt?: SAXOptions) {
    super({ readableObjectMode: true })
    const emit = messageEmitter(this._push.bind(this))
    this._parser = new XmlParser(emit, opt || {})
  }

  _push(message?: XmlMessage) {

    if (message) {
      this.queue.push(message)
    }

    if (!this.isPaused() && this.queue.length > 0) {
      let _continue = true;
      while (_continue && this.queue.length > 0) {
        const Message = this.queue.shift() as XmlMessage
        _continue = this.push(Message);
      }
    }
  }

  _write(chunk: any, _encoding: string, callback: (error?: Error | null) => void): void {
    this._parser.write(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk)
    callback(this._parser.error);
  }

  _final(callback: (error?: Error | null) => void): void {
    this._parser.end()
    callback(this._parser.error);
  }

  _read(_size: number): void {
    this._push()
  }
}
