import {
  BabylonConfigurationModel
} from '../world/model/babylonConfigurationModel'
import { TextElement } from './view/textElement'

const DEFAULT_SHORTCUTS = ['F = Fullscreen', 'D = Inspector', 'O = Orbiter']

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function formatLine(line: string) {
  const escapedLine = escapeHtml(line)
  const trimmedLine = line.trimStart()

  return trimmedLine.startsWith('•') || trimmedLine.startsWith('*')
    ? escapedLine
    : `<strong>${escapedLine}</strong>`
}

function formatBlock(lines: string[]) {
  return lines.map(formatLine).join('<br>')
}

function formatPowerPreference(
  powerPreference: BabylonConfigurationModel['powerPreference']
) {
  return powerPreference === 'high-performance' ? 'high' : powerPreference
}

function formatConfigText(configuration: BabylonConfigurationModel) {
  const lines = [
    'Config',
    `    • Antialias = ${configuration.antialias}`,
    `    • AdaptToDeviceRatio = ${configuration.adaptToDeviceRatio}`,
    `    • PowerPreference = ${
      formatPowerPreference(configuration.powerPreference)
    }`
  ]

  return formatBlock(lines)
}

function formatRenderingText(
  renderingType: 'WebGPU' | 'WebGL',
  resolution?: string,
  fps?: number
) {
  const lines = ['Rendering', `    • Type = ${renderingType}`]

  if (resolution) {
    lines.push(`• Resolution = ${resolution}`)
  }
  if (typeof fps === 'number') {
    lines.push(`• FPS = ${fps}`)
  }
  return formatBlock(lines)
}

function getCornerUI(): HTMLDivElement {
  let cornerUI = document.getElementById('CornerUI') as HTMLDivElement | null

  if (!cornerUI) {
    cornerUI = document.createElement('div')
    cornerUI.id = 'CornerUI'
    cornerUI.style.position = 'fixed'
    cornerUI.style.right = '10px'
    cornerUI.style.bottom = '10px'
    cornerUI.style.display = 'flex'
    cornerUI.style.flexDirection = 'column'
    cornerUI.style.alignItems = 'flex-end'
    cornerUI.style.gap = '8px'
    cornerUI.style.zIndex = '1001'
    document.body.appendChild(cornerUI)
  }

  return cornerUI
}

export interface HudApi {
  setResolution: (nextResolution: string) => void
  setFPS: (fps: number) => void
}

export interface HudOptions {
  configuration: BabylonConfigurationModel
  renderingType: 'WebGPU' | 'WebGL'
  resolution?: string
  shortcuts?: string[]
  compatibilityNotice?: string
}

export function createHUD(options: HudOptions): HudApi {
  const {
    configuration,
    renderingType,
    resolution,
    compatibilityNotice,
    shortcuts = DEFAULT_SHORTCUTS
  } = options
  let currentResolution = resolution
  let currentFPS = 0

  const cornerUI = getCornerUI()
  const configElem = new TextElement('', '10px')
  const renderElem = new TextElement('', '10px')

  configElem.setHTML(formatConfigText(configuration))
  configElem.element.style.position = 'static'
  configElem.element.style.margin = '0'
  cornerUI.appendChild(configElem.element)

  renderElem.setHTML(
    formatRenderingText(renderingType, currentResolution, currentFPS)
  )
  renderElem.element.style.position = 'static'
  renderElem.element.style.margin = '0'
  cornerUI.appendChild(renderElem.element)

  const shortcutLines = ['Shortcuts', ...shortcuts.map(s => `    • ${s}`)]
  const shortcutElem = new TextElement('', '70px')
  shortcutElem.setHTML(formatBlock(shortcutLines))
  shortcutElem.element.style.position = 'static'
  shortcutElem.element.style.margin = '0'
  cornerUI.appendChild(shortcutElem.element)

  if (compatibilityNotice) {
    const compatibilityElem = new TextElement('', '10px')
    compatibilityElem.element.style.position = 'fixed'
    compatibilityElem.element.style.left = '10px'
    compatibilityElem.element.style.top = '10px'
    compatibilityElem.element.style.width = '220px'
    compatibilityElem.setText(compatibilityNotice)
    document.body.appendChild(compatibilityElem.element)
  }

  return {
    setResolution: (nextResolution: string) => {
      currentResolution = nextResolution
      renderElem.setHTML(
        formatRenderingText(renderingType, currentResolution, currentFPS)
      )
    },
    setFPS: (fps: number) => {
      currentFPS = fps
      renderElem.setHTML(
        formatRenderingText(renderingType, currentResolution, currentFPS)
      )
    }
  }
}

export function bindInspectorAvoidance(
  canvas: HTMLCanvasElement
): () => void {
  const adjustHudOffsets = () => {
    const inspector = document.querySelector('.babylonjs-inspector') as
      | HTMLElement
      | null
    let inspectorWidth = 0

    if (inspector) {
      const canvasRect = canvas.getBoundingClientRect()
      const inspectorRect = inspector.getBoundingClientRect()
      const overlapsRightEdge =
        inspectorRect.left < canvasRect.right &&
        inspectorRect.right > canvasRect.right

      if (overlapsRightEdge) {
        inspectorWidth = inspectorRect.right - canvasRect.right
      }
    }

    const right = inspectorWidth ? `${inspectorWidth}px` : '10px'
    document.querySelectorAll<HTMLElement>('#CornerUI').forEach(el => {
      el.style.right = right
    })
    document.querySelectorAll<HTMLElement>('.info-overlay').forEach(el => {
      el.style.right = right
    })
    document.querySelectorAll<HTMLElement>('.TextElement').forEach(el => {
      el.style.right = right
    })
  }

  const observer = new MutationObserver(() => adjustHudOffsets())
  observer.observe(document.body, { childList: true, subtree: true })
  const handleResize = () => adjustHudOffsets()
  window.addEventListener('resize', handleResize)
  adjustHudOffsets()

  return () => {
    observer.disconnect()
    window.removeEventListener('resize', handleResize)
  }
}
