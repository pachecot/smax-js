
export type EmitterEvent =
  'text' |
  'processinginstruction' |
  'sgmldeclaration' |
  'doctype' |
  'comment' |
  'opentagstart' |
  'attribute' |
  'opentag' |
  'closetag' |
  'opencdata' |
  'cdata' |
  'closecdata' |
  'error' |
  'end' |
  'ready' |
  'opennamespace' |
  'closenamespace'

export type Emitter = (event: EmitterEvent, data?: EventData) => void

export interface QualifiedName {
  name: string
  prefix: string
  local: string
  uri: string
}

export interface SAXOptions {
  trim?: boolean
  normalize?: boolean
  xmlns?: boolean
  position?: boolean
  strictEntities?: boolean
}


export type AttributeNode = {
  name: string
  value: string
}

export type Attribute = string

export interface QualifiedAttribute extends QualifiedName {
  value: string
}
export type Attributes = { [name: string]: Attribute }

export type QualifiedAttributes = { [name: string]: QualifiedAttribute }

export type Namespace = { [prefix: string]: string }

export interface NS {
  ns: Namespace
}

export interface BaseTag {
  name: string
  isSelfClosing: boolean
}

export interface QualifiedTag extends NS, QualifiedName, BaseTag {
  attributes: QualifiedAttributes
}

export interface Tag extends BaseTag {
  attributes: Attributes
}

export type XmlTag = Tag | QualifiedTag

export interface Position {
  position: number
  line: number
  column: number
  startTagPosition: number
}

/**
 * Namespace Node
 */
export interface NSNode {
  prefix: string
  uri: string
}

/** 
 * Processing Instruction Node
 */
export interface PINode {
  name: string
  body: string
}

export type EventData =
  string |
  XmlTag |
  QualifiedAttribute |
  AttributeNode |
  PINode |
  NSNode |
  Error


export interface XmlNode extends Tag {
  children?: (XmlNode | string)[]
}


