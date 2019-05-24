import { SAXOptions, XmlTag, PINode, EventData, Emitter, EmitterEvent } from './types'
import { XmlParser } from './internal/xmlparser';
import { getPosition } from './internal/getPosition';

export const parser = function (strict: boolean, opt: SAXOptions) {
  return new SAXParser(strict, opt)
}

const chunkToString = Buffer && Buffer.isBuffer ?
  (chunk: any): string => Buffer.isBuffer(chunk) ?
    chunk.toString('utf8') :
    typeof chunk === 'string' ? chunk : chunk && chunk.toString() :
  (chunk: any): string =>
    typeof chunk === 'string' ? chunk : chunk && chunk.toString()

export class SAXParser {

  _parser!: XmlParser
  emit = emitter(this)

  constructor(readonly strict: boolean, readonly opt: SAXOptions = {}) {
    this.open()
  }

  open() {
    this._parser = new XmlParser(this.emit, this.strict, this.opt)
    this.emit('ready')
    return this
  }

  end() {
    this._parser.end()
    return this
  }

  write(chunk?: any) {
    this._parser.write(chunk && chunkToString(chunk))
    return this
  }

  get error(): Error | null {
    return this._parser.error;
  }

  get ENTITIES(): { [name: string]: string } {
    return this._parser.ENTITIES;
  }

  resume() {
    this._parser.reset();
    return this
  }

  close() {
    this.write()
    return this
  }

  flush() {
    this._parser.flush()
  }

  position() {
    return getPosition(this._parser)
  }

  get tag() {
    return this._parser.tag
  }

  // Events
  onready?: () => void;
  onprocessinginstruction?: (node: PINode) => void;
  ondoctype?: (doctype: string) => void;
  oncomment?: (comment: string) => void;
  onsgmldeclaration?: (decl: string) => void;
  ontext?: (t: string) => void;
  onopentag?: (tag: XmlTag) => void;
  onclosetag?: (tagName: string) => void;
  onopencdata?: () => void;
  oncdata?: (cdata: string) => void;
  onclosecdata?: () => void;
  onend?: () => void;
  onerror?: (e: Error) => void;
}

function emitter(parser: SAXParser): Emitter {
  return function (event: EmitterEvent, data?: EventData) {
    const onevent = 'on' + event
    parser[onevent] && parser[onevent](data)
  }
}
