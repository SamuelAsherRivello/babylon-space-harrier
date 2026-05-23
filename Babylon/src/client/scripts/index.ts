import * as BABYLON from '@babylonjs/core'
import '../styles/index.css'
import {
  BabylonConfigurationModel
} from './world/model/babylonConfigurationModel'
import { createWorld } from './world/createWorld'
import { bindInspectorAvoidance, createHUD } from './hud/createHud'
import { createHudInputBindings } from './hud/input'
import { createGameplayState } from './gameplay/createGameplayState'
import { OrbiterModel } from './gameplay/model/orbiterModel'
import { playSound } from './gameplay/sound'

async function main() {
  const configuration = new BabylonConfigurationModel()
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

  const ui = createHUD({
    configuration,
    renderingType: world.renderingType,
    resolution: world.getResolution(),
    compatibilityNotice: worldCompatibilityNotice
  })

  let orbiterModel = new OrbiterModel()
  const gameplay = createGameplayState({
    scene: world.scene,
    origin: BABYLON.Vector3.Zero(),
    baseOrbiterDiameter: 1,
    orbiterModel
  })

  const removeInputBindings = createHudInputBindings(
    world.canvas,
    world.scene,
    {
      onFullscreen: toggleFullscreen,
      onOrbiter: () => {
        gameplay.spawnOrbiter()
        playSound('/assets/audio/Pop01.mp3')
      }
    }
  )
  const removeInspectorAvoidance = bindInspectorAvoidance(world.canvas)

  const adjustForViewport = () => {
    world.resize()
    ui.setResolution(world.getResolution())
  }
  window.addEventListener('resize', adjustForViewport)
  adjustForViewport()

  const onRender = () => {
    const deltaSeconds = world.engine.getDeltaTime() / 1000
    gameplay.update(deltaSeconds)
    ui.setFPS(Math.round(world.engine.getFps()))
  }
  const stopRenderLoop = world.startRenderLoop(onRender)

  if (import.meta.hot) {
    import.meta.hot.accept('./gameplay/orbiterFactory.ts', module => {
      if (!module || !module.AddOrbiter) {
        return
      }

      gameplay.setOrbiterFactory(module.AddOrbiter)
      console.info(
        '[HMR] AddOrbiter updated. New orbiters will use the latest code.'
      )
    })

    import.meta.hot.accept('./gameplay/model/orbiterModel.ts', module => {
      if (!module || !module.OrbiterModel) {
        return
      }

      orbiterModel = new module.OrbiterModel()
      gameplay.setOrbiterModel(orbiterModel)
      console.info(
        '[HMR] OrbiterModel updated. New orbiters use latest values.'
      )
    })
  }

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
