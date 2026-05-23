import * as BABYLON from '@babylonjs/core'
import { createPostProcess } from './postProcess'
import { BabylonConfigurationModel } from './model/babylonConfigurationModel'

const WORLD_CAMERA_ORIGIN = new BABYLON.Vector3(0, 0, 0)
const WORLD_CAMERA_START = new BABYLON.Vector3(0, 0, -300)
const NEAR_ORTHO_FOV_RADIANS = 0.1;

export type RenderingBackend = 'WebGPU' | 'WebGL'

export interface WorldBuildOptions {
  configuration?: BabylonConfigurationModel
  parent?: HTMLElement
  showLoader?: boolean
}

export interface World {
  readonly canvas: HTMLCanvasElement
  readonly scene: BABYLON.Scene
  readonly engine: BABYLON.Engine | BABYLON.WebGPUEngine
  readonly camera: BABYLON.ArcRotateCamera
  readonly renderingType: RenderingBackend
  getResolution: () => string
  resize: () => void
  startRenderLoop: (onFrame?: () => void) => () => void
  dispose: () => void
}

async function createEngine(
  canvas: HTMLCanvasElement,
  configuration: BabylonConfigurationModel
): Promise<{
  engine: BABYLON.Engine | BABYLON.WebGPUEngine
  type: RenderingBackend
}> {
  if (navigator.gpu) {
    const engine = new BABYLON.WebGPUEngine(canvas, {
      antialias: configuration.antialias,
      adaptToDeviceRatio: configuration.adaptToDeviceRatio,
      powerPreference: configuration.powerPreference
    })
    await engine.initAsync()
    return { engine, type: 'WebGPU' }
  }

  return {
    engine: new BABYLON.Engine(
      canvas,
      configuration.antialias,
      {},
      configuration.adaptToDeviceRatio
    ),
    type: 'WebGL'
  }
}

function createCamera(scene: BABYLON.Scene): BABYLON.ArcRotateCamera {
  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    0,
    0,
    WORLD_CAMERA_START.length(),
    WORLD_CAMERA_ORIGIN,
    scene
  )

  camera.setTarget(WORLD_CAMERA_ORIGIN)
  camera.setPosition(WORLD_CAMERA_START)
  camera.mode = BABYLON.Camera.PERSPECTIVE_CAMERA
  camera.fov = NEAR_ORTHO_FOV_RADIANS
  camera.detachControl()
  camera.inputs.clear()
  return camera
}

function createWorldLight(scene: BABYLON.Scene) {
  const ambient = new BABYLON.HemisphericLight(
    'ambientLight',
    new BABYLON.Vector3(0, 1, 0),
    scene
  )
  ambient.intensity = 0.8

  const fill = new BABYLON.HemisphericLight(
    'fillLight',
    new BABYLON.Vector3(0, -1, 0),
    scene
  )
  fill.intensity = 0.2
}

export async function createWorld(
  options: WorldBuildOptions = {}
): Promise<World> {
  const {
    configuration = new BabylonConfigurationModel(),
    parent = document.body,
    showLoader = false
  } = options
  const canvas = document.createElement('canvas')

  parent.append(canvas)

  if (showLoader) {
    const loader = document.createElement('div')
    loader.id = 'custom-loader'
    loader.style.position = 'fixed'
    loader.style.top = '0'
    loader.style.left = '0'
    loader.style.width = '100vw'
    loader.style.height = '100vh'
    loader.style.background = 'rgba(0,0,0,0.7)'
    loader.style.display = 'flex'
    loader.style.justifyContent = 'center'
    loader.style.alignItems = 'center'
    loader.style.zIndex = '2000'
    loader.innerHTML =
      '<span style="color:white;font-size:2em">Loading...</span>'
    document.body.appendChild(loader)
  }

  const { engine, type: renderingType } = await createEngine(
    canvas,
    configuration
  )
  const scene = new BABYLON.Scene(engine)
  const camera = createCamera(scene)
  createWorldLight(scene)

  await scene.whenReadyAsync()

  if (showLoader) {
    const loader = document.getElementById('custom-loader')
    loader?.remove()
  }

  for (const texture of scene.textures) {
    texture.updateSamplingMode(1)
  }
  createPostProcess(scene, [camera])

  return {
    canvas,
    scene,
    engine,
    camera,
    renderingType,
    getResolution: () => `${engine.getRenderWidth()} x ${
      engine.getRenderHeight()
    }`,
    resize: () => engine.resize(),
    startRenderLoop: (onFrame?: () => void) => {
      const renderFrame = () => {
        scene.render()
        onFrame?.()
      }
      engine.runRenderLoop(renderFrame)
      return () => engine.stopRenderLoop(renderFrame)
    },
    dispose: () => {
      scene.dispose()
      engine.dispose()
    }
  }
}
