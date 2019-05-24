import { SAXOptions, XmlTag, PINode, EventData, Emitter, EmitterEvent } from './types'
import { XmlParser } from './internal/xmlparser';
import { getPosition } from './internal/getPosition';


/**
 * create SAXParser
 * 
 * @param strict 
 * @param opt 
 */
export const parser = function (opt?: SAXOptions) {
  return new SAXParser(opt)
}

const chunkToString = Buffer && Buffer.isBuffer ?
  (chunk: any): string => Buffer.isBuffer(chunk) ?
    chunk.toString('utf8') :
    typeof chunk === 'string' ? chunk : chunk && chunk.toString() :
  (chunk: any): string =>
    typeof chunk === 'string' ? chunk : chunk && chunk.toString()

/**
 * SAX Style XML Parser
 */
export class SAXParser {

  _parser!: XmlParser

  constructor(readonly opt: SAXOptions = {}) {
    this.open()
  }

  /** start a new file */
  open() {
    const emit = emitter(this)
    this._parser = new XmlParser(emit, this.opt)
    emit('ready')
    return this
  }

  /** write bytes to the buffer. */
  write(chunk?: any) {
    this._parser.write(chunk && chunkToString(chunk))
    return this
  }

  /** get the current error */
  get error(): Error | null {
    return this._parser.error;
  }

  /** 
   * get the supported entities
   * 
   * can be updated but will not persist accross mulitple files
   */
  get ENTITIES(): { [name: string]: string } {
    return this._parser.ENTITIES;
  }

  /** 
   * reset the error state to resume processing
   */
  resume() {
    this._parser.reset();
    return this
  }

  /** 
   * close the stream
   */
  close() {
    this.write()
    return this
  }

  flush() {
    this._parser.flush()
  }

  /** 
   * get the current position
   */
  position() {
    return getPosition(this._parser)
  }

  // Events

  /**
   * 
   * the parser is ready to be written to. on creation or after a open call. 
   */
  onready?: () => void;

  /** 
   * processing instruction event
   * 
   * <?xml-stylesheet href="my-style.css"?>
   * 
   * `{ name: 'xml-stylesheet', body: 'href="my-style.css"' }`
   * 
   * @param node [PINode]
   */
  onprocessinginstruction?: (node: PINode) => void;

  /**
   * a doctype event 
   * 
   * The `<!DOCTYPE` declaration.
   * 
   * @param doctype the doctype string.
   */
  ondoctype?: (doctype: string) => void;

  /**
   * comment node event 
   * 
   * @param comment the string of the comment
   */
  oncomment?: (comment: string) => void;

  /**
   * sgml declaration event 
   */
  onsgmldeclaration?: (decl: string) => void;

  /**
   * text node event 
   * 
   * may be called multiple times for the same block 
   * 
   * @param text string of text
   */
  ontext?: (text: string) => void;

  /**
   * open tag event
   * 
   * complete with name, attribute list, and namespace if enabled 
   */
  onopentag?: (tag: XmlTag) => void;

  /**
   * close tag event 
   */
  onclosetag?: (tagName: string) => void;

  /**
   * start cdata event
   * 
   * The opening tag of a `<![CDATA[` block.
   */
  onopencdata?: () => void;

  /**
   * text of a cdata block event
   * 
   * may be called multiple times for the same block
   */
  oncdata?: (cdata: string) => void;

  /**
   * end cdata event
   * 
   * The closing tag `]]>` of a `<![CDATA[` ablock.
   */
  onclosecdata?: () => void;

  /**
   * the closed stream has ended
   */
  onend?: () => void;

  /**
   * some processing error has occured
   */
  onerror?: (e: Error) => void;
}

function emitter(parser: SAXParser): Emitter {
  return function (event: EmitterEvent, data?: EventData) {
    const onevent = 'on' + event
    parser[onevent] && parser[onevent](data)
  }
}
