import {
  SAXOptions, XmlTag, QualifiedTag, Namespace,
  Position, Tag, QualifiedAttribute, Emitter, EventData,
  EmitterEvent, XmlDeclaration, XmlDeclarationEncoding
} from '../types'

import { ENTITIES, XML_ENTITIES } from './entities';

const buffers = [
  'comment',
  'sgmlDecl',
  'textNode',
  'tagName',
  'doctype',
  'procInstName',
  'procInstBody',
  'entity',
  'attribName',
  'attribValue',
  'cdata'
]

// this really needs to be replaced with character classes.
// XML allows all manner of ridiculous numbers and digits.
const XML = 'XML'
const CDATA = '[CDATA['
const DOCTYPE = 'DOCTYPE'
const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace'
const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/'
const rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE }

// http://www.w3.org/TR/REC-xml/#NT-NameStartChar
// This implementation works on strings, a single character at a time
// as such, it cannot ever support astral-plane characters (10000-EFFFF)
// without a significant breaking change to either this parser, or the
// JavaScript language. Implementation of an emoji-capable xml parser
// is left as an exercise for the reader.

const startChar = '_' + 'A-Z' + 'a-z' + '\\u00C0-\\u00D6' + '\\u00D8-\\u00F6' +
  '\\u00F8-\\u02FF' + '\\u0370-\\u037D' + '\\u037F-\\u1FFF' + '\\u200C-\\u200D' +
  '\\u2070-\\u218F' + '\\u2C00-\\u2FEF' + '\\u3001-\\uD7FF' + '\\uF900-\\uFDCF' +
  '\\uFDF0-\\uFFFD'

const bodyChar = startChar + '\\u00B7' + '\\u0300-\\u036F' + '\\u203F-\\u2040' + '.' + '\\d-'

const nameStart = new RegExp('[:' + startChar + ']')
const nameBody = new RegExp('[:' + bodyChar + ']')
const entityStart = new RegExp('[#:' + startChar + ']')
const entityBody = new RegExp('[#:' + bodyChar + ']')

function isWhitespace(c: string) {
  return c === ' ' || c === '\n' || c === '\r' || c === '\t'
}

function isQuote(c: string) {
  return c === '"' || c === '\''
}

function isAttribEnd(c: string) {
  return c === '>' || isWhitespace(c)
}

function isMatch(regex: RegExp, c: string) {
  return regex.test(c)
}

function notMatch(regex: RegExp, c: string) {
  return !isMatch(regex, c)
}

// When we pass the MAX_BUFFER_LENGTH position, start checking for buffer overruns.
// When we check, schedule the next check for MAX_BUFFER_LENGTH - (max(buffer lengths)),
// since that's the earliest that a buffer overrun could occur.  This way, checks are
// as rare as required, but as often as necessary to ensure never crossing this bound.
// Furthermore, buffers are only tested at most once per write(), so passing a very
// large string into write() might have undesirable effects, but this is manageable by
// the caller, so it is assumed to be safe.  Thus, a call to write() may, in the extreme
// edge case, result in creating at most one complete copy of the string passed in.
// Set to Infinity to have unlimited buffers.
let MAX_BUFFER_LENGTH = 64 * 1024

export function getMaxBufferLength() {
  return MAX_BUFFER_LENGTH
}
export function setMaxBufferLength(length: number) {
  MAX_BUFFER_LENGTH = length
}

const NULL_TAG: Tag = {
  attributes: [],
  name: '',
  isSelfClosing: true,
  id: -1
}


export class XmlParser implements Position {

  q = ''
  c = ''
  bufferCheckPosition = MAX_BUFFER_LENGTH

  // buffers
  comment = ''
  sgmlDecl = ''
  textNode = ''
  tagName = ''
  doctype = ''
  quoted = ''
  procInstName = ''
  procInstBody = ''
  entity = ''
  attribName = ''
  attribValue = ''
  cdata = ''

  closed = false
  closedRoot = false
  sawRoot = false

  state = STATE.BEGIN
  state_attr = STATE_ATTR.ATTRIB
  state_begin = STATE_BEGIN.BEGIN
  state_cdata = STATE_CDATA.CDATA
  state_comment = STATE_COMMENT.COMMENT
  state_closetag = STATE_CLOSETAG.CLOSETAG
  state_doctype = STATE_DOCTYPE.DOCTYPE
  state_pi = STATE_PI.PI
  state_sgmldecl = STATE_SGML.DECL
  state_text = STATE_TEXT.TEXT
  state_opentag = STATE_OPENTAG.OPENTAG

  tag: XmlTag = NULL_TAG
  error: Error | null = null
  ENTITIES: { [name: string]: string } = {}
  tags: XmlTag[] = []
  attribList: [string, string][] = []

  // position
  position = 0
  line = 0
  column = 0
  startTagPosition: number = 0

  tagid = 0
  id = 0

  // namespaces form a prototype chain.
  // it always points at the current tag,
  // which protos to its parent tag.
  ns: Namespace = Object.create(rootNS)

  xmlns: boolean
  lenient: boolean
  strictEntities: boolean
  trackPosition: boolean
  opt: SAXOptions

  constructor(readonly emit: Emitter, opt: SAXOptions) {

    this.opt = opt
    this.lenient = !!opt.lenient
    this.xmlns = !!opt.xmlns
    this.strictEntities = !!opt.strictEntities
    this.ENTITIES = this.strictEntities ? Object.create(XML_ENTITIES) : Object.create(ENTITIES)

    // mostly just for error reporting
    this.trackPosition = opt.position !== false
  }

  end() {
    end(this)
  }

  reset() {
    this.error = null
  }

  write(chunk?: string) {

    if (this.error) {
      throw this.error
    }

    if (this.closed) {
      error(this, 'Cannot write after close.')
      return
    }

    if (!chunk) {
      end(this)
      return;
    }

    parse(this, chunk)
  }

