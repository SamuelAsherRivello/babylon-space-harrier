const DEBUG_HUD_HIDDEN_KEY = 'debugHudHidden'

function parseStoredBoolean(value: string | null) {
  return value === 'true'
}

export class DebugHudPersistence {
  loadHidden() {
    return parseStoredBoolean(localStorage.getItem(DEBUG_HUD_HIDDEN_KEY))
  }

  saveHidden(hidden: boolean) {
    localStorage.setItem(DEBUG_HUD_HIDDEN_KEY, String(hidden))
  }
}
