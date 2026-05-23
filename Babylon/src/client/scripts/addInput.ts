import * as BABYLON from '@babylonjs/core'

// addInput.ts - Handles mouse click input and keyboard shortcuts.

type InputActions = {
  onFullscreen?: () => Promise<void> | void
  onOrbiter?: () => void
}

function updateTextElementPosition(inspectorOpen: boolean) {
  const inspectorWidth = 310

  document.querySelectorAll('.TextElement').forEach(el => {
    const textElement = el as HTMLElement
    textElement.style.right = inspectorOpen
      ? `${inspectorWidth}px`
      : '10px'
  })
}

export function addInput(
  canvas: HTMLCanvasElement,
  scene: BABYLON.Scene,
  actions: InputActions = {}
) {
  canvas.addEventListener('click', (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    console.log(`Clicked at: (${x}, ${y})`)
  })

  window.addEventListener('keydown', async ({ key }) => {
    const shortcut = key.toLowerCase()

    if (shortcut === 'f') {
      try {
        await actions.onFullscreen?.()
      } catch (error) {
        console.error('[addInput.ts] Fullscreen toggle failed:', error)
      }
    }

    if (shortcut === 'o') {
      actions.onOrbiter?.()
    }
  })

  if (import.meta.env.MODE === 'development') {
    let inspectorReady = false
    let inspectorOpen = !!localStorage.getItem('inspector')

    window.addEventListener('keydown', async ({ key }) => {
      if (key.toLowerCase() !== 'd') {
        return
      }

      if (!inspectorReady) {
        await import('@babylonjs/core/Debug/debugLayer')
        await import('@babylonjs/inspector')
        inspectorReady = true
      }

      inspectorOpen = !inspectorOpen
      updateTextElementPosition(inspectorOpen)

      if (inspectorOpen) {
        localStorage.setItem('inspector', 'true')

        if (scene.debugLayer && typeof scene.debugLayer.show === 'function') {
          scene.debugLayer.show()
        } else {
          console.error(
            'Babylon.js Inspector is not available or not attached ' +
              'to the scene.'
          )
        }
      } else {
        localStorage.removeItem('inspector')

        if (scene.debugLayer && typeof scene.debugLayer.hide === 'function') {
          scene.debugLayer.hide()
        }
      }
    })

    if (localStorage.getItem('inspector')) {
      if (scene.debugLayer && typeof scene.debugLayer.show === 'function') {
        scene.debugLayer.show()
        inspectorOpen = true
        updateTextElementPosition(true)
      } else {
        console.error(
          'Babylon.js Inspector is not available or not attached ' +
            'to the scene.'
        )
      }
    }
  }
}
