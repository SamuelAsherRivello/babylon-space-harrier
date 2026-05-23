import * as BABYLON from '@babylonjs/core'

export type ShipMovementState = {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
}

export type HudInputActions = {
  onFullscreen?: () => Promise<void> | void
  onMove?: (movement: ShipMovementState) => void
  onShoot?: () => void
  onToggleDebugHud?: () => void
}

export type RemoveInputBindings = () => void

const EMPTY_MOVEMENT: ShipMovementState = {
  left: false,
  right: false,
  up: false,
  down: false
}

export function createHudInputBindings(
  canvas: HTMLCanvasElement,
  scene: BABYLON.Scene,
  actions: HudInputActions = {}
): RemoveInputBindings {
  const movement = { ...EMPTY_MOVEMENT }

  const notifyMovement = () => {
    actions.onMove?.({ ...movement })
  }

  const onCanvasClick = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    console.log(`Clicked at: (${x}, ${y})`)
  }

  const onShortcut = async ({ key }: KeyboardEvent) => {
    const shortcut = key.toLowerCase()

    if (shortcut === 'f') {
      try {
        await actions.onFullscreen?.()
      } catch (error) {
        console.error('[hud/input.ts] Fullscreen toggle failed:', error)
      }
    }

    if (shortcut === 'h') {
      actions.onToggleDebugHud?.()
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase()

    if (
      event.key.startsWith('Arrow') ||
      event.code === 'Space' ||
      key === 'w' ||
      key === 'a' ||
      key === 's' ||
      key === 'd'
    ) {
      event.preventDefault()
    }
    if (event.code === 'Space' && !event.repeat) {
      actions.onShoot?.()
      return
    }

    if (event.key === 'ArrowLeft' || key === 'a') {
      movement.left = true
      movement.right = false
      notifyMovement()
      return
    }

    if (event.key === 'ArrowRight' || key === 'd') {
      movement.right = true
      movement.left = false
      notifyMovement()
      return
    }

    if (event.key === 'ArrowUp' || key === 'w') {
      movement.up = true
      movement.down = false
      notifyMovement()
      return
    }

    if (event.key === 'ArrowDown' || key === 's') {
      movement.down = true
      movement.up = false
      notifyMovement()
      return
    }

    void onShortcut(event)
  }

  const onKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase()

    if (event.key === 'ArrowLeft' || key === 'a') {
      movement.left = false
      notifyMovement()
      return
    }

    if (event.key === 'ArrowRight' || key === 'd') {
      movement.right = false
      notifyMovement()
      return
    }

    if (event.key === 'ArrowUp' || key === 'w') {
      movement.up = false
      notifyMovement()
      return
    }

    if (event.key === 'ArrowDown' || key === 's') {
      movement.down = false
      notifyMovement()
    }
  }

  const onInspectorKeyDown = async ({ key }: KeyboardEvent) => {
    if (key.toLowerCase() !== 'i') {
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
  window.addEventListener('keyup', onKeyUp)

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
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('keydown', onInspectorKeyDown)
  }
}
