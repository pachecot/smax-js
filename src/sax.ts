import { Duplex } from "stream";
import { NodeStringDecoder } from "string_decoder";


export const parser = function (strict: boolean, opt: SAXOptions) {
  return new SAXParser(strict, opt)
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
export const MAX_BUFFER_LENGTH = 64 * 1024

const buffers = [
  'comment', 'sgmlDecl', 'textNode', 'tagName', 'doctype',
  'procInstName', 'procInstBody', 'entity', 'attribName',
  'attribValue', 'cdata'
]

export const EVENTS = [
  'text',
  'processinginstruction',
  'sgmldeclaration',
  'doctype',
  'comment',
  'opentagstart',
  'attribute',
  'opentag',
  'closetag',
  'opencdata',
  'cdata',
  'closecdata',
  'error',
  'end',
  'ready',
  'opennamespace',
  'closenamespace'
]

interface SAXOptions {
  trim?: boolean;
  normalize?: boolean;
  xmlns?: boolean;
  position?: boolean;
  strictEntities?: boolean
}

interface SAXAttribute {
  name: string
  value: string
}

interface SAXTag {
  name: string
  isSelfClosing: boolean;
  attributes: SAXAttribute[]
  ns: { [key: string]: string };
}

export class SAXParser {

  q = ''
  c = ''
  bufferCheckPosition = MAX_BUFFER_LENGTH
  tags: SAXTag[] = []
  closed = false
  closedRoot = false
  sawRoot = false
  tag: any = null
  error: any = null
  state = STATE.BEGIN
  strictEntities: boolean
  ENTITIES: object
  attribList: [string, string][] = []
  trackPosition = false
  position = 0
  line = 0
  column = 0
  startTagPosition: number = 0
  ns: object | null = null

  attribName: string = ''
  attribValue: string = ''
  tagName: string = ''
  textNode: string = ''
  entity: string = ''

  constructor(readonly strict: boolean, readonly opt: SAXOptions = {}) {
    clearBuffers(this)
    this.strictEntities = !!opt.strictEntities
    this.ENTITIES = this.strictEntities ? Object.create(XML_ENTITIES) : Object.create(ENTITIES)

    // namespaces form a prototype chain.
    // it always points at the current tag,
    // which protos to its parent tag.
    if (this.opt.xmlns) {
      this.ns = Object.create(rootNS)
    }

    // mostly just for error reporting
    this.trackPosition = opt.position !== false
    emit(this, 'onready')
  }

  end() {
    end(this)
  }

  write = write

  resume() {
    this.error = null;
    return this
  }

  close() {
    return this.write(null)
  }

  flush() {
    flushBuffers(this)
  }

  // Events
  onready?: () => void;
  onprocessinginstruction?: (node: { name: string; body: string }) => void;
  ondoctype?: (doctype: string) => void;
  oncomment?: (comment: string) => void;
  onopennamespace?: (ns: { prefix: string; uri: string }) => void;
  onclosenamespace?: (ns: { prefix: string; uri: string }) => void;
  ontext?: (t: string) => void;
  onopentag?: (tag: SAXTag) => void;
  onclosetag?: (tagName: string) => void;
  oncdata?: (cdata: string) => void;
  onopencdata?: () => void;
  onclosecdata?: () => void;
  onattribute?: (attr: { name: string; value: string }) => void;
  onend?: () => void;
  onerror?: (e: Error) => void;

}

function checkBufferLength(parser) {
  const maxAllowed = Math.max(MAX_BUFFER_LENGTH, 10)
  let maxActual = 0
  for (let i = 0, l = buffers.length; i < l; i++) {
    const len = parser[buffers[i]].length
    if (len > maxAllowed) {
      // Text/cdata nodes can get big, and since they're buffered,
      // we can get here under normal conditions.
      // Avoid issues by emitting the text node now,
      // so at least it won't get any bigger.
      switch (buffers[i]) {
        case 'textNode':
          closeText(parser)
          break

        case 'cdata':
          emitNode(parser, 'oncdata', parser.cdata)
          parser.cdata = ''
          break

        default:
          error(parser, 'Max buffer length exceeded: ' + buffers[i])
      }
    }
    maxActual = Math.max(maxActual, len)
  }
  // schedule the next check for the earliest possible buffer overrun.
  const m = MAX_BUFFER_LENGTH - maxActual
  parser.bufferCheckPosition = m + parser.position
}

function clearBuffers(parser) {
  for (let i = 0, l = buffers.length; i < l; i++) {
    parser[buffers[i]] = ''
  }
}

function flushBuffers(parser) {
  closeText(parser)
  if (parser.cdata !== '') {
    emitNode(parser, 'oncdata', parser.cdata)
    parser.cdata = ''
  }
}


const streamWraps = EVENTS.filter(function (ev: string) {
  return ev !== 'error' && ev !== 'end'
})

export function createStream(strict, opt) {
  return new SAXStream(strict, opt)
}

export class SAXStream extends Duplex {

  writable = true
  readable = true
  _parser: SAXParser
  _decoder: NodeStringDecoder | undefined = undefined

  constructor(strict: boolean, opt: SAXOptions) {
    super()
    this._parser = new SAXParser(strict, opt)
    const me = this
    this._parser.onend = function () {
      me.emit('end')
    }
    this._parser.onerror = function (er) {
      me.emit('error', er)
      // if didn't throw, then means error was handled.
      // go ahead and clear error, so we can write again.
      me._parser.error = null
    }

    streamWraps.forEach(function (ev: string) {
      Object.defineProperty(me, 'on' + ev, {
        get: function () {
          return me._parser['on' + ev]
        },
        set: function (h) {
          if (!h) {
            me.removeAllListeners(ev)
            me._parser['on' + ev] = h
            return h
          }
          me.on(ev, h)
        },
        enumerable: true,
        configurable: false
      })
    })
  }


  queue: any[] = []
  _push(chunk?: any) {

    if (chunk) {
      this.queue.push(chunk)
    }

    if (!this.isPaused() && this.queue.length > 0) {
      let _continue = true;
      while (_continue && this.queue.length > 0) {
        const action = this.queue.shift()
        _continue = this.push(action);
      }
    }
  }


  _write(chunk: any, _encoding: string, callback: (error?: Error | null) => void): void {
    if (typeof Buffer === 'function' && typeof Buffer.isBuffer === 'function' && Buffer.isBuffer(chunk)) {
      if (!this._decoder) {
        const SD = require('string_decoder').StringDecoder
        this._decoder = new SD('utf8')
      }
      chunk = (this._decoder as NodeStringDecoder).write(chunk)
    }
    this._parser.write(chunk.toString())
    this._push(chunk)
    callback()
  }

  _final(callback: (error?: Error | null) => void): void {
    this._parser.end()
    callback();
  }

  _read(_size: number): void {
    this._push()
  }

  on(ev: string, handler) {
    const me = this
    if (!me._parser['on' + ev] && streamWraps.indexOf(ev) !== -1) {
      me._parser['on' + ev] = function () {
        const args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments)
        args.splice(0, 0, ev)
        me.emit.apply(me, args)
      }
    }

    return super.on(ev, handler)
  }

  // Events
  ontext?: (t: string) => void;
  ondoctype?: (doctype: string) => void;
  onprocessinginstruction?: (node: { name: string; body: string }) => void;
  onopentag?: (tag: SAXTag) => void;
  onclosetag?: (tagName: string) => void;
  onattribute?: (attr: { name: string; value: string }) => void;
  oncomment?: (comment: string) => void;
  onopencdata?: () => void;
  oncdata?: (cdata: string) => void;
  onclosecdata?: () => void;
  onopennamespace?: (ns: { prefix: string; uri: string }) => void;
  onclosenamespace?: (ns: { prefix: string; uri: string }) => void;
  onready?: () => void;

}