  flush() {
    flushBuffers(this)
  }
}


function checkBufferLength(context: XmlParser) {
  const maxAllowed = Math.max(MAX_BUFFER_LENGTH, 10)
  let maxActual = 0
  for (let i = 0, l = buffers.length; i < l; i++) {
    const len = context[buffers[i]].length
    if (len > maxAllowed) {
      // Text/cdata nodes can get big, and since they're buffered,
      // we can get here under normal conditions.
      // Avoid issues by emitting the text node now,
      // so at least it won't get any bigger.
      switch (buffers[i]) {
        case 'textNode':
          closeText(context)
          break

        case 'cdata':
          emitNode(context, 'cdata', context.cdata)
          context.cdata = ''
          break

        default:
          error(context, 'Max buffer length exceeded: ' + buffers[i])
      }
    }
    maxActual = Math.max(maxActual, len)
  }
  // schedule the next check for the earliest possible buffer overrun.
  const m = MAX_BUFFER_LENGTH - maxActual
  context.bufferCheckPosition = m + context.position
}

function flushBuffers(context: XmlParser) {
  closeText(context)
  if (context.cdata !== '') {
    emitNode(context, 'cdata', context.cdata)
    context.cdata = ''
  }
}


const xmldecRE = /^version="(\d+\.?\d*)"(?:\s+encoding="([^"]+)")?(?:\s+standalone="(yes|no)")?\s*$/i

function parseXmlDeclaration(body: string): XmlDeclaration | null {
  const m = xmldecRE.exec(body)

  if (!m) { return null }

  const r: XmlDeclaration = { version: m[1] }
  if (m[2]) { r.encoding = m[2] as XmlDeclarationEncoding }
  if (m[3]) { r.standalone = m[3].toLowerCase() as 'yes' | 'no' }
  return r
}



/*
 * State Table
 * 
 * | NEXT      | ATTRIB | BEGIN | CDATA | CLOSETAG | COMMENT | DOCTYPE | OPENTAG | OPEN_WAKA | PI   | SGML | TEXT | 
 * | --------- | ------ | ----- | ----- | -------- | ------- | ------- | ------- | --------- | ---- | ---- | ---- | 
 * | ATTRIB    |        |       |       |          |         |         | e!      |           |      |      |      | 
 * | BEGIN     |        |       |       |          |         |         |         |           |      |      |      | 
 * | CDATA     |        |       |       |          |         |         |         |           |      | ok   |      | 
 * | CLOSETAG  |        |       |       |          |         |         |         |           |      |      | ok   | 
 * | COMMENT   |        |       |       |          |         |         |         |           |      | ok   |      | 
 * | DOCTYPE   |        |       |       |          |         |         |         |           |      | ok   |      | 
 * | OPENTAG   | ok     |       |       |          |         |         |         | ok        |      |      |      | 
 * | OPEN_WAKA |        | ok    |       |          |         |         |         |           |      |      | ok   | 
 * | PI        |        |       |       |          |         |         |         | ok        |      |      |      | 
 * | SGML      |        |       |       |          |         |         |         | ok        |      |      |      | 
 * | TEXT      | ok     | e!    | ok    | ok       | ok      | ok      | ok      | ok        | ok   | ok   |      | 
 * 
 */


/**
 * 
 */
const enum STATE {

  /**
   * initial state
   * leading byte order mark or whitespace
   * 
   * prev states: `*`
   * 
   * next states: `OPEN_WAKA`
   * 
   */
  BEGIN,

  /**
   * general stuff
   * 
   * prev states: `ATTRIB`, `OPEN_WAKA`, `DOCTYPE`, `SGML`, `COMMENT`, `CDATA`, `PI`, `OPENTAG`, 
   * 
   * next states: `OPEN_WAKA`
   */
  TEXT,

  /**
   * `<`
   * 
   * prev states: `TEXT`
   * 
   * next states:, `SGML`, `CLOSETAG`, `PI`, `OPENTAG`, `TEXT`
   */
  OPEN_WAKA,

  /**
   * `<!BLARG`
   * 
   * prev states: `OPEN_WAKA`, `BEGIN`
   * 
   * next states: `CDATA`, `COMMENT`, `DOCTYPE`, `TEXT`
   */
  SGML,

  /**
   * `<!DOCTYPE`
   * 
   * prev states: `SGML`
   * 
   * next states: `TEXT`
   */
  DOCTYPE,

  /**
   *  `<!--`
   * 
   * prev states: `SGML`
   * 
   * next states: `TEXT`
   */
  COMMENT,

  /**
   * `<![CDATA[ something`
   * 
   * prev states: `SGML`
   * 
   * next states: `TEXT`
   */
  CDATA,

  /**
   * `<?hi`
   * 
   * prev states: `OPEN_WAKA`
   * 
   * next states: `TEXT`
   */
  PI,

  /**
   * `<strong`
   * 
   * prev states: `OPEN_WAKA`
   * 
   * next states: `ATTRIB`, `TEXT`
   */
  OPENTAG,

  /**
   * `<a `
   * 
   * prev states: `OPENTAG`
   * 
   * next states: `TEXT`, `OPENTAG`
   */
  ATTRIB,

  /**
   * `</a`
   * 
   * prev states: `OPEN_WAKA`
   * 
   * next states: `TEXT`
   */
  CLOSETAG,
}

const enum STATE_BEGIN {
  /** leading byte order mark or whitespace */ BEGIN,
  /** leading whitespace                    */ WHITESPACE,
}

const enum STATE_CLOSETAG {
  /** `</a`                                */ CLOSETAG,
  /** `</a   >`                            */ WHITESPACE,
}

const enum STATE_OPENTAG {
  /** `<s`                                 */ OPENTAG,
  /** `<strong/`                           */ SLASH,
  /** `<strong `                           */ ATTRIB,
}

