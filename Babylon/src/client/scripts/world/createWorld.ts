import * as BABYLON from '@babylonjs/core'
import '@babylonjs/loaders/glTF'
import { addPhysicsBody, initializePhysics } from './physics'
import { createPostProcess } from './postProcess'
import { BabylonConfigurationModel } from './model/babylonConfigurationModel'
import { PhysicsData } from './model/physicsData'

const WORLD_CAMERA_TARGET = new BABYLON.Vector3(-4, 2, 5)
const WORLD_CAMERA_ORIGIN = new BABYLON.Vector3(0, 1, 0)
const WORLD_GROUND_SIZE = 3.8
const WORLD_GROUND_HEIGHT = -0.01
const WORLD_SPHERE_DIAMETER = 1

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

function createCamera(
  scene: BABYLON.Scene,
  canvas: HTMLCanvasElement
): BABYLON.ArcRotateCamera {
  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    0,
    0,
    5,
    WORLD_CAMERA_TARGET,
    scene
  )

  camera.setTarget(WORLD_CAMERA_ORIGIN)
  camera.attachControl(canvas, true)
  return camera
}

function configureWorldGeometry(scene: BABYLON.Scene): void {
  const width = WORLD_GROUND_SIZE
  const height = WORLD_GROUND_SIZE
  const subdivisions = 1
  const ground = BABYLON.MeshBuilder.CreateGround(
    'ground',
    { width, height, subdivisions },
    scene
  )

  ground.position.y = WORLD_GROUND_HEIGHT
  addPhysicsBody(ground, BABYLON.PhysicsShapeType.BOX, scene, 0)

  const spherePhysics = new PhysicsData()
  const diameter = WORLD_SPHERE_DIAMETER
  spherePhysics.mass = 2
  spherePhysics.restitution = 0.8
  const sphere = BABYLON.MeshBuilder.CreateSphere(
    'sphere',
    { segments: 32, diameter },
    scene
  )
  sphere.position.y = 5
  addPhysicsBody(
    sphere,
    BABYLON.PhysicsShapeType.SPHERE,
    scene,
    spherePhysics.mass,
    spherePhysics.restitution
  )
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
  const camera = createCamera(scene, canvas)

  await Promise.all([
    BABYLON.SceneLoader.AppendAsync(
      'assets/models/glb/',
      'pixel_room.glb',
      scene
    ),
    initializePhysics(scene)
  ])

  if (showLoader) {
    const loader = document.getElementById('custom-loader')
    loader?.remove()
  }

  for (const texture of scene.textures) {
    texture.updateSamplingMode(1)
  }

  configureWorldGeometry(scene)
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
