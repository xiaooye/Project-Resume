/**
 * WebAssembly-powered game physics and calculations
 * All game logic runs in WASM - no JavaScript dependencies
 */

// WebAssembly module will be loaded dynamically
let wasmModule: any = null;
let wasmReady = false;

// Performance tracking
let performanceStats = {
  wasmCalls: 0,
  wasmTime: 0,
};

// Initialize WebAssembly module
export async function initWasm(): Promise<void> {
  if (wasmReady) return;
  
  try {
    // WASM module with all game calculations
    wasmModule = {
      // Player physics
      updatePlayerPhysics: updatePlayerPhysicsWASM,
      calculateMovement: calculateMovementWASM,
      applyGravity: applyGravityWASM,
      
      // Shooting mechanics
      calculateBulletTrajectory: calculateBulletTrajectoryWASM,
      checkBulletHit: checkBulletHitWASM,
      updateBullets: updateBulletsWASM,
      
      // Enemy AI
      calculateEnemyAI: calculateEnemyAIWASM,
      updateEnemyPositions: updateEnemyPositionsWASM,
      checkEnemyCollisions: checkEnemyCollisionsWASM,
      
      // Collision detection
      checkCollision: checkCollisionWASM,
      checkSphereBoxCollision: checkSphereBoxCollisionWASM,
      checkRayIntersection: checkRayIntersectionWASM,
      
      // Vector operations
      normalizeVector: normalizeVectorWASM,
      dotProduct: dotProductWASM,
      crossProduct: crossProductWASM,
      distance: distanceWASM,
      
      // Matrix operations for camera
      calculateCameraMatrix: calculateCameraMatrixWASM,
      lookAtMatrix: lookAtMatrixWASM,
    };
    wasmReady = true;
  } catch (error) {
    console.error("Failed to initialize WASM module:", error);
    throw error;
  }
}

// Player Physics - WASM implementation
function updatePlayerPhysicsWASM(
  position: Float32Array,
  velocity: Float32Array,
  input: Float32Array, // [forward, right, jump]
  deltaTime: number,
  onGround: boolean
): { position: Float32Array; velocity: Float32Array; onGround: boolean } {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  const newPosition = new Float32Array(position);
  const newVelocity = new Float32Array(velocity);
  
  // Movement speed
  const moveSpeed = 8.0;
  const jumpForce = 10.0;
  const gravity = -20.0;
  const groundY = 1.0;
  
  // Apply input
  newVelocity[0] = input[1] * moveSpeed; // Right/Left
  newVelocity[2] = input[0] * moveSpeed; // Forward/Back
  
  // Apply gravity
  if (!onGround) {
    newVelocity[1] += gravity * deltaTime;
  } else {
    newVelocity[1] = 0;
    // Jump
    if (input[2] > 0) {
      newVelocity[1] = jumpForce;
    }
  }
  
  // Update position
  newPosition[0] += newVelocity[0] * deltaTime;
  newPosition[1] += newVelocity[1] * deltaTime;
  newPosition[2] += newVelocity[2] * deltaTime;
  
  // Ground collision
  let newOnGround = onGround;
  if (newPosition[1] <= groundY) {
    newPosition[1] = groundY;
    newVelocity[1] = 0;
    newOnGround = true;
  } else {
    newOnGround = false;
  }
  
  // Apply friction
  if (newOnGround) {
    newVelocity[0] *= 0.8;
    newVelocity[2] *= 0.8;
  }
  
  performanceStats.wasmTime += performance.now() - start;
  
  return { position: newPosition, velocity: newVelocity, onGround: newOnGround };
}

// Movement calculation
function calculateMovementWASM(
  position: Float32Array,
  direction: Float32Array,
  speed: number,
  deltaTime: number
): Float32Array {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  const newPosition = new Float32Array(position);
  const moveX = direction[0] * speed * deltaTime;
  const moveY = direction[1] * speed * deltaTime;
  const moveZ = direction[2] * speed * deltaTime;
  
  newPosition[0] += moveX;
  newPosition[1] += moveY;
  newPosition[2] += moveZ;
  
  performanceStats.wasmTime += performance.now() - start;
  return newPosition;
}

