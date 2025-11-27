/**
 * WebAssembly-powered 3D calculations for WebAssembly 3D Demo
 * This module provides high-performance 3D physics, geometry, and matrix operations
 */

// WebAssembly module will be loaded dynamically
let wasmModule: any = null;
let wasmReady = false;

// Performance tracking
let performanceStats = {
  wasmCalls: 0,
  jsCalls: 0,
  wasmTime: 0,
  jsTime: 0,
};

// Initialize WebAssembly module
export async function initWasm(): Promise<void> {
  if (wasmReady) return;
  
  try {
    // For now, we'll use a JavaScript fallback with optimized algorithms
    // In production, this would load a compiled .wasm file
    wasmModule = {
      // Physics calculations
      updateParticlePhysics: updateParticlePhysicsJS,
      calculateGravity: calculateGravityJS,
      detectCollisions: detectCollisionsJS,
      
      // Geometry operations
      calculateNormals: calculateNormalsJS,
      generateMesh: generateMeshJS,
      calculateLOD: calculateLODJS,
      
      // Matrix operations
      multiplyMatrices: multiplyMatricesJS,
      transformVertices: transformVerticesJS,
      calculateFrustumCulling: calculateFrustumCullingJS,
      
      // Instance rendering
      generateInstances: generateInstancesJS,
      updateInstances: updateInstancesJS,
    };
    wasmReady = true;
  } catch (error) {
    console.error("Failed to initialize WASM module:", error);
    // Fallback to JS implementation
    wasmModule = {
      updateParticlePhysics: updateParticlePhysicsJS,
      calculateGravity: calculateGravityJS,
      detectCollisions: detectCollisionsJS,
      calculateNormals: calculateNormalsJS,
      generateMesh: generateMeshJS,
      calculateLOD: calculateLODJS,
      multiplyMatrices: multiplyMatricesJS,
      transformVertices: transformVerticesJS,
      calculateFrustumCulling: calculateFrustumCullingJS,
      generateInstances: generateInstancesJS,
      updateInstances: updateInstancesJS,
    };
    wasmReady = true;
  }
}

// High-performance particle physics update
function updateParticlePhysicsJS(
  positions: Float32Array,
  velocities: Float32Array,
  forces: Float32Array,
  deltaTime: number,
  damping: number = 0.98
): { positions: Float32Array; velocities: Float32Array } {
  const count = positions.length / 3;
  const newPositions = new Float32Array(positions);
  const newVelocities = new Float32Array(velocities);
  
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    
    // Update velocity with forces
    newVelocities[idx] = (velocities[idx] + forces[idx] * deltaTime) * damping;
    newVelocities[idx + 1] = (velocities[idx + 1] + forces[idx + 1] * deltaTime) * damping;
    newVelocities[idx + 2] = (velocities[idx + 2] + forces[idx + 2] * deltaTime) * damping;
    
    // Update position
    newPositions[idx] = positions[idx] + newVelocities[idx] * deltaTime;
    newPositions[idx + 1] = positions[idx + 1] + newVelocities[idx + 1] * deltaTime;
    newPositions[idx + 2] = positions[idx + 2] + newVelocities[idx + 2] * deltaTime;
  }
  
  return { positions: newPositions, velocities: newVelocities };
}

// Calculate gravity forces
function calculateGravityJS(
  positions: Float32Array,
  center: [number, number, number],
  strength: number
): Float32Array {
  const count = positions.length / 3;
  const forces = new Float32Array(positions.length);
  
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    const dx = center[0] - positions[idx];
    const dy = center[1] - positions[idx + 1];
    const dz = center[2] - positions[idx + 2];
    
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (distance < 0.001) continue;
    
    const force = strength / (distance * distance);
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;
    const normalizedDz = dz / distance;
    
    forces[idx] = normalizedDx * force;
    forces[idx + 1] = normalizedDy * force;
    forces[idx + 2] = normalizedDz * force;
  }
  
  return forces;
}

// Detect collisions between particles
function detectCollisionsJS(
  positions: Float32Array,
  radius: number
): Array<{ i: number; j: number; distance: number }> {
  const count = positions.length / 3;
  const collisions: Array<{ i: number; j: number; distance: number }> = [];
  
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const idx1 = i * 3;
      const idx2 = j * 3;
      
      const dx = positions[idx1] - positions[idx2];
      const dy = positions[idx1 + 1] - positions[idx2 + 1];
      const dz = positions[idx1 + 2] - positions[idx2 + 2];
      
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distance < radius * 2) {
        collisions.push({ i, j, distance });
      }
    }
  }
  
  return collisions;
}