// this really needs to be replaced with character classes.
// XML allows all manner of ridiculous numbers and digits.
const CDATA = '[CDATA['
const DOCTYPE = 'DOCTYPE'
const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace'
const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/'
const rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE }

// http://www.w3.org/TR/REC-xml/#NT-NameStartChar
// This implementation works on strings, a single character at a time
// as such, it cannot ever support astral-plane characters (10000-EFFFF)
// without a significant breaking change to either this  parser, or the
// JavaScript language.  Implementation of an emoji-capable xml parser
// is left as an exercise for the reader.
const nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/

const nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/

const entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/
const entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/

function isWhitespace(c) {
  return c === ' ' || c === '\n' || c === '\r' || c === '\t'
}

function isQuote(c) {
  return c === '"' || c === '\''
}

function isAttribEnd(c) {
  return c === '>' || isWhitespace(c)
}

function isMatch(regex, c) {
  return regex.test(c)
}

function notMatch(regex, c) {
  return !isMatch(regex, c)
}

export enum STATE {
  BEGIN, //                  leading byte order mark or whitespace
  BEGIN_WHITESPACE, //       leading whitespace
  TEXT, //                   general stuff
  TEXT_ENTITY, //            &amp and such.
  OPEN_WAKA, //              <
  SGML_DECL, //              <!BLARG
  SGML_DECL_QUOTED, //       <!BLARG foo "bar
  DOCTYPE, //                <!DOCTYPE
  DOCTYPE_QUOTED, //         <!DOCTYPE "// blah
  DOCTYPE_DTD, //            <!DOCTYPE "// blah" [ ...
  DOCTYPE_DTD_QUOTED, //     <!DOCTYPE "// blah" [ "foo
  COMMENT_STARTING, //       <!-
  COMMENT, //                <!--
  COMMENT_ENDING, //         <!-- blah -
  COMMENT_ENDED, //          <!-- blah --
  CDATA, //                  <![CDATA[ something
  CDATA_ENDING, //           ]
  CDATA_ENDING_2, //         ]]
  PROC_INST, //              <?hi
  PROC_INST_BODY, //         <?hi there
  PROC_INST_ENDING, //       <?hi "there" ?
  OPEN_TAG, //               <strong
  OPEN_TAG_SLASH, //         <strong /
  ATTRIB, //                 <a
  ATTRIB_NAME, //            <a foo
  ATTRIB_NAME_SAW_WHITE, //  <a foo _
  ATTRIB_VALUE, //           <a foo=
  ATTRIB_VALUE_QUOTED, //    <a foo="bar
  ATTRIB_VALUE_CLOSED, //    <a foo="bar"
  ATTRIB_VALUE_UNQUOTED, //  <a foo=bar
  ATTRIB_VALUE_ENTITY_Q, //  <foo bar="&quot;"
  ATTRIB_VALUE_ENTITY_U, //  <foo bar=&quot
  CLOSE_TAG, //              </a
  CLOSE_TAG_SAW_WHITE, //    </a   >
}

