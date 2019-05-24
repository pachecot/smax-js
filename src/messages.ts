
import { Emitter, EventData, PINode, XmlTag, EmitterEvent, XmlDeclaration } from './types';


export enum MessageType {
  ready,
  processinginstruction,
  doctype,
  comment,
  sgmldeclaration,
  xmldeclaration,
  text,
  opentag,
  closetag,
  opencdata,
  cdata,
  closecdata,
  end,
  error
}

export interface Message<T, M extends MessageType> {
  type: M;
  payload: T;
}

export interface ReadyMessage extends Message<void, MessageType.ready> { }
export interface ProcessingInstructionMessage extends Message<PINode, MessageType.processinginstruction> { }
export interface DoctypeMessage extends Message<string, MessageType.doctype> { }
export interface CommentMessage extends Message<string, MessageType.comment> { }
export interface XMLDeclarationMessage extends Message<XmlDeclaration, MessageType.xmldeclaration> { }
export interface SGMLDeclarationMessage extends Message<string, MessageType.sgmldeclaration> { }
export interface TextMessage extends Message<string, MessageType.text> { }
export interface OpenTagMessage extends Message<XmlTag, MessageType.opentag> { }
export interface CloseTagMessage extends Message<string, MessageType.closetag> { }
export interface OpenCDATAMessage extends Message<void, MessageType.opencdata> { }
export interface CDATAMessage extends Message<string, MessageType.cdata> { }
export interface CloseCDATAMessage extends Message<void, MessageType.closecdata> { }
export interface EndMessage extends Message<void, MessageType.end> { }
export interface ErrorMessage extends Message<Error, MessageType.error> { }

export type XmlMessage = ReadyMessage |
  ProcessingInstructionMessage |
  DoctypeMessage |
  CommentMessage |
  XMLDeclarationMessage |
  SGMLDeclarationMessage |
  TextMessage |
  OpenTagMessage |
  CloseTagMessage |
  OpenCDATAMessage |
  CDATAMessage |
  CloseCDATAMessage |
  EndMessage |
  ErrorMessage;


function messageCreator(type: MessageType.ready): () => ReadyMessage;
function messageCreator(type: MessageType.processinginstruction): (pinst: PINode) => ProcessingInstructionMessage;
function messageCreator(type: MessageType.doctype): (doctype: string) => DoctypeMessage;
function messageCreator(type: MessageType.comment): (comment: string) => CommentMessage;
function messageCreator(type: MessageType.sgmldeclaration): (decl: string) => SGMLDeclarationMessage;
function messageCreator(type: MessageType.xmldeclaration): (decl: XmlDeclaration) => XMLDeclarationMessage;
function messageCreator(type: MessageType.text): (text: string) => TextMessage;
function messageCreator(type: MessageType.opentag): (tag: XmlTag) => OpenTagMessage;
function messageCreator(type: MessageType.closetag): (tagName: string) => CloseTagMessage;
function messageCreator(type: MessageType.opencdata): () => OpenCDATAMessage;
function messageCreator(type: MessageType.cdata): (cdata: string) => CDATAMessage;
function messageCreator(type: MessageType.closecdata): () => CloseCDATAMessage;
function messageCreator(type: MessageType.end): () => EndMessage;
function messageCreator(type: MessageType.error): (error: Error) => ErrorMessage;

function messageCreator<T extends EventData>(type: MessageType): (t: T) => XmlMessage {
  return function (value?: EventData): XmlMessage {
    return { type: type, payload: value } as XmlMessage;
  };
}


export const messages = {
  ready: messageCreator(MessageType.ready),
  processinginstruction: messageCreator(MessageType.processinginstruction),
  doctype: messageCreator(MessageType.doctype),
  comment: messageCreator(MessageType.comment),
  sgmldeclaration: messageCreator(MessageType.sgmldeclaration),
  xmldeclaration: messageCreator(MessageType.xmldeclaration),
  text: messageCreator(MessageType.text),
  opentag: messageCreator(MessageType.opentag),
  closetag: messageCreator(MessageType.closetag),
  opencdata: messageCreator(MessageType.opencdata),
  cdata: messageCreator(MessageType.cdata),
  closecdata: messageCreator(MessageType.closecdata),
  end: messageCreator(MessageType.end),
  error: messageCreator(MessageType.error),
};


export function messageEmitter(listener: (message: XmlMessage) => void): Emitter {
  return function (type: EmitterEvent, payload?: EventData) {
    const create = messages[type];
    if (create) {
      listener(create(payload as any));
    }
  };
}