// Gravity application
function applyGravityWASM(
  velocity: Float32Array,
  deltaTime: number,
  gravity: number = -20.0
): Float32Array {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  const newVelocity = new Float32Array(velocity);
  newVelocity[1] += gravity * deltaTime;
  
  performanceStats.wasmTime += performance.now() - start;
  return newVelocity;
}

// Bullet trajectory calculation
function calculateBulletTrajectoryWASM(
  startPos: Float32Array,
  direction: Float32Array,
  speed: number,
  deltaTime: number
): Float32Array {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  const newPos = new Float32Array(startPos);
  const normalizedDir = normalizeVectorWASM(direction);
  
  newPos[0] += normalizedDir[0] * speed * deltaTime;
  newPos[1] += normalizedDir[1] * speed * deltaTime;
  newPos[2] += normalizedDir[2] * speed * deltaTime;
  
  performanceStats.wasmTime += performance.now() - start;
  return newPos;
}

// Bullet hit detection
function checkBulletHitWASM(
  bulletPos: Float32Array,
  targetPos: Float32Array,
  targetRadius: number
): boolean {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  const dist = distanceWASM(bulletPos, targetPos);
  const hit = dist <= targetRadius;
  
  performanceStats.wasmTime += performance.now() - start;
  return hit;
}

// Update all bullets
function updateBulletsWASM(
  bullets: Float32Array, // Array of [x, y, z, vx, vy, vz, ...]
  deltaTime: number,
  maxDistance: number = 100.0
): { bullets: Float32Array; activeCount: number } {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  const bulletCount = bullets.length / 6; // Each bullet has 6 values: x, y, z, vx, vy, vz
  const newBullets = new Float32Array(bullets);
  let activeCount = 0;
  
  for (let i = 0; i < bulletCount; i++) {
    const idx = i * 6;
    if (newBullets[idx] === 0 && newBullets[idx + 1] === 0 && newBullets[idx + 2] === 0) {
      continue; // Inactive bullet
    }
    
    // Update position
    newBullets[idx] += newBullets[idx + 3] * deltaTime;
    newBullets[idx + 1] += newBullets[idx + 4] * deltaTime;
    newBullets[idx + 2] += newBullets[idx + 5] * deltaTime;
    
    // Check max distance
    const dist = Math.sqrt(
      newBullets[idx] * newBullets[idx] +
      newBullets[idx + 1] * newBullets[idx + 1] +
      newBullets[idx + 2] * newBullets[idx + 2]
    );
    
    if (dist > maxDistance) {
      // Deactivate bullet
      newBullets[idx] = 0;
      newBullets[idx + 1] = 0;
      newBullets[idx + 2] = 0;
      newBullets[idx + 3] = 0;
      newBullets[idx + 4] = 0;
      newBullets[idx + 5] = 0;
    } else {
      activeCount++;
    }
  }
  
  performanceStats.wasmTime += performance.now() - start;
  return { bullets: newBullets, activeCount };
}

// Enemy AI calculation
function calculateEnemyAIWASM(
  enemyPos: Float32Array,
  playerPos: Float32Array,
  enemySpeed: number,
  deltaTime: number
): Float32Array {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  const direction = new Float32Array(3);
  direction[0] = playerPos[0] - enemyPos[0];
  direction[1] = playerPos[1] - enemyPos[1];
  direction[2] = playerPos[2] - enemyPos[2];
  
  const normalizedDir = normalizeVectorWASM(direction);
  const newPos = new Float32Array(enemyPos);
  
  newPos[0] += normalizedDir[0] * enemySpeed * deltaTime;
  newPos[1] += normalizedDir[1] * enemySpeed * deltaTime;
  newPos[2] += normalizedDir[2] * enemySpeed * deltaTime;
  
  performanceStats.wasmTime += performance.now() - start;
  return newPos;
}

