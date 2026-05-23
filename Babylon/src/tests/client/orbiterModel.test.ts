import { describe, expect, it } from 'vitest'
import { OrbiterModel } from '../../client/scripts/model/orbiterModel'

describe('OrbiterModel', () => {
  it('uses the production orbiter defaults', () => {
    const model = new OrbiterModel()

    expect(model.sizeMinMultiplier).toBe(0.85)
    expect(model.sizeMaxMultiplier).toBe(1)
    expect(model.radiusMin).toBe(5)
    expect(model.radiusMax).toBe(7)
    expect(model.heightMin).toBe(0.8)
    expect(model.heightMax).toBe(3.2)
    expect(model.speedMin).toBe(0.4)
    expect(model.speedMax).toBe(1.4)
    expect(model.targetScaleMin).toBe(0.5)
    expect(model.targetScaleMax).toBe(1)
  })

  it('stores custom orbiter tuning values', () => {
    const model = new OrbiterModel()
    model.sizeMinMultiplier = 0.5
    model.sizeMaxMultiplier = 1.5
    model.radiusMin = 1
    model.radiusMax = 8
    model.heightMin = 0.2
    model.heightMax = 4
    model.speedMin = 0.1
    model.speedMax = 2.2
    model.targetScaleMin = 0.75
    model.targetScaleMax = 1.8

    expect(model.sizeMinMultiplier).toBe(0.5)
    expect(model.sizeMaxMultiplier).toBe(1.5)
    expect(model.radiusMin).toBe(1)
    expect(model.radiusMax).toBe(8)
    expect(model.heightMin).toBe(0.2)
    expect(model.heightMax).toBe(4)
    expect(model.speedMin).toBe(0.1)
    expect(model.speedMax).toBe(2.2)
    expect(model.targetScaleMin).toBe(0.75)
    expect(model.targetScaleMax).toBe(1.8)
  })
})
