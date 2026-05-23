import { describe, expect, it } from 'vitest'
import {
  BabylonConfigurationModel
} from '../../client/scripts/model/babylonConfigurationModel'

describe('BabylonConfigurationModel', () => {
  it('uses the production engine defaults', () => {
    const model = new BabylonConfigurationModel()

    expect(model.antialias).toBe(true)
    expect(model.adaptToDeviceRatio).toBe(true)
    expect(model.powerPreference).toBe('high-performance')
  })

  it('stores custom engine configuration values', () => {
    const model = new BabylonConfigurationModel()
    model.antialias = false
    model.adaptToDeviceRatio = false
    model.powerPreference = 'low-power'

    expect(model.antialias).toBe(false)
    expect(model.adaptToDeviceRatio).toBe(false)
    expect(model.powerPreference).toBe('low-power')
  })
})