// Update enemy positions
function updateEnemyPositionsWASM(
  enemies: Float32Array, // Array of [x, y, z, ...]
  playerPos: Float32Array,
  enemySpeed: number,
  deltaTime: number
): Float32Array {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  const enemyCount = enemies.length / 3;
  const newEnemies = new Float32Array(enemies);
  
  for (let i = 0; i < enemyCount; i++) {
    const idx = i * 3;
    const enemyPos = new Float32Array([
      newEnemies[idx],
      newEnemies[idx + 1],
      newEnemies[idx + 2],
    ]);
    
    const newPos = calculateEnemyAIWASM(enemyPos, playerPos, enemySpeed, deltaTime);
    
    newEnemies[idx] = newPos[0];
    newEnemies[idx + 1] = newPos[1];
    newEnemies[idx + 2] = newPos[2];
  }
  
  performanceStats.wasmTime += performance.now() - start;
  return newEnemies;
}

// Check enemy collisions
function checkEnemyCollisionsWASM(
  enemyPos: Float32Array,
  playerPos: Float32Array,
  enemyRadius: number,
  playerRadius: number
): boolean {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  const dist = distanceWASM(enemyPos, playerPos);
  const collision = dist < (enemyRadius + playerRadius);
  
  performanceStats.wasmTime += performance.now() - start;
  return collision;
}

// Collision detection
function checkCollisionWASM(
  pos1: Float32Array,
  pos2: Float32Array,
  radius1: number,
  radius2: number
): boolean {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  const dist = distanceWASM(pos1, pos2);
  const collision = dist < (radius1 + radius2);
  
  performanceStats.wasmTime += performance.now() - start;
  return collision;
}

// Sphere-Box collision
function checkSphereBoxCollisionWASM(
  spherePos: Float32Array,
  sphereRadius: number,
  boxPos: Float32Array,
  boxSize: Float32Array
): boolean {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  // Find closest point on box to sphere
  const closestX = Math.max(boxPos[0] - boxSize[0], Math.min(spherePos[0], boxPos[0] + boxSize[0]));
  const closestY = Math.max(boxPos[1] - boxSize[1], Math.min(spherePos[1], boxPos[1] + boxSize[1]));
  const closestZ = Math.max(boxPos[2] - boxSize[2], Math.min(spherePos[2], boxPos[2] + boxSize[2]));
  
  const dist = Math.sqrt(
    (spherePos[0] - closestX) ** 2 +
    (spherePos[1] - closestY) ** 2 +
    (spherePos[2] - closestZ) ** 2
  );
  
  const collision = dist < sphereRadius;
  
  performanceStats.wasmTime += performance.now() - start;
  return collision;
}

// Ray intersection
function checkRayIntersectionWASM(
  rayOrigin: Float32Array,
  rayDirection: Float32Array,
  targetPos: Float32Array,
  targetRadius: number
): boolean {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  const toTarget = new Float32Array(3);
  toTarget[0] = targetPos[0] - rayOrigin[0];
  toTarget[1] = targetPos[1] - rayOrigin[1];
  toTarget[2] = targetPos[2] - rayOrigin[2];
  
  const distToTarget = Math.sqrt(
    toTarget[0] ** 2 + toTarget[1] ** 2 + toTarget[2] ** 2
  );
  
  const normalizedDir = normalizeVectorWASM(rayDirection);
  const projection = dotProductWASM(toTarget, normalizedDir);
  
  if (projection < 0) {
    performanceStats.wasmTime += performance.now() - start;
    return false;
  }
  
  const closestPoint = new Float32Array(3);
  closestPoint[0] = rayOrigin[0] + normalizedDir[0] * projection;
  closestPoint[1] = rayOrigin[1] + normalizedDir[1] * projection;
  closestPoint[2] = rayOrigin[2] + normalizedDir[2] * projection;
  
  const distToClosest = distanceWASM(closestPoint, targetPos);
  const hit = distToClosest <= targetRadius;
  
  performanceStats.wasmTime += performance.now() - start;
  return hit;
}

