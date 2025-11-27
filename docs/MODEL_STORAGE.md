# Model Storage Strategy for Vercel Deployment

## Overview

When deploying AI models to Vercel, you have several options for storing and serving model files. This document outlines the recommended approaches.

## Options

### 1. **Hugging Face CDN (Recommended for Transformers.js)**

**Pros:**
- ✅ No storage costs
- ✅ Automatic caching by browser
- ✅ Models are already optimized and quantized
- ✅ No need to manage model files
- ✅ Works out of the box with `@huggingface/transformers`

**Cons:**
- ❌ First load can be slow (models download on first use)
- ❌ Requires internet connection
- ❌ No control over CDN location

**Implementation:**
```typescript
// Already configured in model-manager.ts
env.allowRemoteModels = true; // Loads from Hugging Face CDN
```

**Cache Strategy:**
- Browser automatically caches models after first download
- Models are stored in browser's IndexedDB
- Subsequent loads are instant

### 2. **Vercel Blob Storage**

**Pros:**
- ✅ Fast CDN delivery
- ✅ Integrated with Vercel
- ✅ Pay-as-you-go pricing
- ✅ Good for custom models

**Cons:**
- ❌ Storage costs (~$0.15/GB/month)
- ❌ Need to upload models manually
- ❌ Bandwidth costs for downloads

**Implementation:**
```typescript
// Install @vercel/blob
import { put, list } from '@vercel/blob';

// Upload model (one-time setup)
const blob = await put('model.onnx', file, {
  access: 'public',
});

// Use in code
const modelUrl = blob.url;
```

**Cost Estimate:**
- 1GB model: ~$0.15/month storage
- 1000 downloads/month: ~$0.10 bandwidth
- Total: ~$0.25/month per model

### 3. **Git LFS (Not Recommended)**

**Pros:**
- ✅ Version controlled
- ✅ Free (up to 1GB on GitHub)

**Cons:**
- ❌ Slows down git operations
- ❌ Repository size limits
- ❌ Not ideal for large models (>100MB)
- ❌ Vercel build time increases

**When to Use:**
- Only for very small models (<50MB)
- When you need version control for models

### 4. **External CDN (Cloudflare R2, AWS S3)**

**Pros:**
- ✅ Very fast global CDN
- ✅ Cost-effective for high traffic
- ✅ More control

**Cons:**
- ❌ Additional service to manage
- ❌ More complex setup
- ❌ CORS configuration needed

## Performance Optimization

### Understanding ONNX Runtime Warnings

The warnings you see (`Some nodes were not assigned to the preferred execution providers`) are **normal and expected**:

1. **Shape Operations**: ONNX Runtime intentionally assigns shape-related operations to CPU because:
   - These operations are faster on CPU
   - They don't benefit from GPU parallelism
   - This is an optimization, not a problem

2. **Execution Provider Priority**: 
   - WebGPU: Used for compute-intensive operations (matrix multiplications, convolutions)
   - WASM/CPU: Used for control flow and shape operations
   - This hybrid approach gives **best overall performance**

3. **How to Verify Performance**:
   ```javascript
   // Check inference time
   const start = performance.now();
   const result = await pipeline(input);
   const inferenceTime = performance.now() - start;
   console.log(`Inference time: ${inferenceTime}ms`);
   ```

### Optimizing Performance

1. **Use WebGPU when available** (already configured):
   ```javascript
   device: 'webgpu' // Automatically falls back to WASM if not available
   ```

2. **Enable SIMD** (already enabled):
   ```javascript
   env.backends.onnx.wasm.simd = true;
   ```

3. **Use all CPU cores** (already configured):
   ```javascript
   env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency || 4;
   ```

4. **Use quantized models** (models from Hugging Face are already quantized):
   - Smaller file size
   - Faster inference
   - Minimal accuracy loss

## Recommendation

**For this project, use Hugging Face CDN** because:

1. **Transformers.js is optimized for it** - Models are automatically cached
2. **No storage costs** - Perfect for portfolio projects
3. **Automatic updates** - Get latest model versions
4. **Works immediately** - No setup required