export const XML_ENTITIES = {
  'amp': '&',
  'gt': '>',
  'lt': '<',
  'quot': '"',
  'apos': "'"
}

export const ENTITIES = {
  'amp': '&',
  'gt': '>',
  'lt': '<',
  'quot': '"',
  'apos': "'",
  'AElig': 198,
  'Aacute': 193,
  'Acirc': 194,
  'Agrave': 192,
  'Aring': 197,
  'Atilde': 195,
  'Auml': 196,
  'Ccedil': 199,
  'ETH': 208,
  'Eacute': 201,
  'Ecirc': 202,
  'Egrave': 200,
  'Euml': 203,
  'Iacute': 205,
  'Icirc': 206,
  'Igrave': 204,
  'Iuml': 207,
  'Ntilde': 209,
  'Oacute': 211,
  'Ocirc': 212,
  'Ograve': 210,
  'Oslash': 216,
  'Otilde': 213,
  'Ouml': 214,
  'THORN': 222,
  'Uacute': 218,
  'Ucirc': 219,
  'Ugrave': 217,
  'Uuml': 220,
  'Yacute': 221,
  'aacute': 225,
  'acirc': 226,
  'aelig': 230,
  'agrave': 224,
  'aring': 229,
  'atilde': 227,
  'auml': 228,
  'ccedil': 231,
  'eacute': 233,
  'ecirc': 234,
  'egrave': 232,
  'eth': 240,
  'euml': 235,
  'iacute': 237,
  'icirc': 238,
  'igrave': 236,
  'iuml': 239,
  'ntilde': 241,
  'oacute': 243,
  'ocirc': 244,
  'ograve': 242,
  'oslash': 248,
  'otilde': 245,
  'ouml': 246,
  'szlig': 223,
  'thorn': 254,
  'uacute': 250,
  'ucirc': 251,
  'ugrave': 249,
  'uuml': 252,
  'yacute': 253,
  'yuml': 255,
  'copy': 169,
  'reg': 174,
  'nbsp': 160,
  'iexcl': 161,
  'cent': 162,
  'pound': 163,
  'curren': 164,
  'yen': 165,
  'brvbar': 166,
  'sect': 167,
  'uml': 168,
  'ordf': 170,
  'laquo': 171,
  'not': 172,
  'shy': 173,
  'macr': 175,
  'deg': 176,
  'plusmn': 177,
  'sup1': 185,
  'sup2': 178,
  'sup3': 179,
  'acute': 180,
  'micro': 181,
  'para': 182,
  'middot': 183,
  'cedil': 184,
  'ordm': 186,
  'raquo': 187,
  'frac14': 188,
  'frac12': 189,
  'frac34': 190,
  'iquest': 191,
  'times': 215,
  'divide': 247,
  'OElig': 338,
  'oelig': 339,
  'Scaron': 352,
  'scaron': 353,
  'Yuml': 376,
  'fnof': 402,
  'circ': 710,
  'tilde': 732,
  'Alpha': 913,
  'Beta': 914,
  'Gamma': 915,
  'Delta': 916,
  'Epsilon': 917,
  'Zeta': 918,
  'Eta': 919,
  'Theta': 920,
  'Iota': 921,
  'Kappa': 922,
  'Lambda': 923,
  'Mu': 924,
  'Nu': 925,
  'Xi': 926,
  'Omicron': 927,
  'Pi': 928,
  'Rho': 929,
  'Sigma': 931,
  'Tau': 932,
  'Upsilon': 933,
  'Phi': 934,
  'Chi': 935,
  'Psi': 936,
  'Omega': 937,
  'alpha': 945,
  'beta': 946,
  'gamma': 947,
  'delta': 948,
  'epsilon': 949,
  'zeta': 950,
  'eta': 951,
  'theta': 952,
  'iota': 953,
  'kappa': 954,
  'lambda': 955,
  'mu': 956,
  'nu': 957,
  'xi': 958,
  'omicron': 959,
  'pi': 960,
  'rho': 961,
  'sigmaf': 962,
  'sigma': 963,
  'tau': 964,
  'upsilon': 965,
  'phi': 966,
  'chi': 967,
  'psi': 968,
  'omega': 969,
  'thetasym': 977,
  'upsih': 978,
  'piv': 982,
  'ensp': 8194,
  'emsp': 8195,
  'thinsp': 8201,
  'zwnj': 8204,
  'zwj': 8205,
  'lrm': 8206,
  'rlm': 8207,
  'ndash': 8211,
  'mdash': 8212,
  'lsquo': 8216,
  'rsquo': 8217,
  'sbquo': 8218,
  'ldquo': 8220,
  'rdquo': 8221,
  'bdquo': 8222,
  'dagger': 8224,
  'Dagger': 8225,
  'bull': 8226,
  'hellip': 8230,
  'permil': 8240,
  'prime': 8242,
  'Prime': 8243,
  'lsaquo': 8249,
  'rsaquo': 8250,
  'oline': 8254,
  'frasl': 8260,
  'euro': 8364,
  'image': 8465,
  'weierp': 8472,
  'real': 8476,
  'trade': 8482,
  'alefsym': 8501,
  'larr': 8592,
  'uarr': 8593,
  'rarr': 8594,
  'darr': 8595,
  'harr': 8596,
  'crarr': 8629,
  'lArr': 8656,
  'uArr': 8657,
  'rArr': 8658,
  'dArr': 8659,
  'hArr': 8660,
  'forall': 8704,
  'part': 8706,
  'exist': 8707,
  'empty': 8709,
  'nabla': 8711,
  'isin': 8712,
  'notin': 8713,
  'ni': 8715,
  'prod': 8719,
  'sum': 8721,
  'minus': 8722,
  'lowast': 8727,
  'radic': 8730,
  'prop': 8733,
  'infin': 8734,
  'ang': 8736,
  'and': 8743,
  'or': 8744,
  'cap': 8745,
  'cup': 8746,
  'int': 8747,
  'there4': 8756,
  'sim': 8764,
  'cong': 8773,
  'asymp': 8776,
  'ne': 8800,
  'equiv': 8801,
  'le': 8804,
  'ge': 8805,
  'sub': 8834,
  'sup': 8835,
  'nsub': 8836,
  'sube': 8838,
  'supe': 8839,
  'oplus': 8853,
  'otimes': 8855,
  'perp': 8869,
  'sdot': 8901,
  'lceil': 8968,
  'rceil': 8969,
  'lfloor': 8970,
  'rfloor': 8971,
  'lang': 9001,
  'rang': 9002,
  'loz': 9674,
  'spades': 9824,
  'clubs': 9827,
  'hearts': 9829,
  'diams': 9830
}