const enum STATE_TEXT {
  /** general stuff                         */ TEXT,
  /** &amp and such.                        */ ENTITY,
}

const enum STATE_SGML {
  /** `<!BLARG`                             */ DECL,
  /** `<!BLARG foo "bar`                    */ QUOTED,
}

const enum STATE_COMMENT {
  /** `<!--`                                */ COMMENT,
  /** `<!-- blah -`                         */ ENDING,
  /** `<!-- blah --`                        */ ENDED,
}

const enum STATE_PI {
  /** `<?hi `                               */ PI,
  /** `<?hi there`                          */ BODY,
  /** `<?hi "there" ?`                      */ ENDING,
}

const enum STATE_DOCTYPE {
  /** `<!DOCTYPE `                          */ DOCTYPE,
  /** `<!DOCTYPE "// blah`                  */ QUOTED,
  /** `<!DOCTYPE "// blah" [ ...`           */ DTD,
  /** `<!DOCTYPE "// blah" [ "foo`          */ DTD_QUOTED,
}

const enum STATE_CDATA {
  /** `<![CDATA[ something`                 */ CDATA,
  /** `]`                                   */ ENDING,
  /** `]]`                                  */ ENDING_2,
}

/**
 * State Attribute 
 */
const enum STATE_ATTR {
  /** `<a `                                 */ ATTRIB,
  /** `<a foo`                              */ NAME,
  /** `<a foo _`                            */ NAME_WHITESPACE,
  /** `<a foo=`                             */ VALUE,
  /** `<a foo="bar`                         */ VALUE_QUOTED,
  /** `<a foo="bar"`                        */ VALUE_CLOSED,
  /** `<a foo=bar`                          */ VALUE_UNQUOTED,
  /** `<foo bar="&quot;"`                   */ VALUE_ENTITY_Q,
  /** `<foo bar=&quot`                      */ VALUE_ENTITY_U,
}


function emitNode(context: XmlParser, nodeType: EmitterEvent, data?: EventData) {
  if (context.textNode) {
    closeText(context)
  }
  if (nodeType === 'xmldeclaration' && context.id > 0) {
    strictFail(context, 'Inappropriately located xml declaration')
  }
  context.emit(nodeType, data)
  if (nodeType !== 'error') {
    context.id++
  }
}


function closeText(context: XmlParser) {
  context.textNode = textopts(context.opt, context.textNode)
  if (context.textNode) {
    context.emit('text', context.textNode)
    context.id++
  }
  context.textNode = ''
}

class Cursor {
  offset = -1
  constructor(readonly chunk: string, readonly track: boolean, readonly pos: Position) { }
  nextChar() {
    const c = charAt(this.chunk, ++this.offset)
    if (this.track && c) {
      this.pos.position++
      if (c === '\n') {
        this.pos.line++
        this.pos.column = 0
      } else {
        this.pos.column++
      }
    }
    return c
  }
  substring(start: number, end?: number) {
    return this.chunk.substring(start, end || this.offset)
  }
}

const parserMap = {
  [STATE.ATTRIB]: parse_attr,
  [STATE.BEGIN]: parse_begin,
  [STATE.CDATA]: parse_cdata,
  [STATE.CLOSETAG]: parse_closetag,
  [STATE.COMMENT]: parse_comment,
  [STATE.DOCTYPE]: parse_doctype,
  [STATE.OPENTAG]: parse_opentag,
  [STATE.OPEN_WAKA]: parse_waka,
  [STATE.PI]: parse_pi,
  [STATE.SGML]: parse_sgml,
  [STATE.TEXT]: parse_text,
}

/**
 * parse the next chunk
 *
 */
function parse(context: XmlParser, chunk: string) {

  const cursor = new Cursor(chunk, context.trackPosition, context)

  while (true) {
    const parser = parserMap[context.state]
    if (!parser) {
      throw new Error('Unknown state: ' + context.state)
    }
    parser(context, cursor)
    if (!context.c) { break }
  }

  if (context.position >= context.bufferCheckPosition) {
    checkBufferLength(context)
  }
}


/**
 * Parser for `STATE.OPEN_WAKA` - the opening `<`
 *
 * next states:
 * - `STATE.SGML`
 * - `STATE.CLOSETAG`
 * - `STATE.PI`
 * - `STATE.OPENTAG`
 * - `STATE.TEXT`
 *
 * @param context
 * @param cursor
 */
function parse_waka(context: XmlParser, cursor: Cursor) {

  while (true) {
    let c = context.c = cursor.nextChar()

    if (!c) {
      break
    }

    switch (context.state) {

      case STATE.OPEN_WAKA:
        // either a /, ?, !, or text is coming next.
        if (c === '!') {
          context.state = STATE.SGML
          context.sgmlDecl = ''
        } else if (c === '/') {
          context.state = STATE.CLOSETAG
          context.tagName = ''
        } else if (c === '?') {
          context.state = STATE.PI
          context.procInstName = context.procInstBody = ''
        } else if (isWhitespace(c)) {
          // wait for it...
        } else if (isMatch(nameStart, c)) {
          context.state = STATE.OPENTAG
          context.tagName = c
        } else {
          strictFail(context, 'Unencoded <')
          // if there was some whitespace, then add that in.
          if (context.startTagPosition + 1 < context.position) {
            const pad = context.position - context.startTagPosition
            c = new Array(pad).join(' ') + c
          }
          context.textNode += '<' + c
          context.state = STATE.TEXT
        }
        break

      default:
        throw new Error('Illegal or Unknown state: ' + context.state)
    }

    if (context.state === STATE.SGML
      || context.state === STATE.CLOSETAG
      || context.state === STATE.PI
      || context.state === STATE.OPENTAG
      || context.state === STATE.TEXT) {
      break
    }
  }
}

/**
 * Parser for `STATE.CLOSETAG` - the closing tag `</tagname  >` or `</tagname>`
 *
 * next states:
 * - `STATE.TEXT`
 */
