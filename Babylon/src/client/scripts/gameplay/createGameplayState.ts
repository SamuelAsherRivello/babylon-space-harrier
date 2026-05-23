import * as BABYLON from '@babylonjs/core'
import '@babylonjs/loaders/glTF'
import { playSound } from './sound'

export interface ShipMovementState {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
}

export interface GameplayStateOptions {
  scene: BABYLON.Scene
  camera: BABYLON.ArcRotateCamera
  movementSpeed?: number
  boundsPadding?: number
  shipAssetPath?: string
  shipOrigin?: BABYLON.Vector3
  onPlayerHitEnemy?: () => void
}

export interface GameplayStateApi {
  setMovementInput: (input: Partial<ShipMovementState>) => void
  shoot: () => void
  update: (deltaSeconds: number) => void
}

const DEFAULT_MOVEMENT_SPEED = 25
const PLAYER_ACCEL_TIME_SECONDS = 0.375
const DEFAULT_BOUNDS_PADDING = 0.4
const DEFAULT_SHIP_PATH = '/assets/models/glb/player_space_ship.glb'
const DEFAULT_ENEMY_PATH = '/assets/models/glb/enemy_space_ship.glb'
const DEFAULT_BULLET_SPEED = 180
const DEFAULT_BULLET_LIFETIME = 5
const BULLET_DIAMETER = 1.5
const ENEMY_FIRE_INTERVAL_SECONDS = 1.2
const ENEMY_SCALE = 0.35
const BULLET_FIRE_SOUND_PATH = '/assets/audio/Pop01.mp3'
const SPAWNER_ENEMY_Z = 500
const SPAWNER_INTERVAL_SECONDS = 3
const SPAWNER_MOVE_SPEED = 90
const ENEMY_AXIS_ROTATIONS = [
  new BABYLON.Vector3(0, 0, 0),
  new BABYLON.Vector3(0, Math.PI, 0),
  new BABYLON.Vector3(0, Math.PI / 2, 0),
  new BABYLON.Vector3(0, -Math.PI / 2, 0),
  new BABYLON.Vector3(-Math.PI / 2, 0, 0),
  new BABYLON.Vector3(Math.PI / 2, 0, 0)
]
// Model orientation baseline: index 4 is the approved enemy facing setup.
const ENEMY_PREFERRED_ROTATION_INDEX = 4
const PLAYER_HIT_RADIUS = 2
const ENEMY_HIT_RADIUS = 3
const TRAIL_EMIT_RATE = 160
const TRAIL_PARTICLE_LIFE = 0.5

function facingAwayQuaternion(
  camera: BABYLON.ArcRotateCamera,
  shipOrigin: BABYLON.Vector3
) {
  const awayFromCamera = shipOrigin.subtract(camera.position)
  const yaw = Math.atan2(awayFromCamera.x, awayFromCamera.z)
  return BABYLON.Quaternion.FromEulerAngles(0, yaw, 0)
}

function clamp(value: number, min: number, max: number) {
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}

function moveToward(current: number, target: number, maxDelta: number) {
  if (current < target) {
    return Math.min(current + maxDelta, target)
  }
  if (current > target) {
    return Math.max(current - maxDelta, target)
  }
  return current
}

function computeScreenBounds(
  camera: BABYLON.ArcRotateCamera,
  engine: BABYLON.AbstractEngine,
  z: number,
  padding: number
) {
  if (camera.mode === BABYLON.Camera.ORTHOGRAPHIC_CAMERA) {
    const left = camera.orthoLeft ?? -1
    const right = camera.orthoRight ?? 1
    const bottom = camera.orthoBottom ?? -1
    const top = camera.orthoTop ?? 1

    return {
      minX: left + padding,
      maxX: right - padding,
      minY: bottom + padding,
      maxY: top - padding
    }
  }

  const distance = Math.abs(camera.position.z - z)
  const halfHeight = Math.tan(camera.fov / 2) * distance
  const aspect =
    engine.getRenderWidth() / Math.max(1, engine.getRenderHeight())
  const halfWidth = halfHeight * aspect

  return {
    minX: -halfWidth + padding,
    maxX: halfWidth - padding,
    minY: -halfHeight + padding,
    maxY: halfHeight - padding
  }
}

function createBullet(
  scene: BABYLON.Scene,
  ship: BABYLON.TransformNode
): BABYLON.Mesh {
  const bullet = BABYLON.MeshBuilder.CreateSphere('bullet', {
    diameter: BULLET_DIAMETER,
    segments: 16
  }, scene)
  bullet.position = ship.position.clone()
  bullet.isPickable = false
  return bullet
}

