import * as BABYLON from '@babylonjs/core'
import HavokPhysics from '@babylonjs/havok'
import { PhysicsData } from './model/physicsData'

const defaultPhysicsData = new PhysicsData()

export type PhysicsBodyShape =
  | BABYLON.PhysicsShapeType.SPHERE
  | BABYLON.PhysicsShapeType.BOX

export const initializePhysics = async (
  scene: BABYLON.Scene
): Promise<void> => {
  const url = import.meta.env.DEV
    ? 'node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm'
    : 'HavokPhysics.wasm'
  const response = await fetch(url)
  const wasmBinary = await response.arrayBuffer()
  const havokInstance = await HavokPhysics({ wasmBinary })
  const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance)

  scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), havokPlugin)
}

export const addPhysicsBody = (
  mesh: BABYLON.Mesh,
  shape: PhysicsBodyShape,
  scene: BABYLON.Scene,
  mass: number = defaultPhysicsData.mass,
  restitution: number = defaultPhysicsData.restitution
) => {
  mesh.metadata = {}
  mesh.metadata.aggregate = new BABYLON.PhysicsAggregate(
    mesh,
    shape,
    { mass, restitution },
    scene
  )
}
