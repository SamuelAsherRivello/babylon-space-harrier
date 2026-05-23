import * as BABYLON from '@babylonjs/core'

export class Tweens {
  public scale(
    mesh: BABYLON.Mesh,
    from: number,
    to: number,
    durationSeconds: number,
    onComplete?: () => void
  ): void {
    const scene = mesh.getScene()
    const fromScale = new BABYLON.Vector3(from, from, from)
    const toScale = new BABYLON.Vector3(to, to, to)
    let elapsedSeconds = 0

    mesh.scaling.copyFrom(fromScale)

    const observer = scene.onBeforeRenderObservable.add(() => {
      const deltaSeconds = scene.getEngine().getDeltaTime() / 1000
      elapsedSeconds = Math.min(
        elapsedSeconds + deltaSeconds,
        durationSeconds
      )

      const progress = durationSeconds === 0
        ? 1
        : elapsedSeconds / durationSeconds
      BABYLON.Vector3.LerpToRef(
        fromScale,
        toScale,
        progress,
        mesh.scaling
      )

      if (progress >= 1) {
        scene.onBeforeRenderObservable.remove(observer)
        onComplete?.()
      }
    })
  }
}