function makeBulletMaterial(scene: BABYLON.Scene) {
  const material = new BABYLON.StandardMaterial('bulletShared', scene)
  material.diffuseColor = new BABYLON.Color3(1, 1, 1)
  material.emissiveColor = new BABYLON.Color3(1, 1, 1)
  return material
}

function makeEnemyBulletMaterial(scene: BABYLON.Scene) {
  const material = new BABYLON.StandardMaterial('enemyBulletShared', scene)
  material.diffuseColor = new BABYLON.Color3(0, 0, 0)
  material.emissiveColor = new BABYLON.Color3(0, 0, 0)
  return material
}

interface Bullet {
  mesh: BABYLON.Mesh
  remainingLifetime: number
  speedZ: number
  owner: 'player' | 'enemy'
  trail?: BABYLON.ParticleSystem
}

interface EnemyShip {
  mesh: BABYLON.TransformNode
  fireCooldownSeconds: number
}

function createFallbackShip(
  scene: BABYLON.Scene,
  name: string
): BABYLON.TransformNode {
  const shipRoot = new BABYLON.TransformNode(name, scene)
  const geometry = BABYLON.MeshBuilder.CreateCapsule(
    `${name}-fallback`,
    { radius: 0.3, height: 1 },
    scene
  )
  const material = new BABYLON.StandardMaterial(`${name}-fallbackMat`, scene)
  material.emissiveColor = new BABYLON.Color3(0.2, 0.8, 1)
  geometry.material = material
  geometry.isPickable = false
  geometry.parent = shipRoot
  return shipRoot
}

async function createModelRoot(
  scene: BABYLON.Scene,
  modelPath: string,
  name: string,
  fallback?: (scene: BABYLON.Scene, name: string) => BABYLON.TransformNode
): Promise<BABYLON.TransformNode> {
  try {
    const { meshes, transformNodes } =
      await BABYLON.SceneLoader.ImportMeshAsync('', '', modelPath, scene)
    const root = new BABYLON.TransformNode(name, scene)
    let hasChild = false

    for (const mesh of meshes) {
      if (mesh === undefined || mesh === null) {
        continue
      }
      mesh.parent = root
      hasChild = true
    }

    for (const node of transformNodes) {
      if (node === undefined || node === null) {
        continue
      }
      node.parent = root
      hasChild = true
    }

    if (!hasChild) {
      root.dispose()
      if (fallback) {
        return fallback(scene, name)
      }
      return createFallbackShip(scene, name)
    }

    return root
  } catch (error) {
    console.warn(
      `[createGameplayState] Failed to load model: ${modelPath}`,
      error
    )
    if (fallback) {
      return fallback(scene, name)
    }
    return createFallbackShip(scene, name)
  }
}

async function createPlayerShip(
  scene: BABYLON.Scene,
  shipAssetPath: string
): Promise<BABYLON.TransformNode> {
  return createModelRoot(scene, shipAssetPath, 'playerShip', createFallbackShip)
}

function createFallbackEnemy(scene: BABYLON.Scene, name: string) {
  const enemyRoot = new BABYLON.TransformNode(name, scene)
  const enemy = BABYLON.MeshBuilder.CreateCylinder(
    `${name}-fallback`,
    {
      height: ENEMY_SCALE * 1.5,
      diameterTop: 0,
      diameterBottom: ENEMY_SCALE * 1.5
    },
    scene
  )
  const enemyMaterial = new BABYLON.StandardMaterial('enemyMaterial', scene)
  enemyMaterial.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2)
  enemyMaterial.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2)
  enemy.material = enemyMaterial
  enemy.isPickable = false
  enemy.parent = enemyRoot
  return enemyRoot
}

async function createEnemyShip(
  scene: BABYLON.Scene
): Promise<BABYLON.TransformNode> {
  const enemy = await createModelRoot(
    scene,
    DEFAULT_ENEMY_PATH,
    'enemyShip',
    createFallbackEnemy
  )
  enemy.rotation = new BABYLON.Vector3(0, 0, 0)
  enemy.scaling.scaleInPlace(ENEMY_SCALE)
  return enemy
}

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function isWithinHitRange(
  origin: BABYLON.Vector3,
  target: BABYLON.Vector3,
  radius: number
) {
  const radiusSquared = radius * radius
  return BABYLON.Vector3.DistanceSquared(origin, target) <= radiusSquared
}

function createTrailTexture(scene: BABYLON.Scene) {
  const texture = new BABYLON.DynamicTexture(
    'playerBulletTrailTexture',
    { width: 64, height: 64 },
    scene,
    true
  )
  const ctx = texture.getContext()
  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 30)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.4, 'rgba(127,249,255,0.8)')
  gradient.addColorStop(1, 'rgba(127,249,255,0)')
  ctx.clearRect(0, 0, 64, 64)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  texture.update(false)
  return texture
}