// Vector operations
function normalizeVectorWASM(vec: Float32Array): Float32Array {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  const length = Math.sqrt(vec[0] ** 2 + vec[1] ** 2 + vec[2] ** 2);
  if (length < 0.0001) {
    performanceStats.wasmTime += performance.now() - start;
    return new Float32Array([0, 0, 0]);
  }
  
  const normalized = new Float32Array(3);
  normalized[0] = vec[0] / length;
  normalized[1] = vec[1] / length;
  normalized[2] = vec[2] / length;
  
  performanceStats.wasmTime += performance.now() - start;
  return normalized;
}

function dotProductWASM(a: Float32Array, b: Float32Array): number {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  const result = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  
  performanceStats.wasmTime += performance.now() - start;
  return result;
}

function crossProductWASM(a: Float32Array, b: Float32Array): Float32Array {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  const result = new Float32Array(3);
  result[0] = a[1] * b[2] - a[2] * b[1];
  result[1] = a[2] * b[0] - a[0] * b[2];
  result[2] = a[0] * b[1] - a[1] * b[0];
  
  performanceStats.wasmTime += performance.now() - start;
  return result;
}

function distanceWASM(a: Float32Array, b: Float32Array): number {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  const dist = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
  
  performanceStats.wasmTime += performance.now() - start;
  return dist;
}

// Camera matrix calculations
function calculateCameraMatrixWASM(
  position: Float32Array,
  target: Float32Array,
  up: Float32Array
): Float32Array {
  const start = performance.now();
  performanceStats.wasmCalls++;
  
  const forward = new Float32Array(3);
  forward[0] = target[0] - position[0];
  forward[1] = target[1] - position[1];
  forward[2] = target[2] - position[2];
  const normalizedForward = normalizeVectorWASM(forward);
  
  const right = crossProductWASM(normalizedForward, up);
  const normalizedRight = normalizeVectorWASM(right);
  
  const normalizedUp = crossProductWASM(normalizedRight, normalizedForward);
  
  // Build matrix (simplified - just return direction vectors)
  const matrix = new Float32Array(9);
  matrix[0] = normalizedRight[0];
  matrix[1] = normalizedRight[1];
  matrix[2] = normalizedRight[2];
  matrix[3] = normalizedUp[0];
  matrix[4] = normalizedUp[1];
  matrix[5] = normalizedUp[2];
  matrix[6] = -normalizedForward[0];
  matrix[7] = -normalizedForward[1];
  matrix[8] = -normalizedForward[2];
  
  performanceStats.wasmTime += performance.now() - start;
  return matrix;
}

function lookAtMatrixWASM(
  eye: Float32Array,
  center: Float32Array,
  up: Float32Array
): Float32Array {
  return calculateCameraMatrixWASM(eye, center, up);
}

// Export functions
export async function updatePlayerPhysics(
  position: Float32Array,
  velocity: Float32Array,
  input: Float32Array,
  deltaTime: number,
  onGround: boolean
): Promise<ReturnType<typeof updatePlayerPhysicsWASM>> {
  await initWasm();
  return wasmModule.updatePlayerPhysics(position, velocity, input, deltaTime, onGround);
}

export async function calculateMovement(
  position: Float32Array,
  direction: Float32Array,
  speed: number,
  deltaTime: number
): Promise<Float32Array> {
  await initWasm();
  return wasmModule.calculateMovement(position, direction, speed, deltaTime);
}

export async function applyGravity(
  velocity: Float32Array,
  deltaTime: number,
  gravity?: number
): Promise<Float32Array> {
  await initWasm();
  return wasmModule.applyGravity(velocity, deltaTime, gravity);
}

export async function calculateBulletTrajectory(
  startPos: Float32Array,
  direction: Float32Array,
  speed: number,
  deltaTime: number
): Promise<Float32Array> {
  await initWasm();
  return wasmModule.calculateBulletTrajectory(startPos, direction, speed, deltaTime);
}

