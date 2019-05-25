export {
  parser,
  SAXParser,
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
  CDATAMessage,
  CloseCDATAMessage,
  CloseTagMessage,
  CommentMessage,
  DoctypeMessage,
  EndMessage,
  ErrorMessage,
  Message,
  messages,
  MessageType,
  OpenCDATAMessage,
  OpenTagMessage,
  ProcessingInstructionMessage,
  ReadyMessage,
  SGMLDeclarationMessage,
  TextMessage,
  XmlMessage,
} from "./messages";
export * from './types'