function createPlayerBulletTrail(
  scene: BABYLON.Scene,
  emitter: BABYLON.Mesh,
  trailTexture: BABYLON.Texture
) {
  const trail = new BABYLON.ParticleSystem('playerBulletTrail', 200, scene)
  trail.particleTexture = trailTexture
  trail.emitter = emitter
  trail.minEmitBox = new BABYLON.Vector3(0, 0, 0)
  trail.maxEmitBox = new BABYLON.Vector3(0, 0, 0)
  trail.color1 = new BABYLON.Color4(0.7, 1, 1, 0.8)
  trail.color2 = new BABYLON.Color4(0.45, 0.9, 1, 0.55)
  trail.colorDead = new BABYLON.Color4(0, 0, 0, 0)
  trail.minSize = 0.4
  trail.maxSize = 1.4
  trail.minLifeTime = TRAIL_PARTICLE_LIFE * 0.5
  trail.maxLifeTime = TRAIL_PARTICLE_LIFE
  trail.emitRate = TRAIL_EMIT_RATE
  trail.minAngularSpeed = -2
  trail.maxAngularSpeed = 2
  trail.direction1 = new BABYLON.Vector3(-0.4, -0.4, -1.2)
  trail.direction2 = new BABYLON.Vector3(0.4, 0.4, -1.2)
  trail.minEmitPower = 12
  trail.maxEmitPower = 20
  trail.updateSpeed = 0.01
  trail.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD
  trail.minEmitBox = new BABYLON.Vector3(0, 0, 0)
  trail.maxEmitBox = new BABYLON.Vector3(0, 0, 0)
  trail.start()
  return trail
}

function disposeBullet(bullet: Bullet) {
  bullet.trail?.dispose()
  bullet.mesh.dispose()
}

