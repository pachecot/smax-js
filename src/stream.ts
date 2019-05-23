import { Duplex } from "stream";
import { SAXOptions, Emitter, EventData, PINode, XmlTag, AttributeNode, NSNode, EmitterEvent } from './types'
import { XmlParser } from "./internal/xmlparser";

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

export function messageEmitter(listener: (message: XmlMessage) => void): Emitter {
  return function (type: EmitterEvent, payload?: EventData) {
    const create = messages[type]
    if (create) {
      listener(create(payload as any))
    }
  }
}

export enum MessageType {
  ready,
  processinginstruction,
  doctype,
  comment,
  opennamespace,
  closenamespace,
  sgmldeclaration,
  text,
  opentagstart,
  opentag,
  closetag,
  opencdata,
  cdata,
  closecdata,
  attribute,
  end,
  error,
}

export interface Message<T> {
  type: MessageType
  payload: T
}

export interface ReadyMessage extends Message<void> { type: MessageType.ready }
export interface ProcessingInstructionMessage extends Message<PINode> { type: MessageType.processinginstruction }
export interface DoctypeMessage extends Message<string> { type: MessageType.doctype }
export interface CommentMessage extends Message<string> { type: MessageType.comment }
export interface OpenNamespaceMessage extends Message<NSNode> { type: MessageType.opennamespace }
export interface CloseNamespaceMessage extends Message<NSNode> { type: MessageType.closenamespace }
export interface SGMLDeclarationMessage extends Message<string> { type: MessageType.sgmldeclaration }
export interface TextMessage extends Message<string> { type: MessageType.text }
export interface OpenTagstartMessage extends Message<string> { type: MessageType.opentagstart }
export interface OpenTagMessage extends Message<XmlTag> { type: MessageType.opentag }
export interface CloseTagMessage extends Message<string> { type: MessageType.closetag }
export interface OpenCDATAMessage extends Message<void> { type: MessageType.opencdata }
export interface CDATAMessage extends Message<string> { type: MessageType.cdata }
export interface CloseCDATAMessage extends Message<void> { type: MessageType.closecdata }
export interface AttributeMessage extends Message<AttributeNode> { type: MessageType.attribute }
export interface EndMessage extends Message<void> { type: MessageType.end }
export interface ErrorMessage extends Message<Error> { type: MessageType.error }

export type XmlMessage =
  ReadyMessage |
  ProcessingInstructionMessage |
  DoctypeMessage |
  CommentMessage |
  OpenNamespaceMessage |
  CloseNamespaceMessage |
  SGMLDeclarationMessage |
  TextMessage |
  OpenTagMessage |
  OpenTagstartMessage |
  CloseTagMessage |
  OpenCDATAMessage |
  CDATAMessage |
  CloseCDATAMessage |
  AttributeMessage |
  EndMessage |
  ErrorMessage

function messageCreator(type: MessageType.ready): () => ReadyMessage;
function messageCreator(type: MessageType.processinginstruction): (pinst: PINode) => ProcessingInstructionMessage;
function messageCreator(type: MessageType.doctype): (doctype: string) => DoctypeMessage;
function messageCreator(type: MessageType.comment): (comment: string) => CommentMessage;
function messageCreator(type: MessageType.opennamespace): (ns: NSNode) => OpenNamespaceMessage;
function messageCreator(type: MessageType.closenamespace): (ns: NSNode) => CloseNamespaceMessage;
function messageCreator(type: MessageType.sgmldeclaration): (decl: string) => SGMLDeclarationMessage;
function messageCreator(type: MessageType.text): (text: string) => TextMessage;
function messageCreator(type: MessageType.opentagstart): (tagName: string) => OpenTagstartMessage;
function messageCreator(type: MessageType.opentag): (tag: XmlTag) => OpenTagMessage;
function messageCreator(type: MessageType.closetag): (tagName: string) => CloseTagMessage;
function messageCreator(type: MessageType.opencdata): () => OpenCDATAMessage;
function messageCreator(type: MessageType.cdata): (cdata: string) => CDATAMessage;
function messageCreator(type: MessageType.closecdata): () => CloseCDATAMessage;
function messageCreator(type: MessageType.attribute): (attrib: AttributeNode) => AttributeMessage;
function messageCreator(type: MessageType.end): () => EndMessage;
function messageCreator(type: MessageType.error): (error: Error) => ErrorMessage;
function messageCreator<T extends EventData>(type: MessageType): (t: T) => XmlMessage {
  return function (value?: EventData): XmlMessage {
    return { type: type, payload: value } as XmlMessage
  }
}

export const messages = {

  ready: messageCreator(MessageType.ready),
  processinginstruction: messageCreator(MessageType.processinginstruction),
  doctype: messageCreator(MessageType.doctype),
  comment: messageCreator(MessageType.comment),
  opennamespace: messageCreator(MessageType.opennamespace),
  closenamespace: messageCreator(MessageType.closenamespace),
  sgmldeclaration: messageCreator(MessageType.sgmldeclaration),
  text: messageCreator(MessageType.text),
  opentagstart: messageCreator(MessageType.opentagstart),
  opentag: messageCreator(MessageType.opentag),
  closetag: messageCreator(MessageType.closetag),
  opencdata: messageCreator(MessageType.opencdata),
  cdata: messageCreator(MessageType.cdata),
  closecdata: messageCreator(MessageType.closecdata),
  attribute: messageCreator(MessageType.attribute),
  end: messageCreator(MessageType.end),
  error: messageCreator(MessageType.error),

}