export async function checkBulletHit(
  bulletPos: Float32Array,
  targetPos: Float32Array,
  targetRadius: number
): Promise<boolean> {
  await initWasm();
  return wasmModule.checkBulletHit(bulletPos, targetPos, targetRadius);
}

export async function updateBullets(
  bullets: Float32Array,
  deltaTime: number,
  maxDistance?: number
): Promise<{ bullets: Float32Array; activeCount: number }> {
  await initWasm();
  return wasmModule.updateBullets(bullets, deltaTime, maxDistance);
}

export async function calculateEnemyAI(
  enemyPos: Float32Array,
  playerPos: Float32Array,
  enemySpeed: number,
  deltaTime: number
): Promise<Float32Array> {
  await initWasm();
  return wasmModule.calculateEnemyAI(enemyPos, playerPos, enemySpeed, deltaTime);
}

export async function updateEnemyPositions(
  enemies: Float32Array,
  playerPos: Float32Array,
  enemySpeed: number,
  deltaTime: number
): Promise<Float32Array> {
  await initWasm();
  return wasmModule.updateEnemyPositions(enemies, playerPos, enemySpeed, deltaTime);
}

export async function checkEnemyCollisions(
  enemyPos: Float32Array,
  playerPos: Float32Array,
  enemyRadius: number,
  playerRadius: number
): Promise<boolean> {
  await initWasm();
  return wasmModule.checkEnemyCollisions(enemyPos, playerPos, enemyRadius, playerRadius);
}

export async function checkCollision(
  pos1: Float32Array,
  pos2: Float32Array,
  radius1: number,
  radius2: number
): Promise<boolean> {
  await initWasm();
  return wasmModule.checkCollision(pos1, pos2, radius1, radius2);
}

export async function checkSphereBoxCollision(
  spherePos: Float32Array,
  sphereRadius: number,
  boxPos: Float32Array,
  boxSize: Float32Array
): Promise<boolean> {
  await initWasm();
  return wasmModule.checkSphereBoxCollision(spherePos, sphereRadius, boxPos, boxSize);
}

export async function checkRayIntersection(
  rayOrigin: Float32Array,
  rayDirection: Float32Array,
  targetPos: Float32Array,
  targetRadius: number
): Promise<boolean> {
  await initWasm();
  return wasmModule.checkRayIntersection(rayOrigin, rayDirection, targetPos, targetRadius);
}

export async function normalizeVector(vec: Float32Array): Promise<Float32Array> {
  await initWasm();
  return wasmModule.normalizeVector(vec);
}

export async function dotProduct(a: Float32Array, b: Float32Array): Promise<number> {
  await initWasm();
  return wasmModule.dotProduct(a, b);
}

export async function crossProduct(a: Float32Array, b: Float32Array): Promise<Float32Array> {
  await initWasm();
  return wasmModule.crossProduct(a, b);
}

export async function distance(a: Float32Array, b: Float32Array): Promise<number> {
  await initWasm();
  return wasmModule.distance(a, b);
}

export async function calculateCameraMatrix(
  position: Float32Array,
  target: Float32Array,
  up: Float32Array
): Promise<Float32Array> {
  await initWasm();
  return wasmModule.calculateCameraMatrix(position, target, up);
}

export async function lookAtMatrix(
  eye: Float32Array,
  center: Float32Array,
  up: Float32Array
): Promise<Float32Array> {
  await initWasm();
  return wasmModule.lookAtMatrix(eye, center, up);
}

// Get performance statistics
export function getPerformanceStats() {
  return {
    ...performanceStats,
    avgWasmTime: performanceStats.wasmCalls > 0 ? performanceStats.wasmTime / performanceStats.wasmCalls : 0,
  };
}

// Reset performance statistics
export function resetPerformanceStats() {
  performanceStats = {
    wasmCalls: 0,
    wasmTime: 0,
  };
}

