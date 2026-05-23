# Project AI Instructions

- Keep AI-generated code at 80 characters per line or less.
- Apply the same 80-character limit when updating existing authored files.
- Exclude generated files from manual wrapping unless explicitly requested.

This document also describes the refactor boundaries for independent work.

## 3D World (`src/client/scripts/world/`)

- Purpose: initialize rendering, scene setup, physics, and post-processing.
- API: `createWorld(options)` in `world/createWorld.ts`.
- Public return: `World` with:
  - `canvas`, `scene`, `engine`, `camera`, `renderingType`
  - `getResolution()`, `resize()`, `startRenderLoop()`, `dispose()`
- Files:
  - `world/createWorld.ts`
  - `world/physics.ts`
  - `world/postProcess.ts`
  - `world/model/babylonConfigurationModel.ts`
  - `world/model/physicsData.ts`

## 2D HUD (`src/client/scripts/hud/`)

- Purpose: build and update overlay UI.
- API: `createHUD(options)` in `hud/createHud.ts` returns:
  - `setResolution(nextResolution)`
  - `setFPS(fps)`
- Input API: `createHudInputBindings()` in `hud/input.ts`.
- Files:
  - `hud/createHud.ts`
  - `hud/input.ts`
  - `hud/view/textElement.ts`

## Gameplay State (`src/client/scripts/gameplay/`)

- Purpose: orbiter rules and simulation lifecycle.
- API: `createGameplayState(options)` in `gameplay/createGameplayState.ts`.
- APIs:
  - `spawnOrbiter()`
  - `update(deltaSeconds)`
  - `setOrbiterModel(model)`
  - `setOrbiterFactory(factoryClass)`
- Files:
  - `gameplay/createGameplayState.ts`
  - `gameplay/orbiterFactory.ts`
  - `gameplay/orbiter.ts`
  - `gameplay/model/orbiterModel.ts`
  - `gameplay/sound.ts`
  - `gameplay/tweens.ts`

## Integration points

- Integration remains in `src/client/scripts/index.ts`.
- World owns scene creation; gameplay mutates scene objects passed in.
- HUD reads world rendering info and dispatches spawn callbacks.
- Gameplay owns spawn model and uses `AddOrbiter` factory for new entities.
- HMR rebind for gameplay API stays in `index.ts`.
