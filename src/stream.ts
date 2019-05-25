import { Duplex } from "stream";
import { SAXOptions } from './types'
import { XmlParser } from "./internal/xmlparser";
import { XmlMessage, messageEmitter, MessageType } from './messages';

export function createStream(opt: SAXOptions) {
  return new SMAXStream(opt)
}
/**
 * 
 */
export class SMAXStream extends Duplex {

  queue: XmlMessage[] = []
  _parser: XmlParser
  _reading: boolean = false

  constructor(opt?: SAXOptions) {
    super({ readableObjectMode: true })

    const emit = (m: XmlMessage) => {
      const eventNames = this.eventNames()
      if (m.type === MessageType.error && eventNames.includes('error')) {
        this.emit('error', m)
      } else if (m.type === MessageType.end && eventNames.includes('end')) {
        this.emit('end', m)
      } else {
        this._push(m)
        if (m.type === MessageType.end) {
          this._push()
        }
      }
    }

    const emitter = messageEmitter(emit)
    this._parser = new XmlParser(emitter, opt || {})
  }

  _push(message?: XmlMessage) {

    if (message) {
      this.queue.push(message)
    }

    while (this._reading && this.queue.length > 0) {
      const msg = this.queue.shift() as XmlMessage
      this._reading = this.push(msg);
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
    this._reading = true
    this._push()
  }
}
