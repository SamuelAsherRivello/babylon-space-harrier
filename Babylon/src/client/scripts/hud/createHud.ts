import {
  BabylonConfigurationModel
} from '../world/model/babylonConfigurationModel'
import { TextElement } from './view/textElement'

const DEFAULT_SHORTCUTS = [
  'WASD/Arrows = Move',
  'Space = Shoot',
  'F = Fullscreen',
  'H = Hide',
  'I = Inspector'
]

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
  let debugHudRoot = document.getElementById('DebugHudRoot') as
    | HTMLDivElement
    | null

  if (!debugHudRoot) {
    debugHudRoot = document.createElement('div')
    debugHudRoot.id = 'DebugHudRoot'
    debugHudRoot.style.position = 'fixed'
    debugHudRoot.style.right = '10px'
    debugHudRoot.style.bottom = '10px'
    debugHudRoot.style.display = 'flex'
    debugHudRoot.style.flexDirection = 'column'
    debugHudRoot.style.alignItems = 'flex-end'
    debugHudRoot.style.gap = '8px'
    debugHudRoot.style.zIndex = '1001'
    document.body.appendChild(debugHudRoot)
  }

  return debugHudRoot
}

export interface DebugHudApi {
  setResolution: (nextResolution: string) => void
  setFPS: (fps: number) => void
  setVisible: (visible: boolean) => void
  isVisible: () => boolean
}

export interface DebugHudOptions {
  configuration: BabylonConfigurationModel
  renderingType: 'WebGPU' | 'WebGL'
  resolution?: string
  shortcuts?: string[]
  compatibilityNotice?: string
  hidden?: boolean
}

export interface GameHudApi {
  setScore: (score: number) => void
  setLives: (lives: number) => void
}

function ensureOrbitronFont() {
  const id = 'GameHudOrbitronFont'
  if (document.getElementById(id)) {
    return
  }

  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href =
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@600&display=swap'
  document.head.appendChild(link)
}

function formatThreeDigits(value: number) {
  return String(Math.max(0, Math.floor(value))).padStart(3, '0')
}

export function createDebugHUD(options: DebugHudOptions): DebugHudApi {
  const {
    configuration,
    renderingType,
    resolution,
    compatibilityNotice,
    hidden = false,
    shortcuts = DEFAULT_SHORTCUTS
  } = options
  let currentResolution = resolution
  let currentFPS = 0

  const debugHudRoot = getCornerUI()
  const configElem = new TextElement('', '10px')
  const renderElem = new TextElement('', '10px')

  configElem.setHTML(formatConfigText(configuration))
  configElem.element.style.position = 'static'
  configElem.element.style.margin = '0'
  debugHudRoot.appendChild(configElem.element)

  renderElem.setHTML(
    formatRenderingText(renderingType, currentResolution, currentFPS)
  )
  renderElem.element.style.position = 'static'
  renderElem.element.style.margin = '0'
  debugHudRoot.appendChild(renderElem.element)

  const shortcutLines = ['Shortcuts', ...shortcuts.map(s => `    • ${s}`)]
  const shortcutElem = new TextElement('', '70px')
  shortcutElem.setHTML(formatBlock(shortcutLines))
  shortcutElem.element.style.position = 'static'
  shortcutElem.element.style.margin = '0'
  debugHudRoot.appendChild(shortcutElem.element)
  debugHudRoot.style.display = hidden ? 'none' : 'flex'

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
    },
    setVisible: (visible: boolean) => {
      debugHudRoot.style.display = visible ? 'flex' : 'none'
    },
    isVisible: () => {
      return debugHudRoot.style.display !== 'none'
    }
  }
}

export function createGameHUD(): GameHudApi {
  ensureOrbitronFont()

  const scoreText = document.createElement('div')
  const livesText = document.createElement('div')
  const sharedStyles = [scoreText, livesText]
  for (const element of sharedStyles) {
    element.style.position = 'fixed'
    element.style.top = '14px'
    element.style.zIndex = '1002'
    element.style.fontFamily = '\'Orbitron\', \'Arial Black\', sans-serif'
    element.style.fontSize = '58px'
    element.style.letterSpacing = '2px'
    element.style.color = '#7ff9ff'
    element.style.textShadow =
      '0 0 6px rgba(127,249,255,0.55), 0 0 14px rgba(127,249,255,0.35)'
    element.style.userSelect = 'none'
    element.style.pointerEvents = 'none'
  }
  scoreText.style.left = '14px'
  livesText.style.right = '14px'
  document.body.appendChild(scoreText)
  document.body.appendChild(livesText)

  const setScore = (score: number) => {
    scoreText.textContent = `Score: ${formatThreeDigits(score)}`
  }
  const setLives = (lives: number) => {
    livesText.textContent = `Lives: ${formatThreeDigits(lives)}`
  }

  setScore(0)
  setLives(3)

  return {
    setScore,
    setLives
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
    document.querySelectorAll<HTMLElement>('#DebugHudRoot').forEach(el => {
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
