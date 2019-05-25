
export type EmitterEvent =
  'text' |
  'processinginstruction' |
  'sgmldeclaration' |
  'xmldeclaration' |
  'doctype' |
  'comment' |
  'opentag' |
  'closetag' |
  'opencdata' |
  'cdata' |
  'closecdata' |
  'error' |
  'end' |
  'ready'

export type Emitter = (event: EmitterEvent, data?: EventData) => void

export interface QualifiedName {
  name: string
  prefix: string
  local: string
  uri: string
}


/**
 * Object bag of settings regarding string formatting. 
 * All default to `false` if not provided.
 * 
 */
export interface SAXOptions {
  /** allow lenient proccessing */
  lenient?: boolean
  /**  trim text and comment nodes */
  trim?: boolean
  /** turn any whitespace into a single space. */
  normalize?: boolean
  /** namespaces are supported. */
  xmlns?: boolean
  /** track line/col/position. */
  position?: boolean
  /** only parse [predefined XML entities] (http://www.w3.org/TR/REC-xml/#sec-predefined-ent)
  (`&amp;`, `&apos;`, `&gt;`, `&lt;`, and `&quot;`) */
  strictEntities?: boolean
}


export type AttributeNode = {
  name: string
  value: string
}

export type Attribute = string

export interface QualifiedAttribute extends AttributeNode, QualifiedName {
}

export type Attributes = AttributeNode[] //{ [name: string]: Attribute }

export type QualifiedAttributes = QualifiedAttribute[] // { [name: string]: QualifiedAttribute }

export type Namespace = { [prefix: string]: string }

export interface NS {
  ns: Namespace
}

export interface TagKey {
  name: string
  id: number
}

export interface BaseTag {
  name: string
  isSelfClosing: boolean
  id: number
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
 * XML Declaration Encoding supported encodings
 */
export type XmlDeclarationEncoding = 'UTF-8' | 'UTF-16' | 'ISO-10646-UCS-2' | 'ISO-10646-UCS-4' |
  'ISO-8859-1' | 'ISO-8859-2' | 'ISO-8859-3' | 'ISO-8859-4' | 'ISO-8859-5' |
  'ISO-8859-6' | 'ISO-8859-7' | 'ISO-8859-8' | 'ISO-8859-9' |
  'ISO-2022-JP' | 'Shift_JIS' | 'EUC-JP'

export type YesNo = 'yes' | 'no'

/**
 * XML Declaration
 * 
 */
export interface XmlDeclaration {
  version: string
  encoding?: XmlDeclarationEncoding
  standalone?: YesNo
}

/** 
 * Processing Instruction Node
 */
export interface PINode {
  name: string
  body: string
}

export type EventData =
  AttributeNode |
  Error |
  NSNode |
  PINode |
  QualifiedAttribute |
  string |
  TagKey |
  XmlDeclaration |
  XmlTag


export interface XmlNode extends Tag {
  children?: (XmlNode | string)[]
}