function parse_closetag(context: XmlParser, cursor: Cursor) {

  while (true) {
    let c = context.c = cursor.nextChar()

    if (!c) {
      break
    }

    switch (context.state_closetag) {
      case STATE_CLOSETAG.CLOSETAG:
        if (!context.tagName) {
          if (isWhitespace(c)) {
            break
          } else if (notMatch(nameStart, c)) {
            strictFail(context, 'Invalid tagname in closing tag.')
          } else {
            context.tagName = c
          }
        } else if (c === '>') {
          closeTag(context)
        } else if (isMatch(nameBody, c)) {
          context.tagName += c
        } else {
          if (!isWhitespace(c)) {
            strictFail(context, 'Invalid tagname in closing tag')
          }
          context.state_closetag = STATE_CLOSETAG.WHITESPACE
        }
        break

      case STATE_CLOSETAG.WHITESPACE:
        if (isWhitespace(c)) {
          break
        }
        if (c === '>') {
          closeTag(context)
        } else {
          strictFail(context, 'Invalid characters in closing tag')
        }
        break
      default:
        throw new Error('Illegal or Unknown state: ' + context.state)
    }

    if (context.state === STATE.TEXT) {
      break
    }
  }
}


/**
 * Parser for `STATE.BEGIN` - Initial characters
 *
 * next states:
 * - `STATE.OPEN_WAKA`
 * - `STATE.TEXT`
 *
 * @param context
 * @param cursor
 */
function parse_begin(context: XmlParser, cursor: Cursor) {

  while (true) {

    let c = context.c = cursor.nextChar()

    if (!c) {
      break
    }

    switch (context.state_begin) {
      case STATE_BEGIN.BEGIN:
        context.state_begin = STATE_BEGIN.WHITESPACE
        // BOM
        if (c === '\uFEFF') {
          break
        }
        beginWhiteSpace(context, c)
        break

      case STATE_BEGIN.WHITESPACE:
        beginWhiteSpace(context, c)
        break
      default:
        throw new Error('Illegal or Unknown state: ' + context.state)
    }
    if (context.state === STATE.OPEN_WAKA
      || context.state === STATE.TEXT) {
      break
    }
  }
}


/**
 * Parser for `STATE.OPENTAG` - open tag `<tagname ` or `<tagname>` or `<tagname/>`
 *
 * next states:
 * - !`STATE.ATTRIB`
 * - `STATE.TEXT`
 */
function parse_opentag(context: XmlParser, cursor: Cursor) {

  while (true) {
    let c = context.c = cursor.nextChar()

    if (!c) {
      break
    }

    switch (context.state_opentag) {

      case STATE_OPENTAG.OPENTAG:
        if (isMatch(nameBody, c)) {
          context.tagName += c
        } else {
          newTag(context)
          if (c === '>') {
            openTag(context)
          } else if (c === '/') {
            context.state_opentag = STATE_OPENTAG.SLASH
          } else {
            if (!isWhitespace(c)) {
              strictFail(context, 'Invalid character in tag name')
            }
            context.state = STATE.ATTRIB
          }
        }
        break

      case STATE_OPENTAG.SLASH:
        if (c === '>') {
          openTag(context, true)
          closeTag(context)
        } else {
          strictFail(context, 'Forward-slash in opening tag not followed by >')
          context.state = STATE.ATTRIB
        }
        break

      default:
        throw new Error('Illegal or Unknown state: ' + context.state)
    }

    if (context.state === STATE.ATTRIB
      || context.state === STATE.TEXT) {
      context.state_opentag = STATE_OPENTAG.OPENTAG
      break
    }
  }
}


/**
 * Parser for `STATE.TEXT` - text block
 *
 * next states:
 * - `STATE.OPEN_WAKA`
 */
function parse_text(context: XmlParser, cursor: Cursor) {

  while (true) {
    let c = context.c = cursor.nextChar()

    if (!c) {
      break
    }

    switch (context.state_text) {

      case STATE_TEXT.TEXT:
        if (context.sawRoot && !context.closedRoot) {
          const starti = cursor.offset
          while (c && c !== '<' && c !== '&') {
            c = cursor.nextChar()
          }
          context.textNode += cursor.substring(starti, cursor.offset)
        }
        if (c === '<' && !(context.sawRoot && context.closedRoot && context.lenient)) {
          context.state = STATE.OPEN_WAKA
          context.startTagPosition = context.position
        } else {
          if (!isWhitespace(c) && (!context.sawRoot || context.closedRoot)) {
            strictFail(context, 'Text data outside of root node.')
          }
          if (c === '&') {
            context.state_text = STATE_TEXT.ENTITY
          } else {
            context.textNode += c
          }
        }
        break

      case STATE_TEXT.ENTITY:
        const value = parse_entitiy(context, cursor)
        if (value) {
          context.textNode += value
          context.state_text = STATE_TEXT.TEXT
        }
        break

      default:
        throw new Error('Illegal or Unknown state: ' + context.state)
    }

    if (context.state === STATE.OPEN_WAKA) {
      context.state_text = STATE_TEXT.TEXT
      break
    }
  }
}


/**
 * Parser for `STATE.SGML` - SGML Declarations `<!name body>`
 *
 * next states:
 * - `STATE.CDATA`
 * - `STATE.COMMENT`
 * - `STATE.DOCTYPE`
 * - `STATE.TEXT`
 */
