# Project Spec

## Purpose

This project is a Babylon.js starter focused on a small interactive 3D
scene with physics, post-processing, and a lightweight UI overlay.

## Structure

- `Babylon/src/client/scripts/index.ts`
  Application entry point and scene bootstrap.
- `Babylon/src/client/scripts/addOrbiter.ts`
  Orbiter factory used when the user spawns a new orbiter.
- `Babylon/src/client/scripts/model/`
  Runtime tuning models used by gameplay code.
- `Babylon/src/tests/client/`
  Unit tests for project models.
- `Babylon/documentation/`
  Project documentation and reference notes.

## Runtime Behavior

- The app creates a Babylon engine and scene at startup.
- The room model is loaded from `assets/glb/pixel_room.glb`.
- Input wiring includes:
  `O` to spawn orbiters and `D` to toggle the inspector in development.
- Orbiters are created through `AddOrbiter`.
- Orbiter tuning values come from `OrbiterModel`.

## HMR

HMR stands for Hot Module Replacement.

### Goal

The current HMR setup is meant to keep the running app alive while
editing selected orbiter-related files during development.

### Current Setup

- `index.ts` accepts hot updates for `./addOrbiter.ts`.
- `index.ts` accepts hot updates for `./model/orbiterModel.ts`.
- When `addOrbiter.ts` changes, the app creates a new `AddOrbiter`
  instance and uses it for future orbiter spawns.
- When `orbiterModel.ts` changes, the app creates a new `OrbiterModel`
  instance and injects it into the current `AddOrbiter`.

### What Updates Live

- New orbiters spawned after an HMR update use the latest factory logic.
- New orbiters spawned after a model update use the latest model values.

### What Does Not Update Live

- Existing orbiters already in the scene are not rebuilt or patched.
- Scene bootstrap code outside the accepted HMR boundaries can still
  trigger a full reload.
- Files without explicit HMR accept handlers still use default Vite
  behavior.

### Operational Notes

- The current HMR path is defined in
  `Babylon/src/client/scripts/index.ts`.
- `AddOrbiter` exposes `setModel()` so the live app can swap model
  values without rebuilding the scene.
- This setup is a narrow demo, not a full app-wide HMR architecture.

## Constraints

- AI-generated code should stay at 80 characters per line or less.
- Generated files should not be manually reformatted unless requested.
