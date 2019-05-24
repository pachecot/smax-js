export {
  SAXParser,
  parser
} from './parser'
export {
  EVENTS
} from "./internal/events";
export {
  ENTITIES,
  XML_ENTITIES
} from "./internal/entities";
export {
  getMaxBufferLength,
  setMaxBufferLength
} from "./internal/xmlparser";
export {
  createStream,
  SMAXStream
} from "./stream";
export {
  MessageType,
  Message,
  ReadyMessage,
  ProcessingInstructionMessage,
  DoctypeMessage,
  CommentMessage,
  SGMLDeclarationMessage,
  TextMessage,
  OpenTagMessage,
  CloseTagMessage,
  OpenCDATAMessage,
  CDATAMessage,
  CloseCDATAMessage,
  EndMessage,
  ErrorMessage,
  XmlMessage,
  messages
} from "./messages";
export * from './types'