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
  SAXStream,
  MessageType,
  Message,
  ReadyMessage,
  ProcessingInstructionMessage,
  DoctypeMessage,
  CommentMessage,
  OpenNamespaceMessage,
  CloseNamespaceMessage,
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
} from "./stream";
