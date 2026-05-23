import * as BABYLON from '@babylonjs/core'
import { OrbiterModel } from './model/orbiterModel'
import { Orbiter } from './orbiter'
import { Tweens } from './tweens'

export class AddOrbiter {
  private orbiterCount = 0
  private orbiterModel: OrbiterModel

  constructor(
    private readonly scene: BABYLON.Scene,
    private readonly origin: BABYLON.Vector3,
    private readonly baseSize: number,
    private readonly tweens: Tweens,
    orbiterModel: OrbiterModel = new OrbiterModel()
  ) {
    this.orbiterModel = orbiterModel
  }

  public setModel(orbiterModel: OrbiterModel): void {
    this.orbiterModel = orbiterModel
  }

  public create(): Orbiter {
    const size = BABYLON.Scalar.RandomRange(
      this.baseSize * this.orbiterModel.sizeMinMultiplier,
      this.baseSize * this.orbiterModel.sizeMaxMultiplier
    )
    const radius = BABYLON.Scalar.RandomRange(
      this.orbiterModel.radiusMin,
      this.orbiterModel.radiusMax
    )
    const height = BABYLON.Scalar.RandomRange(
      this.orbiterModel.heightMin,
      this.orbiterModel.heightMax
    )
    const speed = BABYLON.Scalar.RandomRange(
      this.orbiterModel.speedMin,
      this.orbiterModel.speedMax
    )
    const angle = BABYLON.Scalar.RandomRange(0, Math.PI * 2)
    const targetScale = BABYLON.Scalar.RandomRange(
      this.orbiterModel.targetScaleMin,
      this.orbiterModel.targetScaleMax
    )
    const meshName = `orbiter-${this.orbiterCount++}`
    const primitiveType = Math.floor(Math.random() * 3)

    let mesh: BABYLON.Mesh
    if (primitiveType === 0) {
      mesh = BABYLON.MeshBuilder.CreateSphere(
        meshName,
        { diameter: size, segments: 24 },
        this.scene
      )
    } else if (primitiveType === 1) {
      mesh = BABYLON.MeshBuilder.CreateBox(
        meshName,
        { size },
        this.scene
      )
    } else {
      mesh = BABYLON.MeshBuilder.CreatePolyhedron(
        meshName,
        { size, type: 1 },
        this.scene
      )
    }

    const material = new BABYLON.StandardMaterial(
      `${meshName}-material`,
      this.scene
    )
    material.diffuseColor = new BABYLON.Color3(
      Math.random(),
      Math.random(),
      Math.random()
    )
    mesh.material = material

    return new Orbiter(
      mesh,
      this.origin.clone(),
      angle,
      speed,
      radius,
      height,
      targetScale,
      this.tweens
    )
  }
}