function parse_sgml(context: XmlParser, cursor: Cursor) {

  if (context.state !== STATE.SGML) {
    throw new Error('Illegal state: ' + context.state + ' expexted: ' + STATE.SGML)
  }

  while (true) {
    let c = context.c = cursor.nextChar()

    if (!c) {
      break
    }

    switch (context.state_sgmldecl) {
      case STATE_SGML.DECL:
        if ((context.sgmlDecl + c).toUpperCase() === CDATA) {
          emitNode(context, 'opencdata')
          context.state = STATE.CDATA
          context.sgmlDecl = ''
          context.cdata = ''
        } else if (context.sgmlDecl + c === '--') {
          context.state = STATE.COMMENT
          context.comment = ''
          context.sgmlDecl = ''
        } else if ((context.sgmlDecl + c).toUpperCase() === DOCTYPE) {
          context.state = STATE.DOCTYPE
          if (context.doctype || context.sawRoot) {
            strictFail(context, 'Inappropriately located doctype declaration')
          }
          context.doctype = ''
          context.sgmlDecl = ''
        } else if (c === '>') {
          emitNode(context, 'sgmldeclaration', context.sgmlDecl)
          context.sgmlDecl = ''
          context.state = STATE.TEXT
        } else if (isQuote(c)) {
          context.state_sgmldecl = STATE_SGML.QUOTED
          context.quoted = context.q = c
        } else {
          context.sgmlDecl += c
        }
        break

      case STATE_SGML.QUOTED:
        if (parse_quoted(context, cursor)) {
          context.sgmlDecl += context.quoted
          context.quoted = ''
          context.state_sgmldecl = STATE_SGML.DECL
        }
        break

      default:
        throw new Error('Illegal or Unknown state: ' + context.state)
    }

    if (context.state === STATE.CDATA
      || context.state === STATE.COMMENT
      || context.state === STATE.DOCTYPE
      || context.state === STATE.TEXT) {
      context.state_sgmldecl = STATE_SGML.DECL
      break
    }
  }
}

function parse_quoted(context: XmlParser, cursor: Cursor) {

  let c = context.c
  while (true) {
    context.quoted += c
    if (c === context.q) {
      context.q = ''
      return true
    }
    c = context.c = cursor.nextChar()
    if (!c) {
      return false
    }
  }
}


/**
 * Parser for `STATE.COMMENT` - comment blocks `<!-- Some Comment -->`
 *
 * Follwing States:
 * - `STATE.TEXT`
 */
function parse_comment(context: XmlParser, cursor: Cursor) {

  while (true) {
    let c = context.c = cursor.nextChar()

    if (!c) {
      break
    }

    switch (context.state_comment) {
      case STATE_COMMENT.COMMENT:
        if (c === '-') {
          context.state_comment = STATE_COMMENT.ENDING
        } else {
          context.comment += c
        }
        break

      case STATE_COMMENT.ENDING:
        if (c === '-') {
          context.state_comment = STATE_COMMENT.ENDED
        } else {
          context.comment += '-' + c
          context.state_comment = STATE_COMMENT.COMMENT
        }
        break

      case STATE_COMMENT.ENDED:
        if (c !== '>') {
          strictFail(context, 'Malformed comment')
          // allow <!-- blah -- bloo --> in non-strict mode,
          // which is a comment of " blah -- bloo "
          context.comment += '--' + c
          context.state_comment = STATE_COMMENT.COMMENT
        } else {
          context.comment = textopts(context.opt, context.comment)
          if (context.comment) {
            emitNode(context, 'comment', context.comment)
          }
          context.comment = ''
          context.state = STATE.TEXT
        }
        break

      default:
        throw new Error('Illegal or Unknown state: ' + context.state)
    }

    if (context.state === STATE.TEXT) {
      context.state_comment = STATE_COMMENT.COMMENT
      break
    }
  }
}

/**
 * Parser for `STATE.PI` - processing instruction `<?foo body?>`
 *
 * next states:
 * - `STATE.TEXT`
 *
 * @param context
 * @param cursor
 */
function parse_pi(context: XmlParser, cursor: Cursor) {

  while (true) {
    let c = context.c = cursor.nextChar()

    if (!c) {
      break
    }

    switch (context.state_pi) {
      case STATE_PI.PI:
        if (c === '?') {
          context.state_pi = STATE_PI.ENDING
        } else if (isWhitespace(c)) {
          context.state_pi = STATE_PI.BODY
        } else {
          context.procInstName += c
        }
        break

      case STATE_PI.BODY:
        if (!context.procInstBody && isWhitespace(c)) {
          break
        } else if (c === '?') {
          context.state_pi = STATE_PI.ENDING
        } else {
          context.procInstBody += c
        }
        break

      case STATE_PI.ENDING:
        if (c === '>') {
          if (context.procInstName.toUpperCase() == XML) {
            if (context.sawRoot) {
              strictFail(context, 'Inappropriately located xml declaration')
            }
            const xdec = parseXmlDeclaration(context.procInstBody)
            if (xdec) {
              emitNode(context, 'xmldeclaration', xdec)
            } else {
              strictFail(context, 'Invalid xml declaration')
            }
          } else {
            emitNode(context, 'processinginstruction', {
              name: context.procInstName,
              body: context.procInstBody
            })
          }
          context.procInstName = context.procInstBody = ''
          context.state = STATE.TEXT
        } else {
          context.procInstBody += '?' + c
          context.state_pi = STATE_PI.BODY
        }
        break
      default:
        throw new Error('Illegal or Unknown state: ' + context.state)
    }

    if (context.state === STATE.TEXT) {
      context.state_pi = STATE_PI.PI
      break
    }
  }
}

/**
 * Parser for `STATE.DOCTYPE` - doc type
 *
 * next states:
 * - `STATE.TEXT`
 *
 */