Object.keys(ENTITIES).forEach(function (key) {
  const e = ENTITIES[key]
  const s = typeof e === 'number' ? String.fromCharCode(e) : e
  ENTITIES[key] = s
})

// shorthand
function emit(parser: SAXParser, event: string, data?: any) {
  parser[event] && parser[event](data)
}

function emitNode(parser: SAXParser, nodeType: string, data?: any) {
  if (parser.textNode) closeText(parser)
  emit(parser, nodeType, data)
}

function closeText(parser: SAXParser) {
  parser.textNode = textopts(parser.opt, parser.textNode)
  if (parser.textNode) emit(parser, 'ontext', parser.textNode)
  parser.textNode = ''
}

function textopts(opt: SAXOptions, text: string) {
  if (opt.trim) text = text.trim()
  if (opt.normalize) text = text.replace(/\s+/g, ' ')
  return text
}

function error(parser: SAXParser, er) {
  closeText(parser)
  if (parser.trackPosition) {
    er += '\nLine: ' + parser.line +
      '\nColumn: ' + parser.column +
      '\nChar: ' + parser.c
  }
  er = new Error(er)
  parser.error = er
  emit(parser, 'onerror', er)
  return parser
}

function end(parser: SAXParser) {
  if (parser.sawRoot && !parser.closedRoot) strictFail(parser, 'Unclosed root tag')
  if ((parser.state !== STATE.BEGIN) &&
    (parser.state !== STATE.BEGIN_WHITESPACE) &&
    (parser.state !== STATE.TEXT)) {
    error(parser, 'Unexpected end')
  }
  closeText(parser)
  parser.c = ''
  parser.closed = true
  emit(parser, 'onend')
  SAXParser.call(parser, parser.strict, parser.opt)
  return parser
}

function strictFail(parser: SAXParser, message: string) {
  if (typeof parser !== 'object' || !(parser instanceof SAXParser)) {
    throw new Error('bad call to strictFail')
  }
  if ((parser as any).strict) {
    error(parser, message)
  }
}

function newTag(parser: SAXParser) {
  const parent = parser.tags[parser.tags.length - 1] || parser
  const tag = parser.tag = { name: parser.tagName, attributes: {} }

  // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
  if (parser.opt.xmlns) {
    (tag as any).ns = parent.ns
  }
  parser.attribList.length = 0
  emitNode(parser, 'onopentagstart', tag)
}

function qname(name: string, attribute?: boolean) {
  const i = name.indexOf(':')
  const qualName = i < 0 ? ['', name] : name.split(':')
  let prefix = qualName[0]
  let local = qualName[1]

  // <x "xmlns"="http://foo">
  if (attribute && name === 'xmlns') {
    prefix = 'xmlns'
    local = ''
  }

  return { prefix: prefix, local: local }
}

function attrib(parser: SAXParser) {

  if (parser.attribList.indexOf([parser.attribName, parser.attribValue]) !== -1 ||
    parser.tag.attributes.hasOwnProperty(parser.attribName)) {
    parser.attribName = parser.attribValue = ''
    return
  }

  if (parser.opt.xmlns) {
    const qn = qname(parser.attribName, true)
    const prefix = qn.prefix
    const local = qn.local

    if (prefix === 'xmlns') {
      // namespace binding attribute. push the binding into scope
      if (local === 'xml' && parser.attribValue !== XML_NAMESPACE) {
        strictFail(parser,
          'xml: prefix must be bound to ' + XML_NAMESPACE + '\n' +
          'Actual: ' + parser.attribValue)
      } else if (local === 'xmlns' && parser.attribValue !== XMLNS_NAMESPACE) {
        strictFail(parser,
          'xmlns: prefix must be bound to ' + XMLNS_NAMESPACE + '\n' +
          'Actual: ' + parser.attribValue)
      } else {
        const tag = parser.tag
        const parent = parser.tags[parser.tags.length - 1] || parser
        if (tag.ns === parent.ns) {
          tag.ns = Object.create(parent.ns)
        }
        tag.ns[local] = parser.attribValue
      }
    }

    // defer onattribute events until all attributes have been seen
    // so any new bindings can take effect. preserve attribute order
    // so deferred events can be emitted in document order
    parser.attribList.push([parser.attribName, parser.attribValue])
  } else {
    // in non-xmlns mode, we can emit the event right away
    parser.tag.attributes[parser.attribName] = parser.attribValue
    emitNode(parser, 'onattribute', {
      name: parser.attribName,
      value: parser.attribValue
    })
  }

  parser.attribName = parser.attribValue = ''
}