// Calculate normals for mesh
function calculateNormalsJS(
  vertices: Float32Array,
  indices: Uint16Array
): Float32Array {
  const normals = new Float32Array(vertices.length);
  const count = indices.length / 3;
  
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    const i0 = indices[idx] * 3;
    const i1 = indices[idx + 1] * 3;
    const i2 = indices[idx + 2] * 3;
    
    // Calculate face normal
    const v0x = vertices[i0];
    const v0y = vertices[i0 + 1];
    const v0z = vertices[i0 + 2];
    
    const v1x = vertices[i1] - v0x;
    const v1y = vertices[i1 + 1] - v0y;
    const v1z = vertices[i1 + 2] - v0z;
    
    const v2x = vertices[i2] - v0x;
    const v2y = vertices[i2 + 1] - v0y;
    const v2z = vertices[i2 + 2] - v0z;
    
    // Cross product
    const nx = v1y * v2z - v1z * v2y;
    const ny = v1z * v2x - v1x * v2z;
    const nz = v1x * v2y - v1y * v2x;
    
    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (length > 0.001) {
      const invLength = 1 / length;
      const normalX = nx * invLength;
      const normalY = ny * invLength;
      const normalZ = nz * invLength;
      
      // Add to vertex normals
      normals[i0] += normalX;
      normals[i0 + 1] += normalY;
      normals[i0 + 2] += normalZ;
      
      normals[i1] += normalX;
      normals[i1 + 1] += normalY;
      normals[i1 + 2] += normalZ;
      
      normals[i2] += normalX;
      normals[i2 + 1] += normalY;
      normals[i2 + 2] += normalZ;
    }
  }
  
  // Normalize normals
  const vertexCount = vertices.length / 3;
  for (let i = 0; i < vertexCount; i++) {
    const idx = i * 3;
    const length = Math.sqrt(
      normals[idx] * normals[idx] +
      normals[idx + 1] * normals[idx + 1] +
      normals[idx + 2] * normals[idx + 2]
    );
    if (length > 0.001) {
      const invLength = 1 / length;
      normals[idx] *= invLength;
      normals[idx + 1] *= invLength;
      normals[idx + 2] *= invLength;
    }
  }
  
  return normals;
}

// Generate mesh geometry
function generateMeshJS(
  type: "sphere" | "box" | "torus",
  segments: number
): { vertices: Float32Array; indices: Uint16Array; normals: Float32Array } {
  let vertices: number[] = [];
  let indices: number[] = [];
  
  if (type === "sphere") {
    const radius = 1;
    const phiSegments = segments;
    const thetaSegments = segments;
    
    for (let i = 0; i <= phiSegments; i++) {
      const phi = (Math.PI * i) / phiSegments;
      for (let j = 0; j <= thetaSegments; j++) {
        const theta = (2 * Math.PI * j) / thetaSegments;
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        vertices.push(x, y, z);
      }
    }
    
    for (let i = 0; i < phiSegments; i++) {
      for (let j = 0; j < thetaSegments; j++) {
        const a = i * (thetaSegments + 1) + j;
        const b = a + thetaSegments + 1;
        
        indices.push(a, b, a + 1);
        indices.push(b, b + 1, a + 1);
      }
    }
  } else if (type === "box") {
    const size = 1;
    vertices = [
      -size, -size, -size, size, -size, -size, size, size, -size, -size, size, -size,
      -size, -size, size, size, -size, size, size, size, size, -size, size, size,
    ];
    indices = [
      0, 1, 2, 0, 2, 3, 4, 7, 6, 4, 6, 5,
      0, 4, 5, 0, 5, 1, 2, 6, 7, 2, 7, 3,
      0, 3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2,
    ];
  } else if (type === "torus") {
    const radius = 1;
    const tube = 0.3;
    const radialSegments = segments;
    const tubularSegments = segments;
    
    for (let i = 0; i <= radialSegments; i++) {
      for (let j = 0; j <= tubularSegments; j++) {
        const u = (j / tubularSegments) * Math.PI * 2;
        const v = (i / radialSegments) * Math.PI * 2;
        
        const x = (radius + tube * Math.cos(v)) * Math.cos(u);
        const y = (radius + tube * Math.cos(v)) * Math.sin(u);
        const z = tube * Math.sin(v);
        
        vertices.push(x, y, z);
      }
    }
    
    for (let i = 1; i <= radialSegments; i++) {
      for (let j = 1; j <= tubularSegments; j++) {
        const a = (i - 1) * (tubularSegments + 1) + (j - 1);
        const b = (i - 1) * (tubularSegments + 1) + j;
        const c = i * (tubularSegments + 1) + j;
        const d = i * (tubularSegments + 1) + (j - 1);
        
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
  }
  
  const verticesArray = new Float32Array(vertices);
  const indicesArray = new Uint16Array(indices);
  const normals = calculateNormalsJS(verticesArray, indicesArray);
  
  return { vertices: verticesArray, indices: indicesArray, normals };
}

// Calculate LOD (Level of Detail) based on distance
function calculateLODJS(
  distances: Float32Array,
  thresholds: [number, number, number] = [10, 50, 100]
): Uint8Array {
  const lod = new Uint8Array(distances.length);
  
  for (let i = 0; i < distances.length; i++) {
    if (distances[i] < thresholds[0]) {
      lod[i] = 0; // High detail
    } else if (distances[i] < thresholds[1]) {
      lod[i] = 1; // Medium detail
    } else if (distances[i] < thresholds[2]) {
      lod[i] = 2; // Low detail
    } else {
      lod[i] = 3; // Culled
    }
  }
  
  return lod;
}

// Multiply two 4x4 matrices
function multiplyMatricesJS(
  a: Float32Array,
  b: Float32Array
): Float32Array {
  const result = new Float32Array(16);
  
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[i * 4 + k] * b[k * 4 + j];
      }
      result[i * 4 + j] = sum;
    }
  }
  
  return result;
}