export async function createGameplayState(
  options: GameplayStateOptions
): Promise<GameplayStateApi> {
  const {
    scene,
    camera,
    movementSpeed = DEFAULT_MOVEMENT_SPEED,
    boundsPadding = DEFAULT_BOUNDS_PADDING,
    shipAssetPath = DEFAULT_SHIP_PATH,
    shipOrigin = BABYLON.Vector3.Zero(),
    onPlayerHitEnemy
  } = options

  const ship = await createPlayerShip(scene, shipAssetPath)
  ship.position = shipOrigin.clone()
  ship.rotationQuaternion = facingAwayQuaternion(camera, shipOrigin)

  const movement: ShipMovementState = {
    left: false,
    right: false,
    up: false,
    down: false
  }
  const velocity = new BABYLON.Vector2(0, 0)
  const bullets: Bullet[] = []
  const activeEnemies: EnemyShip[] = []
  const spawnedEnemies: EnemyShip[] = []
  let spawnCooldownSeconds = 0
  const playerBulletMaterial = makeBulletMaterial(scene)
  const enemyBulletMaterial = makeEnemyBulletMaterial(scene)
  const playerTrailTexture = createTrailTexture(scene)

  const spawnEnemyFromDistance = async () => {
    const enemy = await createEnemyShip(scene)
    const playerPlaneBounds = computeScreenBounds(
      camera,
      scene.getEngine(),
      ship.position.z,
      0.1
    )
    enemy.position = new BABYLON.Vector3(
      randomRange(playerPlaneBounds.minX, playerPlaneBounds.maxX),
      randomRange(playerPlaneBounds.minY, playerPlaneBounds.maxY),
      SPAWNER_ENEMY_Z
    )
    const preferredRotation =
      ENEMY_AXIS_ROTATIONS[ENEMY_PREFERRED_ROTATION_INDEX]
    enemy.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
      preferredRotation?.x ?? 0,
      (preferredRotation?.y ?? 0) + Math.PI,
      preferredRotation?.z ?? 0
    )
    const spawned = {
      mesh: enemy,
      fireCooldownSeconds: Math.random() * ENEMY_FIRE_INTERVAL_SECONDS
    }
    spawnedEnemies.push(spawned)
    activeEnemies.push(spawned)
  }

  return {
    setMovementInput(input: Partial<ShipMovementState>) {
      if (typeof input.left === 'boolean') {
        movement.left = input.left
      }
      if (typeof input.right === 'boolean') {
        movement.right = input.right
      }
      if (typeof input.up === 'boolean') {
        movement.up = input.up
      }
      if (typeof input.down === 'boolean') {
        movement.down = input.down
      }
    },
    shoot: () => {
      const bullet = createBullet(scene, ship)
      bullet.material = playerBulletMaterial
      playSound(BULLET_FIRE_SOUND_PATH)
      bullets.push({
        mesh: bullet,
        remainingLifetime: DEFAULT_BULLET_LIFETIME,
        speedZ: DEFAULT_BULLET_SPEED,
        owner: 'player',
        trail: createPlayerBulletTrail(scene, bullet, playerTrailTexture)
      })
    },
    update: (deltaSeconds: number) => {
      spawnCooldownSeconds -= deltaSeconds
      if (spawnCooldownSeconds <= 0) {
        spawnCooldownSeconds = SPAWNER_INTERVAL_SECONDS
        void spawnEnemyFromDistance().catch(error => {
          console.error(
            '[createGameplayState] Enemy spawner load error:',
            error
          )
        })
      }

      const inputX = Number(movement.right) - Number(movement.left)
      const inputY = Number(movement.up) - Number(movement.down)
      const targetVelocityX = inputX * movementSpeed
      const targetVelocityY = inputY * movementSpeed
      const accelPerSecond =
        movementSpeed / PLAYER_ACCEL_TIME_SECONDS
      const maxVelocityDelta = accelPerSecond * deltaSeconds

      velocity.x = moveToward(
        velocity.x,
        targetVelocityX,
        maxVelocityDelta
      )
      velocity.y = moveToward(
        velocity.y,
        targetVelocityY,
        maxVelocityDelta
      )

      const bounds = computeScreenBounds(
        camera,
        scene.getEngine(),
        ship.position.z,
        boundsPadding
      )
      const intendedX = ship.position.x + velocity.x * deltaSeconds
      const intendedY = ship.position.y + velocity.y * deltaSeconds
      const nextX = clamp(
        intendedX,
        bounds.minX,
        bounds.maxX
      )
      const nextY = clamp(
        intendedY,
        bounds.minY,
        bounds.maxY
      )
      if (nextX !== intendedX) {
        velocity.x = 0
      }
      if (nextY !== intendedY) {
        velocity.y = 0
      }
      ship.position.x = nextX
      ship.position.y = nextY

      for (let i = bullets.length - 1; i >= 0; i -= 1) {
      const bullet = bullets[i]
        bullet.remainingLifetime -= deltaSeconds
        if (bullet.remainingLifetime > 0) {
          bullet.mesh.position.z += bullet.speedZ * deltaSeconds
        }

        if (bullet.remainingLifetime <= 0) {
          disposeBullet(bullet)
          bullets.splice(i, 1)
        }
      }

      for (let i = activeEnemies.length - 1; i >= 0; i -= 1) {
        const enemy = activeEnemies[i]
        enemy.fireCooldownSeconds -= deltaSeconds
        if (enemy.fireCooldownSeconds <= 0) {
          enemy.fireCooldownSeconds = ENEMY_FIRE_INTERVAL_SECONDS
          const bullet = createBullet(scene, enemy.mesh)
          bullet.material = enemyBulletMaterial
          bullets.push({
            mesh: bullet,
            remainingLifetime: DEFAULT_BULLET_LIFETIME,
            speedZ: -DEFAULT_BULLET_SPEED,
            owner: 'enemy'
          })
        }
      }

      for (let i = bullets.length - 1; i >= 0; i -= 1) {
        const bullet = bullets[i]
        if (bullet.owner === 'player') {
          let consumed = false
          for (let j = activeEnemies.length - 1; j >= 0; j -= 1) {
            const enemy = activeEnemies[j]
            if (
              !isWithinHitRange(
                bullet.mesh.position,
                enemy.mesh.position,
                ENEMY_HIT_RADIUS
              )
            ) {
              continue
            }

            consumed = true
            disposeBullet(bullet)
            bullets.splice(i, 1)
            enemy.mesh.dispose()
            activeEnemies.splice(j, 1)
            const spawnedIndex = spawnedEnemies.indexOf(enemy)
            if (spawnedIndex >= 0) {
              spawnedEnemies.splice(spawnedIndex, 1)
            }
            onPlayerHitEnemy?.()
            break
          }
          if (consumed) {
            continue
          }
        }

        if (bullet.owner !== 'enemy') {
          continue
        }
        const hitPlayer = isWithinHitRange(
          bullet.mesh.position,
          ship.position,
          PLAYER_HIT_RADIUS
        )
        if (!hitPlayer) {
          continue
        }
        disposeBullet(bullet)
        bullets.splice(i, 1)
      }

      for (let i = spawnedEnemies.length - 1; i >= 0; i -= 1) {
        const enemy = spawnedEnemies[i]
        enemy.mesh.position.z -= SPAWNER_MOVE_SPEED * deltaSeconds

        if (enemy.mesh.position.z < camera.position.z - 10) {
          enemy.mesh.dispose()
          spawnedEnemies.splice(i, 1)
          const activeIndex = activeEnemies.indexOf(enemy)
          if (activeIndex >= 0) {
            activeEnemies.splice(activeIndex, 1)
          }
        }
      }
    }
  }
}