function openTag(parser: SAXParser, selfClosing?: boolean) {
  if (parser.opt.xmlns) {
    // emit namespace binding events
    const tag = parser.tag

    // add namespace info to tag
    const qn = qname(parser.tagName)
    tag.prefix = qn.prefix
    tag.local = qn.local
    tag.uri = tag.ns[qn.prefix] || ''

    if (tag.prefix && !tag.uri) {
      strictFail(parser, 'Unbound namespace prefix: ' +
        JSON.stringify(parser.tagName))
      tag.uri = qn.prefix
    }

    const parent = parser.tags[parser.tags.length - 1] || parser
    if (tag.ns && parent.ns !== tag.ns) {
      Object.keys(tag.ns).forEach(function (p) {
        emitNode(parser, 'onopennamespace', {
          prefix: p,
          uri: tag.ns[p]
        })
      })
    }

    // handle deferred onattribute events
    // Note: do not apply default ns to attributes:
    //   http://www.w3.org/TR/REC-xml-names/#defaulting
    for (let i = 0, l = parser.attribList.length; i < l; i++) {
      const nv = parser.attribList[i]
      const name = nv[0]
      const value = nv[1]
      const qualName = qname(name, true)
      const prefix = qualName.prefix
      const local = qualName.local
      const uri = prefix === '' ? '' : (tag.ns[prefix] || '')
      const a = {
        name: name,
        value: value,
        prefix: prefix,
        local: local,
        uri: uri
      }

      // if there's any attributes with an undefined namespace,
      // then fail on them now.
      if (prefix && prefix !== 'xmlns' && !uri) {
        strictFail(parser, 'Unbound namespace prefix: ' +
          JSON.stringify(prefix))
        a.uri = prefix
      }
      parser.tag.attributes[name] = a
      emitNode(parser, 'onattribute', a)
    }
    parser.attribList.length = 0
  }

  parser.tag.isSelfClosing = !!selfClosing

  // process the tag
  parser.sawRoot = true
  parser.tags.push(parser.tag)
  emitNode(parser, 'onopentag', parser.tag)
  if (!selfClosing) {
    parser.state = STATE.TEXT
    parser.tag = null
    parser.tagName = ''
  }
  parser.attribName = parser.attribValue = ''
  parser.attribList.length = 0
}

function closeTag(parser: SAXParser) {
  if (!parser.tagName) {
    strictFail(parser, 'Weird empty close tag.')
    parser.textNode += '</>'
    parser.state = STATE.TEXT
    return
  }

  // first make sure that the closing tag actually exists.
  // <a><b></c></b></a> will close everything, otherwise.
  let t = parser.tags.length
  const tagName = parser.tagName
  const closeTo = tagName
  while (t--) {
    const close = parser.tags[t]
    if (close.name !== closeTo) {
      // fail the first time in strict mode
      strictFail(parser, 'Unexpected close tag')
    } else {
      break
    }
  }

  // didn't find it.  we already failed for strict, so just abort.
  if (t < 0) {
    strictFail(parser, 'Unmatched closing tag: ' + parser.tagName)
    parser.textNode += '</' + parser.tagName + '>'
    parser.state = STATE.TEXT
    return
  }
  parser.tagName = tagName
  let s = parser.tags.length
  while (s-- > t) {
    const tag = parser.tag = parser.tags.pop() as SAXTag
    parser.tagName = parser.tag.name
    emitNode(parser, 'onclosetag', parser.tagName)

    const x = {}
    for (let i in tag.ns) {
      x[i] = tag.ns[i]
    }

    const parent = parser.tags[parser.tags.length - 1] || parser
    if (parser.opt.xmlns && tag.ns !== parent.ns) {
      // remove namespace bindings introduced by tag
      Object.keys(tag.ns).forEach(function (p) {
        const n = tag.ns[p]
        emitNode(parser, 'onclosenamespace', { prefix: p, uri: n })
      })
    }
  }
  if (t === 0) parser.closedRoot = true
  parser.tagName = parser.attribValue = parser.attribName = ''
  parser.attribList.length = 0
  parser.state = STATE.TEXT
}

function parseEntity(parser: SAXParser) {
  let entity = parser.entity
  const entityLC = entity.toLowerCase()
  let num
  let numStr = ''

  if (parser.ENTITIES[entity]) {
    return parser.ENTITIES[entity]
  }
  if (parser.ENTITIES[entityLC]) {
    return parser.ENTITIES[entityLC]
  }
  entity = entityLC
  if (entity.charAt(0) === '#') {
    if (entity.charAt(1) === 'x') {
      entity = entity.slice(2)
      num = parseInt(entity, 16)
      numStr = num.toString(16)
    } else {
      entity = entity.slice(1)
      num = parseInt(entity, 10)
      numStr = num.toString(10)
    }
  }
  entity = entity.replace(/^0+/, '')
  if (isNaN(num) || numStr.toLowerCase() !== entity) {
    strictFail(parser, 'Invalid character entity')
    return '&' + parser.entity + ';'
  }

  return fromCodePoint(num)
}