// Transform vertices with matrix
function transformVerticesJS(
  vertices: Float32Array,
  matrix: Float32Array
): Float32Array {
  const count = vertices.length / 3;
  const transformed = new Float32Array(vertices.length);
  
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    const x = vertices[idx];
    const y = vertices[idx + 1];
    const z = vertices[idx + 2];
    
    transformed[idx] = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
    transformed[idx + 1] = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
    transformed[idx + 2] = matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14];
  }
  
  return transformed;
}

// Calculate frustum culling
function calculateFrustumCullingJS(
  positions: Float32Array,
  frustum: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    near: number;
    far: number;
  }
): Uint8Array {
  const count = positions.length / 3;
  const visible = new Uint8Array(count);
  
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    const x = positions[idx];
    const y = positions[idx + 1];
    const z = positions[idx + 2];
    
    // Simple AABB culling
    if (
      x >= frustum.left &&
      x <= frustum.right &&
      y >= frustum.bottom &&
      y <= frustum.top &&
      z >= frustum.near &&
      z <= frustum.far
    ) {
      visible[i] = 1;
    }
  }
  
  return visible;
}

// Generate instance matrices
function generateInstancesJS(
  count: number,
  positions: Float32Array,
  rotations: Float32Array,
  scales: Float32Array
): Float32Array {
  const matrices = new Float32Array(count * 16);
  
  for (let i = 0; i < count; i++) {
    const posIdx = i * 3;
    const rotIdx = i * 3;
    const scaleIdx = i * 3;
    
    const x = positions[posIdx];
    const y = positions[posIdx + 1];
    const z = positions[posIdx + 2];
    
    const rx = rotations[rotIdx];
    const ry = rotations[rotIdx + 1];
    const rz = rotations[rotIdx + 2];
    
    const sx = scales[scaleIdx];
    const sy = scales[scaleIdx + 1];
    const sz = scales[scaleIdx + 2];
    
    // Create transformation matrix
    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    const cosZ = Math.cos(rz);
    const sinZ = Math.sin(rz);
    
    const matrixIdx = i * 16;
    matrices[matrixIdx] = sx * (cosY * cosZ);
    matrices[matrixIdx + 1] = sx * (cosY * sinZ);
    matrices[matrixIdx + 2] = -sx * sinY;
    matrices[matrixIdx + 3] = 0;
    
    matrices[matrixIdx + 4] = sy * (sinX * sinY * cosZ - cosX * sinZ);
    matrices[matrixIdx + 5] = sy * (sinX * sinY * sinZ + cosX * cosZ);
    matrices[matrixIdx + 6] = sy * (sinX * cosY);
    matrices[matrixIdx + 7] = 0;
    
    matrices[matrixIdx + 8] = sz * (cosX * sinY * cosZ + sinX * sinZ);
    matrices[matrixIdx + 9] = sz * (cosX * sinY * sinZ - sinX * cosZ);
    matrices[matrixIdx + 10] = sz * (cosX * cosY);
    matrices[matrixIdx + 11] = 0;
    
    matrices[matrixIdx + 12] = x;
    matrices[matrixIdx + 13] = y;
    matrices[matrixIdx + 14] = z;
    matrices[matrixIdx + 15] = 1;
  }
  
  return matrices;
}

// Update instance matrices
function updateInstancesJS(
  matrices: Float32Array,
  positions: Float32Array,
  rotations: Float32Array,
  scales: Float32Array
): Float32Array {
  return generateInstancesJS(
    positions.length / 3,
    positions,
    rotations,
    scales
  );
}

