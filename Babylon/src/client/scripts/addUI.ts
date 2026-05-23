// addUI.ts - Adds UI elements for rendering type and shortcuts.
import { BabylonConfigurationModel } from './model/babylonConfigurationModel'
import { TextElement } from './view/textElement'

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
  return powerPreference === 'high-performance'
    ? 'high'
    : powerPreference
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

export function addUI(
  configuration: BabylonConfigurationModel,
  renderingType: 'WebGPU' | 'WebGL',
  shortcuts?: string[],
  resolution?: string
) {
  let currentResolution = resolution
  let currentFPS = 0
  let cornerUI = document.getElementById('CornerUI') as
    | HTMLDivElement
    | null

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

  const configElem = new TextElement('', '10px')
  configElem.setHTML(formatConfigText(configuration))
  configElem.element.style.position = 'static'
  configElem.element.style.margin = '0'
  cornerUI.appendChild(configElem.element)

  const renderElem = new TextElement('', '10px')
  renderElem.setHTML(
    formatRenderingText(renderingType, currentResolution, currentFPS)
  )
  renderElem.element.style.position = 'static'
  renderElem.element.style.margin = '0'
  cornerUI.appendChild(renderElem.element)

  let shortcutsElem
  if (shortcuts) {
    const shortcutLines = [
      'Shortcuts',
      ...shortcuts.map(shortcut => `    • ${shortcut}`)
    ]
    shortcutsElem = new TextElement('', '70px')
    shortcutsElem.setHTML(formatBlock(shortcutLines))
    shortcutsElem.element.style.position = 'static'
    shortcutsElem.element.style.margin = '0'
    cornerUI.appendChild(shortcutsElem.element)
  }

  return {
    configElem,
    renderElem,
    shortcutsElem,
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
