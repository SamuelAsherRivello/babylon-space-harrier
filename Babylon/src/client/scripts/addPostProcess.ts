// addPostProcess.ts - Configures scene post-processing.
import {
  DefaultRenderingPipeline,
  type Camera,
  type Scene
} from '@babylonjs/core'

export const addPostProcess = (scene: Scene, cameras: Camera[]) => {
  const hdr = true
  const pipeline = new DefaultRenderingPipeline(
    'standardPipeline',
    hdr,
    scene,
    cameras
  )

  pipeline.samples = 4
  pipeline.fxaaEnabled = true
  pipeline.imageProcessingEnabled = true
  pipeline.imageProcessing.contrast = 1
  pipeline.imageProcessing.exposure = 1
  pipeline.imageProcessing.toneMappingEnabled = true
  pipeline.bloomEnabled = true
  pipeline.bloomThreshold = 0.2
  pipeline.bloomWeight = 0.1
  pipeline.bloomKernel = 64
  pipeline.bloomScale = 0.5

  pipeline.depthOfFieldEnabled = false
  pipeline.depthOfField.focusDistance = 2000
  pipeline.depthOfField.focalLength = 40
  pipeline.depthOfField.fStop = 1.4
}
