// physicsData.test.ts - Unit tests for PhysicsData class
import { describe, expect, it } from 'vitest'
import { PhysicsData } from '../../client/scripts/model/physicsModel'

describe('PhysicsData', () => {
  it('should store mass and restitution values', () => {
    const data = new PhysicsData()
    data.mass = 5
    data.restitution = 0.7

    expect(data.mass).toBe(5)
    expect(data.restitution).toBe(0.7)
  })

  it('should use default values if none provided', () => {
    const data = new PhysicsData()

    expect(data.mass).toBe(1)
    expect(data.restitution).toBe(0.9)
  })

  it('handles zero mass and restitution', () => {
    const data = new PhysicsData()
    data.mass = 0
    data.restitution = 0

    expect(data.mass).toBe(0)
    expect(data.restitution).toBe(0)
  })

  it('handles negative mass and restitution', () => {
    const data = new PhysicsData()
    data.mass = -10
    data.restitution = -0.5

    expect(data.mass).toBe(-10)
    expect(data.restitution).toBe(-0.5)
  })

  it('handles very large mass and restitution', () => {
    const data = new PhysicsData()
    data.mass = 1e12
    data.restitution = 1e6

    expect(data.mass).toBe(1e12)
    expect(data.restitution).toBe(1e6)
  })

  it('handles NaN values', () => {
    const data = new PhysicsData()
    data.mass = Number.NaN

    expect(Number.isNaN(data.mass)).toBe(true)
    expect(data.restitution).toBe(0.9)
  })
})
