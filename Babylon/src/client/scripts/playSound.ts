// playSound.ts - Plays UI and scene sound effects from public assets.

const soundCache = new Map<string, HTMLAudioElement>()

function getSound(url: string) {
  let sound = soundCache.get(url)

  if (!sound) {
    sound = new Audio(url)
    sound.preload = 'auto'
    soundCache.set(url, sound)
  }

  return sound
}

export function playSound(url: string) {
  const sound = getSound(url)
  const instance = sound.cloneNode(true) as HTMLAudioElement

  instance.loop = false
  instance.currentTime = 0
  instance.addEventListener('ended', () => {
    instance.remove()
  }, { once: true })

  void instance.play().catch(error => {
    console.warn(`[playSound] Unable to play "${url}".`, error)
  })
}
