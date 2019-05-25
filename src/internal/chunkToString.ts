/**
 * 
 */
export const chunkToString = Buffer && Buffer.isBuffer ?
  (chunk: any): string => Buffer.isBuffer(chunk) ?
    chunk.toString('utf8') :
    typeof chunk === 'string' ? chunk : chunk && chunk.toString() :
  (chunk: any): string => typeof chunk === 'string' ? chunk : chunk && chunk.toString();
