import * as BABYLON from '@babylonjs/core'
import { AddOrbiter } from './orbiterFactory'
import { OrbiterModel } from './model/orbiterModel'
import { Orbiter } from './orbiter'
import { Tweens } from './tweens'

const DEFAULT_BASE_SPHERE_DIAMETER = 1

export type OrbiterFactory = new (
  scene: BABYLON.Scene,
  origin: BABYLON.Vector3,
  baseSize: number,
  tweens: Tweens,
  orbiterModel?: OrbiterModel
) => {
  create: () => Orbiter
  setModel: (nextModel: OrbiterModel) => void
}

export interface GameplayStateOptions {
  scene: BABYLON.Scene
  origin?: BABYLON.Vector3
  baseOrbiterDiameter?: number
  orbiterModel?: OrbiterModel
  onOrbiterSpawned?: () => void
}

export interface GameplayStateApi {
  spawnOrbiter: () => void
  update: (deltaSeconds: number) => void
  setOrbiterModel: (orbiterModel: OrbiterModel) => void
  setOrbiterFactory: (factoryClass: OrbiterFactory) => void
}

function createOrbiterState(
  scene: BABYLON.Scene,
  origin: BABYLON.Vector3,
  baseOrbiterDiameter: number,
  orbiterModel: OrbiterModel,
  onOrbiterSpawned: () => void,
  factoryClass: OrbiterFactory
) {
  const tweens = new Tweens()
  let spawner = new factoryClass(
    scene,
    origin,
    baseOrbiterDiameter,
    tweens,
    orbiterModel
  )
  const orbiters: Orbiter[] = []

  return {
    createSpawner: (nextFactoryClass: OrbiterFactory) => {
      factoryClass = nextFactoryClass
      spawner = new nextFactoryClass(
        scene,
        origin,
        baseOrbiterDiameter,
        tweens,
        orbiterModel
      )
    },
    createOrbiter: () => {
      orbiters.push(spawner.create())
      onOrbiterSpawned()
    },
    applyModel: (nextModel: OrbiterModel) => {
      orbiterModel = nextModel
      spawner.setModel(nextModel)
    },
    simulate: (deltaSeconds: number) => {
      for (let i = orbiters.length - 1; i >= 0; i -= 1) {
        if (!orbiters[i].update(deltaSeconds)) {
          orbiters.splice(i, 1)
        }
      }
    }
  }
}

export function createGameplayState(
  options: GameplayStateOptions
): GameplayStateApi {
  const {
    scene,
    origin = new BABYLON.Vector3(0, 0, 0),
    baseOrbiterDiameter = DEFAULT_BASE_SPHERE_DIAMETER,
    orbiterModel = new OrbiterModel(),
    onOrbiterSpawned = () => {}
  } = options

  let currentModel = orbiterModel
  const state = createOrbiterState(
    scene,
    origin,
    baseOrbiterDiameter,
    currentModel,
    onOrbiterSpawned,
    AddOrbiter
  )

  return {
    spawnOrbiter: () => state.createOrbiter(),
    update: (deltaSeconds: number) => state.simulate(deltaSeconds),
    setOrbiterModel: (nextModel: OrbiterModel) => {
      currentModel = nextModel
      state.applyModel(currentModel)
    },
    setOrbiterFactory: (factoryClass: OrbiterFactory) => {
      state.createSpawner(factoryClass)
    }
  }
}
