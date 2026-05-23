declare module 'fs' {
  export function readFileSync(path: string): Buffer | Uint8Array
}

interface Buffer {
  toString(encoding?: string): string
  readUInt32LE(offset: number): number
  length: number
  slice(start?: number, end?: number): Buffer
}

declare type NodeBuffer = Buffer
