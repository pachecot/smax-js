import { EmitterEvent } from '../types';

export const EVENTS: EmitterEvent[] = [
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
];
