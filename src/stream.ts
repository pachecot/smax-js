import { Duplex } from "stream";
import { SAXOptions, Emitter, EventData, PINode, XmlTag, EmitterEvent } from './types'
import { XmlParser } from "./internal/xmlparser";
import { XmlMessage, messageEmitter } from './messages';

export function createStream(strict: boolean, opt: SAXOptions) {
  return new SAXStream(strict, opt)
}

export class SAXStream extends Duplex {

  queue: XmlMessage[] = []
  _parser: XmlParser

  constructor(strict: boolean = true, opt?: SAXOptions) {
    super({ readableObjectMode: true })
    this._parser = new XmlParser(emitter(this), strict, opt || {})
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

function emitter(stream: SAXStream): Emitter {
  return function (type: EmitterEvent, payload?: EventData) {
    const h = messages[type]
    if (h) {
      stream._push(h(payload as any))
    }
  }
}