function parse_doctype(context: XmlParser, cursor: Cursor) {

  while (true) {
    let c = context.c = cursor.nextChar()

    if (!c) {
      break
    }

    switch (context.state_doctype) {
      case STATE_DOCTYPE.DOCTYPE:
        if (c === '>') {
          context.state = STATE.TEXT
          emitNode(context, 'doctype', context.doctype)
          context.doctype = 'true' // just remember that we saw it.
        } else {
          context.doctype += c
          if (c === '[') {
            context.state_doctype = STATE_DOCTYPE.DTD
          } else if (isQuote(c)) {
            context.state_doctype = STATE_DOCTYPE.QUOTED
            context.quoted = context.q = c
          }
        }
        break

      case STATE_DOCTYPE.QUOTED:
        if (parse_quoted(context, cursor)) {
          context.doctype += context.quoted
          context.quoted = ''
          context.state_doctype = STATE_DOCTYPE.DOCTYPE
        }
        break

      case STATE_DOCTYPE.DTD:
        context.doctype += c
        if (c === ']') {
          context.state_doctype = STATE_DOCTYPE.DOCTYPE
        } else if (isQuote(c)) {
          context.state_doctype = STATE_DOCTYPE.DTD_QUOTED
          context.quoted = context.q = c
        }
        break

      case STATE_DOCTYPE.DTD_QUOTED:
        if (parse_quoted(context, cursor)) {
          context.doctype += context.quoted
          context.quoted = ''
          context.state_doctype = STATE_DOCTYPE.DTD
        }
        break

      default:
        throw new Error('Illegal or Unknown state: ' + context.state)
    }

    if (context.state === STATE.TEXT) {
      break
    }
  }
}


/**
 * Parser for `STATE.CDATA` - CDATA block `<![CDATA['raw data']]>`
 *
 * next states:
 * - `STATE.TEXT`
 */
function parse_cdata(context: XmlParser, cursor: Cursor) {

  while (true) {
    let c = context.c = cursor.nextChar()

    if (!c) {
      break
    }

    switch (context.state_cdata) {
      case STATE_CDATA.CDATA:
        if (c === ']') {
          context.state_cdata = STATE_CDATA.ENDING
        } else {
          context.cdata += c
        }
        break

      case STATE_CDATA.ENDING:
        if (c === ']') {
          context.state_cdata = STATE_CDATA.ENDING_2
        } else {
          context.cdata += ']' + c
          context.state_cdata = STATE_CDATA.CDATA
        }
        break

      case STATE_CDATA.ENDING_2:
        if (c === '>') {
          if (context.cdata) {
            emitNode(context, 'cdata', context.cdata)
          }
          emitNode(context, 'closecdata')
          context.cdata = ''
          context.state = STATE.TEXT
        } else if (c === ']') {
          context.cdata += ']'
        } else {
          context.cdata += ']]' + c
          context.state_cdata = STATE_CDATA.CDATA
        }
        break

      default:
        throw new Error('Illegal or Unknown state: ' + context.state)
    }

    if (context.state === STATE.TEXT) {
      context.state_cdata = STATE_CDATA.CDATA
      break
    }
  }
}


/**
 * Parser from `STATE.ATTRIB` - open tag attributes
 *
 * next states:
 * - `STATE.TEXT`
 * - `STATE.OPENTAG`
 */
function parse_attr(context: XmlParser, cursor: Cursor) {

  while (true) {
    let c = context.c = cursor.nextChar()

    if (!c) {
      break
    }

    switch (context.state_attr) {

      case STATE_ATTR.ATTRIB:
        // haven't read the attribute name yet.
        if (isWhitespace(c)) {
          break
        } else if (c === '>') {
          openTag(context)
        } else if (c === '/') {
          context.state = STATE.OPENTAG
          context.state_opentag = STATE_OPENTAG.SLASH
        } else if (isMatch(nameStart, c)) {
          context.attribName = c
          context.attribValue = ''
          context.state_attr = STATE_ATTR.NAME
        } else {
          strictFail(context, 'Invalid attribute name')
        }
        break

      case STATE_ATTR.NAME:
        if (c === '=') {
          context.state_attr = STATE_ATTR.VALUE
        } else if (c === '>') {
          strictFail(context, 'Attribute without value')
          context.attribValue = context.attribName
          attrib(context)
          openTag(context)
        } else if (isWhitespace(c)) {
          context.state_attr = STATE_ATTR.NAME_WHITESPACE
        } else if (isMatch(nameBody, c)) {
          context.attribName += c
        } else {
          strictFail(context, 'Invalid attribute name')
        }
        break

      case STATE_ATTR.NAME_WHITESPACE:
        if (c === '=') {
          context.state_attr = STATE_ATTR.VALUE
        } else if (isWhitespace(c)) {
          break
        } else {
          strictFail(context, 'Attribute without value')
          context.attribList.push([context.attribName, ''])
          context.attribValue = ''
          context.attribName = ''
          if (c === '>') {
            openTag(context)
          } else if (isMatch(nameStart, c)) {
            context.attribName = c
            context.state_attr = STATE_ATTR.NAME
          } else {
            strictFail(context, 'Invalid attribute name')
            context.state_attr = STATE_ATTR.ATTRIB
          }
        }
        break

      case STATE_ATTR.VALUE:
        if (isWhitespace(c)) {
          break
        } else if (isQuote(c)) {
          context.q = c
          context.state_attr = STATE_ATTR.VALUE_QUOTED
        } else {
          strictFail(context, 'Unquoted attribute value')
          context.state_attr = STATE_ATTR.VALUE_UNQUOTED
          context.attribValue = c
        }
        break

      case STATE_ATTR.VALUE_QUOTED:
        if (c !== context.q) {
          if (c === '&') {
            context.state_attr = STATE_ATTR.VALUE_ENTITY_Q
          } else {
            context.attribValue += c
          }
          break
        }
        attrib(context)
        context.q = ''
        context.state_attr = STATE_ATTR.VALUE_CLOSED
        break

      case STATE_ATTR.VALUE_UNQUOTED:
        if (!isAttribEnd(c)) {
          if (c === '&') {
            context.state_attr = STATE_ATTR.VALUE_ENTITY_U
          } else {
            context.attribValue += c
          }
          break
        }
        attrib(context)
        if (c === '>') {
          openTag(context)
        } else {
          context.state_attr = STATE_ATTR.ATTRIB
        }
        break

      case STATE_ATTR.VALUE_CLOSED:
        if (isWhitespace(c)) {
          context.state_attr = STATE_ATTR.ATTRIB
        } else if (c === '>') {
          openTag(context)
        } else if (c === '/') {
          context.state = STATE.OPENTAG
          context.state_opentag = STATE_OPENTAG.SLASH
        } else if (isMatch(nameStart, c)) {
          strictFail(context, 'No whitespace between attributes')
          context.attribName = c
          context.attribValue = ''
          context.state_attr = STATE_ATTR.NAME
        } else {
          strictFail(context, 'Invalid attribute name')
        }
        break

      case STATE_ATTR.VALUE_ENTITY_Q:
        const ent_q = parse_entitiy(context, cursor)
        if (ent_q) {
          context.attribValue += ent_q
          context.state_attr = STATE_ATTR.VALUE_QUOTED
        }
        break

      case STATE_ATTR.VALUE_ENTITY_U:
        const ent_u = parse_entitiy(context, cursor)
        if (ent_u) {
          context.attribValue += ent_u
          context.state_attr = STATE_ATTR.VALUE_UNQUOTED
        }
        break

      default:
        throw new Error('Illegal or Unknown state: ' + context.state)
    }

    if (context.state === STATE.OPENTAG
      || context.state === STATE.TEXT) {
      context.state_attr = STATE_ATTR.ATTRIB
      break
    }
  }
}




