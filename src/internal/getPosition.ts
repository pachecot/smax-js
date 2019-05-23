import { Position } from '../types';


export function getPosition<T extends Position>(pos: T): Position {
  return {
    position: pos.position,
    line: pos.line,
    column: pos.column,
    startTagPosition: pos.startTagPosition
  };
}