function beginWhiteSpace(parser: SAXParser, c: string) {
  if (c === '<') {
    parser.state = STATE.OPEN_WAKA
    parser.startTagPosition = parser.position
  } else if (!isWhitespace(c)) {
    // have to process this as a text node.
    // weird, but happens.
    strictFail(parser, 'Non-whitespace before first tag.')
    parser.textNode = c
    parser.state = STATE.TEXT
  }
}

function charAt(chunk: string, i: number) {
  let result = ''
  if (i < chunk.length) {
    result = chunk.charAt(i)
  }
  return result
}

function write(chunk: any) {
  const parser = this
  if (this.error) {
    throw this.error
  }
  if (parser.closed) {
    return error(parser,
      'Cannot write after close. Assign an onready handler.')
  }
  if (chunk === null) {
    return end(parser)
  }
  if (typeof chunk === 'object') {
    chunk = chunk.toString()
  }
  let i = 0
  let c = ''
  while (true) {
    c = charAt(chunk, i++)
    parser.c = c

    if (!c) {
      break
    }

    if (parser.trackPosition) {
      parser.position++
      if (c === '\n') {
        parser.line++
        parser.column = 0
      } else {
        parser.column++
      }
    }

    switch (parser.state) {
      case STATE.BEGIN:
        parser.state = STATE.BEGIN_WHITESPACE
        if (c === '\uFEFF') {
          continue
        }
        beginWhiteSpace(parser, c)
        continue

      case STATE.BEGIN_WHITESPACE:
        beginWhiteSpace(parser, c)
        continue

      case STATE.TEXT:
        if (parser.sawRoot && !parser.closedRoot) {
          const starti = i - 1
          while (c && c !== '<' && c !== '&') {
            c = charAt(chunk, i++)
            if (c && parser.trackPosition) {
              parser.position++
              if (c === '\n') {
                parser.line++
                parser.column = 0
              } else {
                parser.column++
              }
            }
          }
          parser.textNode += chunk.substring(starti, i - 1)
        }
        if (c === '<' && !(parser.sawRoot && parser.closedRoot && !parser.strict)) {
          parser.state = STATE.OPEN_WAKA
          parser.startTagPosition = parser.position
        } else {
          if (!isWhitespace(c) && (!parser.sawRoot || parser.closedRoot)) {
            strictFail(parser, 'Text data outside of root node.')
          }
          if (c === '&') {
            parser.state = STATE.TEXT_ENTITY
          } else {
            parser.textNode += c
          }
        }
        continue

      case STATE.OPEN_WAKA:
        // either a /, ?, !, or text is coming next.
        if (c === '!') {
          parser.state = STATE.SGML_DECL
          parser.sgmlDecl = ''
        } else if (isWhitespace(c)) {
          // wait for it...
        } else if (isMatch(nameStart, c)) {
          parser.state = STATE.OPEN_TAG
          parser.tagName = c
        } else if (c === '/') {
          parser.state = STATE.CLOSE_TAG
          parser.tagName = ''
        } else if (c === '?') {
          parser.state = STATE.PROC_INST
          parser.procInstName = parser.procInstBody = ''
        } else {
          strictFail(parser, 'Unencoded <')
          // if there was some whitespace, then add that in.
          if (parser.startTagPosition + 1 < parser.position) {
            const pad = parser.position - parser.startTagPosition
            c = new Array(pad).join(' ') + c
          }
          parser.textNode += '<' + c
          parser.state = STATE.TEXT
        }
        continue

      case STATE.SGML_DECL:
        if ((parser.sgmlDecl + c).toUpperCase() === CDATA) {
          emitNode(parser, 'onopencdata')
          parser.state = STATE.CDATA
          parser.sgmlDecl = ''
          parser.cdata = ''
        } else if (parser.sgmlDecl + c === '--') {
          parser.state = STATE.COMMENT
          parser.comment = ''
          parser.sgmlDecl = ''
        } else if ((parser.sgmlDecl + c).toUpperCase() === DOCTYPE) {
          parser.state = STATE.DOCTYPE
          if (parser.doctype || parser.sawRoot) {
            strictFail(parser,
              'Inappropriately located doctype declaration')
          }
          parser.doctype = ''
          parser.sgmlDecl = ''
        } else if (c === '>') {
          emitNode(parser, 'onsgmldeclaration', parser.sgmlDecl)
          parser.sgmlDecl = ''
          parser.state = STATE.TEXT
        } else if (isQuote(c)) {
          parser.state = STATE.SGML_DECL_QUOTED
          parser.sgmlDecl += c
        } else {
          parser.sgmlDecl += c
        }
        continue

      case STATE.SGML_DECL_QUOTED:
        if (c === parser.q) {
          parser.state = STATE.SGML_DECL
          parser.q = ''
        }
        parser.sgmlDecl += c
        continue

      case STATE.DOCTYPE:
        if (c === '>') {
          parser.state = STATE.TEXT
          emitNode(parser, 'ondoctype', parser.doctype)
          parser.doctype = true // just remember that we saw it.
        } else {
          parser.doctype += c
          if (c === '[') {
            parser.state = STATE.DOCTYPE_DTD
          } else if (isQuote(c)) {
            parser.state = STATE.DOCTYPE_QUOTED
            parser.q = c
          }
        }
        continue

      case STATE.DOCTYPE_QUOTED:
        parser.doctype += c
        if (c === parser.q) {
          parser.q = ''
          parser.state = STATE.DOCTYPE
        }
        continue

      case STATE.DOCTYPE_DTD:
        parser.doctype += c
        if (c === ']') {
          parser.state = STATE.DOCTYPE
        } else if (isQuote(c)) {
          parser.state = STATE.DOCTYPE_DTD_QUOTED
          parser.q = c
        }
        continue

      case STATE.DOCTYPE_DTD_QUOTED:
        parser.doctype += c
        if (c === parser.q) {
          parser.state = STATE.DOCTYPE_DTD
          parser.q = ''
        }
        continue

      case STATE.COMMENT:
        if (c === '-') {
          parser.state = STATE.COMMENT_ENDING
        } else {
          parser.comment += c
        }
        continue

      case STATE.COMMENT_ENDING:
        if (c === '-') {
          parser.state = STATE.COMMENT_ENDED
          parser.comment = textopts(parser.opt, parser.comment)
          if (parser.comment) {
            emitNode(parser, 'oncomment', parser.comment)
          }
          parser.comment = ''
        } else {
          parser.comment += '-' + c
          parser.state = STATE.COMMENT
        }
        continue

      case STATE.COMMENT_ENDED:
        if (c !== '>') {
          strictFail(parser, 'Malformed comment')
          // allow <!-- blah -- bloo --> in non-strict mode,
          // which is a comment of " blah -- bloo "
          parser.comment += '--' + c
          parser.state = STATE.COMMENT
        } else {
          parser.state = STATE.TEXT
        }
        continue

      case STATE.CDATA:
        if (c === ']') {
          parser.state = STATE.CDATA_ENDING
        } else {
          parser.cdata += c
        }
        continue

      case STATE.CDATA_ENDING:
        if (c === ']') {
          parser.state = STATE.CDATA_ENDING_2
        } else {
          parser.cdata += ']' + c
          parser.state = STATE.CDATA
        }
        continue

      case STATE.CDATA_ENDING_2:
        if (c === '>') {
          if (parser.cdata) {
            emitNode(parser, 'oncdata', parser.cdata)
          }
          emitNode(parser, 'onclosecdata')
          parser.cdata = ''
          parser.state = STATE.TEXT
        } else if (c === ']') {
          parser.cdata += ']'
        } else {
          parser.cdata += ']]' + c
          parser.state = STATE.CDATA
        }
        continue

      case STATE.PROC_INST:
        if (c === '?') {
          parser.state = STATE.PROC_INST_ENDING
        } else if (isWhitespace(c)) {
          parser.state = STATE.PROC_INST_BODY
        } else {
          parser.procInstName += c
        }
        continue

      case STATE.PROC_INST_BODY:
        if (!parser.procInstBody && isWhitespace(c)) {
          continue
        } else if (c === '?') {
          parser.state = STATE.PROC_INST_ENDING
        } else {
          parser.procInstBody += c
        }
        continue

      case STATE.PROC_INST_ENDING:
        if (c === '>') {
          emitNode(parser, 'onprocessinginstruction', {
            name: parser.procInstName,
            body: parser.procInstBody
          })
          parser.procInstName = parser.procInstBody = ''
          parser.state = STATE.TEXT
        } else {
          parser.procInstBody += '?' + c
          parser.state = STATE.PROC_INST_BODY
        }
        continue

      case STATE.OPEN_TAG:
        if (isMatch(nameBody, c)) {
          parser.tagName += c
        } else {
          newTag(parser)
          if (c === '>') {
            openTag(parser)
          } else if (c === '/') {
            parser.state = STATE.OPEN_TAG_SLASH
          } else {
            if (!isWhitespace(c)) {
              strictFail(parser, 'Invalid character in tag name')
            }
            parser.state = STATE.ATTRIB
          }
        }
        continue

      case STATE.OPEN_TAG_SLASH:
        if (c === '>') {
          openTag(parser, true)
          closeTag(parser)
        } else {
          strictFail(parser, 'Forward-slash in opening tag not followed by >')
          parser.state = STATE.ATTRIB
        }
        continue

      case STATE.ATTRIB:
        // haven't read the attribute name yet.
        if (isWhitespace(c)) {
          continue
        } else if (c === '>') {
          openTag(parser)
        } else if (c === '/') {
          parser.state = STATE.OPEN_TAG_SLASH
        } else if (isMatch(nameStart, c)) {
          parser.attribName = c
          parser.attribValue = ''
          parser.state = STATE.ATTRIB_NAME
        } else {
          strictFail(parser, 'Invalid attribute name')
        }
        continue

      case STATE.ATTRIB_NAME:
        if (c === '=') {
          parser.state = STATE.ATTRIB_VALUE
        } else if (c === '>') {
          strictFail(parser, 'Attribute without value')
          parser.attribValue = parser.attribName
          attrib(parser)
          openTag(parser)
        } else if (isWhitespace(c)) {
          parser.state = STATE.ATTRIB_NAME_SAW_WHITE
        } else if (isMatch(nameBody, c)) {
          parser.attribName += c
        } else {
          strictFail(parser, 'Invalid attribute name')
        }
        continue

      case STATE.ATTRIB_NAME_SAW_WHITE:
        if (c === '=') {
          parser.state = STATE.ATTRIB_VALUE
        } else if (isWhitespace(c)) {
          continue
        } else {
          strictFail(parser, 'Attribute without value')
          parser.tag.attributes[parser.attribName] = ''
          parser.attribValue = ''
          emitNode(parser, 'onattribute', {
            name: parser.attribName,
            value: ''
          })
          parser.attribName = ''
          if (c === '>') {
            openTag(parser)
          } else if (isMatch(nameStart, c)) {
            parser.attribName = c
            parser.state = STATE.ATTRIB_NAME
          } else {
            strictFail(parser, 'Invalid attribute name')
            parser.state = STATE.ATTRIB
          }
        }
        continue

      case STATE.ATTRIB_VALUE:
        if (isWhitespace(c)) {
          continue
        } else if (isQuote(c)) {
          parser.q = c
          parser.state = STATE.ATTRIB_VALUE_QUOTED
        } else {
          strictFail(parser, 'Unquoted attribute value')
          parser.state = STATE.ATTRIB_VALUE_UNQUOTED
          parser.attribValue = c
        }
        continue

      case STATE.ATTRIB_VALUE_QUOTED:
        if (c !== parser.q) {
          if (c === '&') {
            parser.state = STATE.ATTRIB_VALUE_ENTITY_Q
          } else {
            parser.attribValue += c
          }
          continue
        }
        attrib(parser)
        parser.q = ''
        parser.state = STATE.ATTRIB_VALUE_CLOSED
        continue

      case STATE.ATTRIB_VALUE_CLOSED:
        if (isWhitespace(c)) {
          parser.state = STATE.ATTRIB
        } else if (c === '>') {
          openTag(parser)
        } else if (c === '/') {
          parser.state = STATE.OPEN_TAG_SLASH
        } else if (isMatch(nameStart, c)) {
          strictFail(parser, 'No whitespace between attributes')
          parser.attribName = c
          parser.attribValue = ''
          parser.state = STATE.ATTRIB_NAME
        } else {
          strictFail(parser, 'Invalid attribute name')
        }
        continue

      case STATE.ATTRIB_VALUE_UNQUOTED:
        if (!isAttribEnd(c)) {
          if (c === '&') {
            parser.state = STATE.ATTRIB_VALUE_ENTITY_U
          } else {
            parser.attribValue += c
          }
          continue
        }
        attrib(parser)
        if (c === '>') {
          openTag(parser)
        } else {
          parser.state = STATE.ATTRIB
        }
        continue

      case STATE.CLOSE_TAG:
        if (!parser.tagName) {
          if (isWhitespace(c)) {
            continue
          } else if (notMatch(nameStart, c)) {
            strictFail(parser, 'Invalid tagname in closing tag.')
          } else {
            parser.tagName = c
          }
        } else if (c === '>') {
          closeTag(parser)
        } else if (isMatch(nameBody, c)) {
          parser.tagName += c
        } else {
          if (!isWhitespace(c)) {
            strictFail(parser, 'Invalid tagname in closing tag')
          }
          parser.state = STATE.CLOSE_TAG_SAW_WHITE
        }
        continue

      case STATE.CLOSE_TAG_SAW_WHITE:
        if (isWhitespace(c)) {
          continue
        }
        if (c === '>') {
          closeTag(parser)
        } else {
          strictFail(parser, 'Invalid characters in closing tag')
        }
        continue

      case STATE.TEXT_ENTITY:
      case STATE.ATTRIB_VALUE_ENTITY_Q:
      case STATE.ATTRIB_VALUE_ENTITY_U:
        let returnState
        let buffer
        switch (parser.state) {
          case STATE.TEXT_ENTITY:
            returnState = STATE.TEXT
            buffer = 'textNode'
            break

          case STATE.ATTRIB_VALUE_ENTITY_Q:
            returnState = STATE.ATTRIB_VALUE_QUOTED
            buffer = 'attribValue'
            break

          case STATE.ATTRIB_VALUE_ENTITY_U:
            returnState = STATE.ATTRIB_VALUE_UNQUOTED
            buffer = 'attribValue'
            break
        }

        if (c === ';') {
          parser[buffer] += parseEntity(parser)
          parser.entity = ''
          parser.state = returnState
        } else if (isMatch(parser.entity.length ? entityBody : entityStart, c)) {
          parser.entity += c
        } else {
          strictFail(parser, 'Invalid character in entity name')
          parser[buffer] += '&' + parser.entity + c
          parser.entity = ''
          parser.state = returnState
        }

        continue

      default:
        throw new Error('Unknown state: ' + parser.state)
    }
  } // while

  if (parser.position >= parser.bufferCheckPosition) {
    checkBufferLength(parser)
  }
  return parser
}

/*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
/* istanbul ignore next */
const fromCodePoint = String.fromCodePoint ||
  (function () {
    const stringFromCharCode = String.fromCharCode
    const floor = Math.floor
    const fromCodePoint = function () {
      const MAX_SIZE = 0x4000
      const codeUnits: number[] = []
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
          codeUnits.length = 0
        }
      }
      return result
    }
    return fromCodePoint
  }())