/**
 * Parser for entity - `&xxxx;`
 */
function parse_entitiy(context: XmlParser, cursor: Cursor) {

  let c = context.c;

  while (true) {

    if (c === ';') {
      const value = parseEntity(context)
      context.entity = ''
      return value
    } else if (isMatch(context.entity.length ? entityBody : entityStart, c)) {
      context.entity += c
    } else {
      strictFail(context, 'Invalid character in entity name')
      const value = '&' + context.entity + c
      context.entity = ''
      return value
    }

    c = context.c = cursor.nextChar()
    if (!c) {
      return ''
    }
  }
}


function textopts(opt: SAXOptions, text: string) {
  if (opt.trim) {
    text = text.trim()
  }
  if (opt.normalize) {
    text = text.replace(/\s+/g, ' ')
  }
  return text
}

function error(context: XmlParser, message: string) {
  closeText(context)
  if (context.trackPosition) {
    message += '\nLine: ' + context.line +
      '\nColumn: ' + context.column +
      '\nChar: ' + context.c
  }
  const error = new Error(message)
  context.error = error
  context.emit('error', error)
}

function end(context: XmlParser) {
  if (context.sawRoot && !context.closedRoot) {
    strictFail(context, 'Unclosed root tag')
  }
  if ((context.state !== STATE.BEGIN) && (context.state !== STATE.TEXT)) {
    error(context, 'Unexpected end')
  }
  closeText(context)
  context.c = ''
  context.closed = true
  context.emit('end')
}

function strictFail(context: XmlParser, message: string) {
  if (typeof context !== 'object' || !(context instanceof XmlParser)) {
    throw new Error('bad call to strictFail')
  }
  if (!context.lenient) {
    error(context, message)
  }
}

/**
 * create new Tag
 */
function newTag(context: XmlParser) {
  const tag = context.tag = { name: context.tagName, attributes: [] as QualifiedAttribute[] } as QualifiedTag

  // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
  if (context.xmlns) {
    const parent = (context.tags[context.tags.length - 1] as QualifiedTag) || context
    tag.ns = parent.ns
  }
  context.attribList = []
}

/**
 * parse qualified name
 */
function qname(name: string) {
  const i = name.indexOf(':')
  const [prefix, local] = i < 0 ? ['', name] : name.split(':')

  return { prefix, local }
}

/**
 * parse qualified attribute
 */
function qattribute(name: string) {
  // <x "xmlns"="http://foo">
  return name === 'xmlns' ?
    { prefix: 'xmlns', local: '' } :
    qname(name)
}

/**
 * process attribute and update tag namespace if xmlns is enabled
 */
function attrib(context: XmlParser) {

  context.attribList.push([context.attribName, context.attribValue])

  if (context.xmlns) {
    const qn = qattribute(context.attribName)
    const prefix = qn.prefix
    const local = qn.local

    if (prefix === 'xmlns') {
      // namespace binding attribute. push the binding into scope
      if (local === 'xml' && context.attribValue !== XML_NAMESPACE) {
        strictFail(context,
          'xml: prefix must be bound to ' + XML_NAMESPACE + '\n' +
          'Actual: ' + context.attribValue)
      } else if (local === 'xmlns' && context.attribValue !== XMLNS_NAMESPACE) {
        strictFail(context,
          'xmlns: prefix must be bound to ' + XMLNS_NAMESPACE + '\n' +
          'Actual: ' + context.attribValue)
      } else {
        const tag = context.tag as QualifiedTag
        const parent = (context.tags[context.tags.length - 1] as QualifiedTag) || context
        if (tag.ns === parent.ns) {
          tag.ns = Object.create(parent.ns)
        }
        tag.ns[local] = context.attribValue
      }
    }
  }

  context.attribName = context.attribValue = ''
}


function createAttributeNS(name: string, value: string, ns: Namespace) {
  const qualName = qattribute(name)
  const prefix = qualName.prefix
  const local = qualName.local
  const uri = prefix === '' ? '' : (ns[prefix] || '')
  return { name, value, prefix, local, uri } as QualifiedAttribute
}


function createAttribute(name: string, value: string) {
  return { name, value } as QualifiedAttribute
}


/**
 * process open tag and emit event
 *
 * changes state to `STATE.TEXT`
 */
