import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'

const GAME_MODEL_PATHS = [
  'assets/models/glb/player_space_ship.glb',
  'assets/models/glb/enemy_space_ship.glb'
]

const GLTF_CHUNK_JSON = 0x4e4f534a
const GLTF_CHUNK_BINARY = 0x004e4942

type GlbParsedResult = {
  json: any
  binaryLength: number
}

function parseGlb(path: string): GlbParsedResult {
  const modelUrl = new URL(`../../../public/${path}`, import.meta.url)
  let modelPath = decodeURIComponent(modelUrl.pathname)

  if (/^\/[A-Za-z]:\//.test(modelPath)) {
    modelPath = modelPath.slice(1)
  }

  const buffer = readFileSync(modelPath) as Buffer

  expect(buffer.length).toBeGreaterThan(12)
  expect(buffer.readUInt32LE(0)).toBe(0x46546c67)
  expect(buffer.readUInt32LE(4)).toBe(2)

  let offset = 12
  let parsedJson: object | null = null
  let binaryLength = 0

  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) {
      break
    }

    const chunkLength = buffer.readUInt32LE(offset)
    const chunkType = buffer.readUInt32LE(offset + 4)
    const chunkStart = offset + 8
    const chunkEnd = chunkStart + chunkLength
    expect(chunkEnd).toBeLessThanOrEqual(buffer.length)

    const chunk = buffer.slice(chunkStart, chunkEnd)

    if (chunkType === GLTF_CHUNK_JSON) {
      parsedJson = JSON.parse(chunk.toString('utf8'))
    }

    if (chunkType === GLTF_CHUNK_BINARY) {
      binaryLength = chunkLength
    }

    offset = chunkEnd
  }

  expect(parsedJson).not.toBeNull()
  return { json: parsedJson as object, binaryLength }
}

function assertHasGeometry(parsed: GlbParsedResult) {
  const { json, binaryLength } = parsed
  expect(Array.isArray(json['meshes'])).toBe(true)
  expect(json['meshes'].length).toBeGreaterThan(0)
  expect(Array.isArray(json['bufferViews'])).toBe(true)
  expect(json['bufferViews'].length).toBeGreaterThan(0)
  expect(binaryLength).toBeGreaterThan(0)
}

describe('GLB model payload', () => {
  GAME_MODEL_PATHS.forEach(modelPath => {
    it(`loads ${modelPath} with non-zero geometry payload`, () => {
      const parsed = parseGlb(modelPath)
      assertHasGeometry(parsed)
    })
  })
})
