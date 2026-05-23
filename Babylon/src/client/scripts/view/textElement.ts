// textElement.ts - Reusable styled text UI element for overlays.
import '../../styles/view/textElement.css'

export class TextElement {
  public element: HTMLDivElement
  private div: HTMLDivElement

  constructor(
    initialText: string,
    bottom: string = '10px',
    container?: HTMLElement
  ) {
    this.div = document.createElement('div')
    this.element = this.div
    this.div.className = 'TextElement'
    this.div.style.bottom = bottom
    this.div.textContent = initialText

    if (container instanceof HTMLElement) {
      container.appendChild(this.div)
    } else {
      document.body.appendChild(this.div)
    }
  }

  setText(text: string) {
    this.div.textContent = text
  }

  setHTML(html: string) {
    this.div.innerHTML = html
  }

  remove() {
    this.div.remove()
  }
}