function openTag(context: XmlParser, selfClosing?: boolean) {

  if (context.tag === NULL_TAG) {
    error(context, 'Tag does not exist')
  }

  if (context.xmlns) {
    // emit namespace binding events
    const tag = context.tag as QualifiedTag

    // add namespace info to tag
    const qn = qname(context.tagName)
    tag.prefix = qn.prefix
    tag.local = qn.local
    tag.uri = tag.ns[qn.prefix] || ''

    if (tag.prefix && !tag.uri) {
      strictFail(context, 'Unbound namespace prefix: ' + JSON.stringify(context.tagName))
      tag.uri = qn.prefix
    }

    // Note: do not apply default ns to attributes:
    //   http://www.w3.org/TR/REC-xml-names/#defaulting
    const attributes = context.tag.attributes = context.attribList.map(
      ([name, value]) => createAttributeNS(name, value, tag.ns)
    )

    // if there's any attributes with an undefined namespace,
    // then fail on them now.
    attributes.forEach(a => {
      if (a.prefix && a.prefix !== 'xmlns' && !a.uri) {
        strictFail(context, 'Unbound namespace prefix: ' + JSON.stringify(a.prefix))
        a.uri = a.prefix
      }
    })

  } else {
    context.tag.attributes = context.attribList.map(
      ([name, value]) => createAttribute(name, value)
    )
  }

  context.tag.isSelfClosing = !!selfClosing
  context.tag.id = context.tagid++

  // process the tag
  context.sawRoot = true
  context.tags.push(context.tag)
  emitNode(context, 'opentag', context.tag)
  if (!selfClosing) {
    context.state = STATE.TEXT
    context.tag = NULL_TAG
    context.tagName = ''
  }
  context.attribName = context.attribValue = ''
}

/**
 * Process the closeTag and emit event
 *
 * Changes state to `STATE.TEXT`
 */
function closeTag(context: XmlParser) {
  if (!context.tagName) {
    strictFail(context, 'Weird empty close tag.')
    context.textNode += '</>'
    context.state = STATE.TEXT
    return
  }

  // first make sure that the closing tag actually exists.
  // <a><b></c></b></a> will close everything, otherwise.
  let t = context.tags.length
  const tagName = context.tagName
  const closeTo = tagName
  while (t--) {
    const close = context.tags[t]
    if (close.name !== closeTo) {
      // fail the first time in strict mode
      strictFail(context, 'Unexpected close tag')
    } else {
      break
    }
  }

  // didn't find it.  we already failed for strict, so just abort.
  if (t < 0) {
    strictFail(context, 'Unmatched closing tag: ' + context.tagName)
    context.textNode += '</' + context.tagName + '>'
    context.state = STATE.TEXT
    return
  }
  context.tagName = tagName
  let s = context.tags.length
  while (s-- > t) {
    context.tag = context.tags.pop() as QualifiedTag
    context.tagName = context.tag.name
    const id = context.tag.id
    emitNode(context, 'closetag', { name: context.tagName, id: id })

  }
  if (t === 0) {
    context.closedRoot = true
  }
  context.tagName = ''
  context.state = STATE.TEXT
}

/**
 * parse Entity
 */
function parseEntity(context: XmlParser) {
  let entity = context.entity
  const entityLC = entity.toLowerCase()
  let num = NaN
  let numStr = ''

  const entityValue = context.ENTITIES[entity] || context.ENTITIES[entityLC]
  if (entityValue) {
    return entityValue
  }

  entity = entityLC
  if (entity.charAt(0) === '#') {
    const ishex = entity.charAt(1) === 'x'
    const base = ishex ? 16 : 10
    entity = entity.slice(ishex ? 2 : 1)
    num = parseInt(entity, base)
    numStr = num.toString(base)
  }
  entity = entity.replace(/^0+/, '')
  if (isNaN(num) || numStr.toLowerCase() !== entity) {
    strictFail(context, 'Invalid character entity')
    return '&' + context.entity + ';'
  }

  return fromCodePoint(num)
}


/**
 * Parse `STATE.BEGIN` - initial whitespace
 *
 * @remarks
 * 
 * will change state to `STATE.OPEN_WAKA`, if lenient also `STATE.TEXT`
 *    
 */
function beginWhiteSpace(context: XmlParser, c: string) {
  if (c === '<') {
    context.state = STATE.OPEN_WAKA
    context.startTagPosition = context.position
  } else if (!isWhitespace(c)) {
    // have to process this as a text node.
    // weird, but happens.
    strictFail(context, 'Non-whitespace before first tag.')
    context.textNode = c
    context.state = STATE.TEXT
  }
}

function charAt(chunk: string, i: number) {
  let result = ''
  if (i < chunk.length) {
    result = chunk.charAt(i)
  }
  return result
}


/*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
/* istanbul ignore next */
const fromCodePoint = String.fromCodePoint ||
  (function () {
    const stringFromCharCode = String.fromCharCode
    const floor = Math.floor
    const fromCodePoint = function () {
      const MAX_SIZE = 0x4000
      let codeUnits: number[] = []
      let highSurrogate
      let lowSurrogate
      let index = -1
      const length = arguments.length
      if (!length) {
        return ''
      }
      let result = ''
      while (++index < length) {
        let codePoint = Number(arguments[index])
        if (
          !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
          codePoint < 0 || // not a valid Unicode code point
          codePoint > 0x10FFFF || // not a valid Unicode code point
          floor(codePoint) !== codePoint // not an integer
        ) {
          throw RangeError('Invalid code point: ' + codePoint)
        }
        if (codePoint <= 0xFFFF) { // BMP code point
          codeUnits.push(codePoint)
        } else { // Astral code point; split in surrogate halves
          // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
          codePoint -= 0x10000
          highSurrogate = (codePoint >> 10) + 0xD800
          lowSurrogate = (codePoint % 0x400) + 0xDC00
          codeUnits.push(highSurrogate, lowSurrogate)
        }
        if (index + 1 === length || codeUnits.length > MAX_SIZE) {
          result += stringFromCharCode.apply(null, codeUnits)
          codeUnits = []
        }
      }
      return result
    }
    return fromCodePoint
  }())
