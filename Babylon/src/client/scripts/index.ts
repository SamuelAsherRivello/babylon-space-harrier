import * as BABYLON from '@babylonjs/core'
import '../styles/index.css'
import {
  BabylonConfigurationModel
} from './world/model/babylonConfigurationModel'
import { createWorld } from './world/createWorld'
import {
  bindInspectorAvoidance,
  createDebugHUD,
  createGameHUD
} from './hud/createHud'
import { createHudInputBindings } from './hud/input'
import { DebugHudPersistence } from './hud/model/debugHudPersistence'
import { createGameplayState } from './gameplay/createGameplayState'

async function main() {
  const configuration = new BabylonConfigurationModel()
  const debugHudPersistence = new DebugHudPersistence()
  const isDebugHudHidden = debugHudPersistence.loadHidden()
  const compatibilityNotice =
    'WebGPU is not available. Using WebGL. For WebGPU, use a ' +
    'compatible browser and HTTPS.'

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }

    await world.canvas.requestFullscreen()
  }

  const world = await createWorld({
    configuration,
    showLoader: false
  })

  const worldCompatibilityNotice =
    world.renderingType === 'WebGL' ? compatibilityNotice : undefined

  const debugHud = createDebugHUD({
    configuration,
    renderingType: world.renderingType,
    resolution: world.getResolution(),
    compatibilityNotice: worldCompatibilityNotice,
    hidden: isDebugHudHidden
  })
  const gameHud = createGameHUD()
  let score = 0
  const playerShipOrigin = new BABYLON.Vector3(0, 0, 0)

  const gameplay = await createGameplayState({
    scene: world.scene,
    camera: world.camera,
    shipOrigin: playerShipOrigin,
    onPlayerHitEnemy: () => {
      score += 1
      gameHud.setScore(score)
    }
  })

  const removeInputBindings = createHudInputBindings(
    world.canvas,
    world.scene,
    {
      onFullscreen: toggleFullscreen,
      onMove: movement => {
        gameplay.setMovementInput(movement)
      },
      onShoot: () => {
        gameplay.shoot()
      },
      onToggleDebugHud: () => {
        const nextVisible = !debugHud.isVisible()
        debugHud.setVisible(nextVisible)
        debugHudPersistence.saveHidden(!nextVisible)
      }
    }
  )
  const removeInspectorAvoidance = bindInspectorAvoidance(world.canvas)

  const adjustForViewport = () => {
    world.resize()
    debugHud.setResolution(world.getResolution())
  }
  window.addEventListener('resize', adjustForViewport)
  adjustForViewport()

  const onRender = () => {
    const deltaSeconds = world.engine.getDeltaTime() / 1000
    gameplay.update(deltaSeconds)
    debugHud.setFPS(Math.round(world.engine.getFps()))
  }
  const stopRenderLoop = world.startRenderLoop(onRender)

  return () => {
    stopRenderLoop()
    removeInputBindings()
    removeInspectorAvoidance()
    window.removeEventListener('resize', adjustForViewport)
    world.dispose()
  }
}

main().catch(error => {
  console.error('[index.ts] Error in main:', error)
})
