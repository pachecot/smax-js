import { EmitterEvent } from '../types';

export const EVENTS: EmitterEvent[] = [
  'text',
  'processinginstruction',
  'sgmldeclaration',
  'xmldeclaration',
  'doctype',
  'comment',
  'opentag',
  'closetag',
  'opencdata',
  'cdata',
  'closecdata',
  'error',
  'end',
  'ready'
];
