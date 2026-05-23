import * as BABYLON from '@babylonjs/core'
import { Tweens } from './tweens'

export class Orbiter {
  private angle: number
  private traveledAngle = 0
  private shrinking = false
  private disposed = false

  constructor(
    private readonly mesh: BABYLON.Mesh,
    private readonly origin: BABYLON.Vector3,
    angle: number,
    private readonly speed: number,
    private readonly radius: number,
    private readonly height: number,
    private readonly targetScale: number,
    private readonly tweens: Tweens
  ) {
    this.angle = angle
    this.updatePosition()
    this.tweens.scale(this.mesh, 0, this.targetScale, 0.5)
  }

  public update(deltaSeconds: number): boolean {
    if (this.disposed) {
      return false
    }

    const deltaAngle = this.speed * deltaSeconds
    this.angle += deltaAngle
    this.traveledAngle += deltaAngle
    this.updatePosition()
    this.mesh.rotate(BABYLON.Axis.Y, deltaAngle, BABYLON.Space.LOCAL)

    if (!this.shrinking && this.traveledAngle >= Math.PI * 4) {
      this.shrinking = true
      this.tweens.scale(this.mesh, this.targetScale, 0, 0.5, () => {
        this.disposed = true
        this.mesh.dispose()
      })
    }

    return !this.disposed
  }

  private updatePosition(): void {
    this.mesh.position.set(
      this.origin.x + Math.cos(this.angle) * this.radius,
      this.height,
      this.origin.z + Math.sin(this.angle) * this.radius
    )
  }
}
