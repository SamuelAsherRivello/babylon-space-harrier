import * as BABYLON from '@babylonjs/core'

export type HudInputActions = {
  onFullscreen?: () => Promise<void> | void
  onOrbiter?: () => void
}

export type RemoveInputBindings = () => void

export function createHudInputBindings(
  canvas: HTMLCanvasElement,
  scene: BABYLON.Scene,
  actions: HudInputActions = {}
): RemoveInputBindings {
  const onCanvasClick = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    console.log(`Clicked at: (${x}, ${y})`)
  }

  const onKeyDown = async ({ key }: KeyboardEvent) => {
    const shortcut = key.toLowerCase()

    if (shortcut === 'f') {
      try {
        await actions.onFullscreen?.()
      } catch (error) {
        console.error('[hud/input.ts] Fullscreen toggle failed:', error)
      }
    }

    if (shortcut === 'o') {
      actions.onOrbiter?.()
    }
  }

  const onInspectorKeyDown = async ({ key }: KeyboardEvent) => {
    if (key.toLowerCase() !== 'd') {
      return
    }

    if (!inspectorReady) {
      await import('@babylonjs/core/Debug/debugLayer')
      await import('@babylonjs/inspector')
      inspectorReady = true
    }

    inspectorOpen = !inspectorOpen

    if (inspectorOpen) {
      localStorage.setItem('inspector', 'true')
      if (scene.debugLayer && scene.debugLayer.show) {
        scene.debugLayer.show()
      } else {
        console.error(
          'Babylon.js Inspector is not available or not attached ' +
            'to the scene.'
        )
      }
    } else {
      localStorage.removeItem('inspector')
      if (scene.debugLayer && scene.debugLayer.hide) {
        scene.debugLayer.hide()
      }
    }
  }

  canvas.addEventListener('click', onCanvasClick)
  window.addEventListener('keydown', onKeyDown)

  let inspectorReady = false
  let inspectorOpen = !!localStorage.getItem('inspector')

  if (import.meta.env.MODE === 'development') {
    window.addEventListener('keydown', onInspectorKeyDown)
  }

  if (
    import.meta.env.MODE === 'development' &&
    inspectorOpen
  ) {
    if (scene.debugLayer && scene.debugLayer.show) {
      scene.debugLayer.show()
    } else {
      console.error(
        'Babylon.js Inspector is not available or not attached ' +
          'to the scene.'
      )
    }
  }

  return () => {
    canvas.removeEventListener('click', onCanvasClick)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keydown', onInspectorKeyDown)
  }
}