### Performance Optimization

To improve first-load performance:

1. **Preload popular models:**
```typescript
// In your component
useEffect(() => {
  // Preload recommended model
  if (recommendedModels.length > 0) {
    modelManager.loadModel(recommendedModels[0].id);
  }
}, []);
```

2. **Show loading progress:**
```typescript
// Already implemented in OnnxAIDemo.tsx
setLoadingProgress("Loading model...");
```

3. **Use quantized models:**
```typescript
// Models from Hugging Face are already quantized
// No additional configuration needed
```

## Model File Sizes

| Model | Size | Load Time (100Mbps) |
|-------|------|---------------------|
| MobileNet v2 | 5MB | <1s |
| GPT-2 | 500MB | ~5s |
| Llama 3.2 1B | 700MB | ~7s |
| Llama 3.2 3B | 2GB | ~20s |
| Qwen2 7B | 4.5GB | ~45s |

## Caching Strategy

Transformers.js automatically caches models in:
- **IndexedDB** (primary)
- **Cache API** (fallback)

Models are cached by:
- Model ID
- Model version
- Quantization level

**Cache is persistent** - Models persist across browser sessions.

## Vercel Deployment Strategy

### Recommended Approach: Hugging Face CDN with Browser Caching

**Best for:**
- ✅ Portfolio/demo projects
- ✅ Low to medium traffic
- ✅ Multiple models
- ✅ Zero maintenance

**How it works:**
1. First visit: Model downloads from Hugging Face CDN (~5-45s depending on size)
2. Browser caches model in IndexedDB
3. Subsequent visits: Instant load from cache
4. Cache persists across sessions

**Configuration:**
```typescript
// Already configured in model-manager.ts
env.allowRemoteModels = true; // Load from Hugging Face Hub
// No localModelPath set = uses Hugging Face CDN
```

**Cost:** $0 (Hugging Face provides free CDN)

### Alternative: Vercel Blob Storage

**Best for:**
- ✅ High traffic (>10k users/day)
- ✅ Need guaranteed availability
- ✅ Custom models not on Hugging Face
- ✅ Want faster first-load times

**Setup:**
```bash
# Install Vercel Blob
pnpm add @vercel/blob
```

```typescript
// Upload models (one-time setup script)
import { put } from '@vercel/blob';

const modelFile = await fetch('https://huggingface.co/.../model.onnx');
const blob = await put('models/mobilenet-v2.onnx', modelFile, {
  access: 'public',
  addRandomSuffix: false,
});

// Use in code
env.localModelPath = 'https://your-blob-url.vercel-storage.com/models/';
env.allowRemoteModels = false;
```

**Cost:** ~$0.15/GB/month storage + $0.10/GB bandwidth

### Alternative: Git LFS (Not Recommended)

**Why not recommended:**
- ❌ Repository becomes huge (>100MB)
- ❌ Slow git operations
- ❌ Vercel build time increases
- ❌ GitHub LFS has 1GB free limit

**Only use for:**
- Very small models (<50MB)
- Need version control for models
- Internal projects only

## Alternative: Self-Hosted Models

If you want to self-host models:

1. **Download models:**
```bash
# Use huggingface-cli
pip install huggingface_hub
huggingface-cli download Xenova/gpt2 --local-dir ./public/models/gpt2
```

2. **Serve from public folder:**
```typescript
// Update model config
{
  "modelId": "/models/gpt2/model.onnx",
  "localFilesOnly": true
}
```

3. **Add to .gitignore:**
```
public/models/
```

4. **Upload to Vercel Blob or external CDN**

## Conclusion

**Use Hugging Face CDN** for the best balance of:
- ✅ Zero setup
- ✅ Zero storage costs
- ✅ Automatic caching
- ✅ Good performance after first load

Only consider self-hosting if:
- You need offline support
- You have custom models
- You need guaranteed availability
- You have high traffic (>10k users/day)