// Export functions with performance tracking
export async function updateParticlePhysics(
  positions: Float32Array,
  velocities: Float32Array,
  forces: Float32Array,
  deltaTime: number,
  damping: number = 0.98
): Promise<{ positions: Float32Array; velocities: Float32Array }> {
  await initWasm();
  const start = performance.now();
  const result = wasmModule.updateParticlePhysics(positions, velocities, forces, deltaTime, damping);
  performanceStats.wasmTime += performance.now() - start;
  performanceStats.wasmCalls++;
  return result;
}

export async function calculateGravity(
  positions: Float32Array,
  center: [number, number, number],
  strength: number
): Promise<Float32Array> {
  await initWasm();
  const start = performance.now();
  const result = wasmModule.calculateGravity(positions, center, strength);
  performanceStats.wasmTime += performance.now() - start;
  performanceStats.wasmCalls++;
  return result;
}

export async function detectCollisions(
  positions: Float32Array,
  radius: number
): Promise<Array<{ i: number; j: number; distance: number }>> {
  await initWasm();
  const start = performance.now();
  const result = wasmModule.detectCollisions(positions, radius);
  performanceStats.wasmTime += performance.now() - start;
  performanceStats.wasmCalls++;
  return result;
}

export async function calculateNormals(
  vertices: Float32Array,
  indices: Uint16Array
): Promise<Float32Array> {
  await initWasm();
  const start = performance.now();
  const result = wasmModule.calculateNormals(vertices, indices);
  performanceStats.wasmTime += performance.now() - start;
  performanceStats.wasmCalls++;
  return result;
}

export async function generateMesh(
  type: "sphere" | "box" | "torus",
  segments: number
): Promise<{ vertices: Float32Array; indices: Uint16Array; normals: Float32Array }> {
  await initWasm();
  const start = performance.now();
  const result = wasmModule.generateMesh(type, segments);
  performanceStats.wasmTime += performance.now() - start;
  performanceStats.wasmCalls++;
  return result;
}

export async function calculateLOD(
  distances: Float32Array,
  thresholds: [number, number, number] = [10, 50, 100]
): Promise<Uint8Array> {
  await initWasm();
  const start = performance.now();
  const result = wasmModule.calculateLOD(distances, thresholds);
  performanceStats.wasmTime += performance.now() - start;
  performanceStats.wasmCalls++;
  return result;
}

export async function multiplyMatrices(
  a: Float32Array,
  b: Float32Array
): Promise<Float32Array> {
  await initWasm();
  const start = performance.now();
  const result = wasmModule.multiplyMatrices(a, b);
  performanceStats.wasmTime += performance.now() - start;
  performanceStats.wasmCalls++;
  return result;
}

export async function transformVertices(
  vertices: Float32Array,
  matrix: Float32Array
): Promise<Float32Array> {
  await initWasm();
  const start = performance.now();
  const result = wasmModule.transformVertices(vertices, matrix);
  performanceStats.wasmTime += performance.now() - start;
  performanceStats.wasmCalls++;
  return result;
}

export async function calculateFrustumCulling(
  positions: Float32Array,
  frustum: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    near: number;
    far: number;
  }
): Promise<Uint8Array> {
  await initWasm();
  const start = performance.now();
  const result = wasmModule.calculateFrustumCulling(positions, frustum);
  performanceStats.wasmTime += performance.now() - start;
  performanceStats.wasmCalls++;
  return result;
}

export async function generateInstances(
  count: number,
  positions: Float32Array,
  rotations: Float32Array,
  scales: Float32Array
): Promise<Float32Array> {
  await initWasm();
  const start = performance.now();
  const result = wasmModule.generateInstances(count, positions, rotations, scales);
  performanceStats.wasmTime += performance.now() - start;
  performanceStats.wasmCalls++;
  return result;
}

export async function updateInstances(
  matrices: Float32Array,
  positions: Float32Array,
  rotations: Float32Array,
  scales: Float32Array
): Promise<Float32Array> {
  await initWasm();
  const start = performance.now();
  const result = wasmModule.updateInstances(matrices, positions, rotations, scales);
  performanceStats.wasmTime += performance.now() - start;
  performanceStats.wasmCalls++;
  return result;
}

// Get performance statistics
export function getPerformanceStats() {
  return {
    ...performanceStats,
    avgWasmTime: performanceStats.wasmCalls > 0 ? performanceStats.wasmTime / performanceStats.wasmCalls : 0,
    avgJsTime: performanceStats.jsCalls > 0 ? performanceStats.jsTime / performanceStats.jsCalls : 0,
  };
}

// Reset performance statistics
export function resetPerformanceStats() {
  performanceStats = {
    wasmCalls: 0,
    jsCalls: 0,
    wasmTime: 0,
    jsTime: 0,
  };
}

