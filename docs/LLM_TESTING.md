# LLM Testing Guide

## How to Test LLM Responses

### 1. Open Browser Console
- Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
- Go to the **Console** tab

### 2. Look for Debug Logs
When you send a message in the chat, you should see logs like:
```
[Chat Debug] Sending message: ...
[Chat Debug] Conversation history: ...
[LLM Debug] Full prompt: ...
[LLM Debug] Raw result: ...
[LLM Debug] Final generated text: ...
[Chat Debug] Received result: ...
```

### 3. Check Network Tab (Optional)
- Go to **Network** tab in DevTools
- Filter by "Fetch/XHR" or "WS" (WebSocket)
- Look for requests to Hugging Face CDN or model files

### 4. Common Issues and Solutions

#### Issue: "No response generated"
- Check console for `[LLM Debug] Raw result:` - this shows what the model actually returned
- The result format might be different than expected
- Check if `generated_text` field exists in the result

#### Issue: Response contains the prompt
- The model is returning the full text including the prompt
- Check `[LLM Debug] Full prompt:` to see what was sent
- The code should automatically remove the prompt, but if it doesn't, check the extraction logic

#### Issue: Response is empty or just "Assistant:"
- The model might not be generating text properly
- Check the model's `max_new_tokens` setting (currently 200)
- Try increasing `temperature` (currently 0.7) for more creative responses

### 5. Testing Steps

1. **Load a text-generation model** (e.g., DistilGPT-2)
2. **Open browser console** (F12)
3. **Type a message** in the chat (e.g., "Hello")
4. **Watch the console logs** - you should see:
   - The message being sent
   - The conversation history
   - The full prompt being sent to the model
   - The raw result from the model
   - The extracted text
   - The final message displayed

### 6. Multi-Threading Status

To check if multi-threading is enabled:
- Look at the "Current Backend" section in the UI
- Check the "Cross-Origin Isolation" status
- In console, look for: `ONNX Runtime WASM configured: X threads, SIMD enabled (cross-origin isolated)`

If it says "single-threaded mode", cross-origin isolation is not enabled. This is normal in development mode - it should work in production.

### 7. Manual Testing

You can also test the model directly in the console:
```javascript
// After loading a model, you can test it directly:
const result = await modelManager.runTextGeneration("Hello, how are you?", {
  maxLength: 50,
  temperature: 0.7
});
console.log("Result:", result);
```

## Debugging Tips

1. **Always check the console first** - all debug logs are prefixed with `[LLM Debug]` or `[Chat Debug]`
2. **Check the raw result** - this shows exactly what Transformers.js returned
3. **Compare prompt vs result** - make sure the prompt is being formatted correctly
4. **Test with simple prompts first** - start with "Hello" or "Hi" before trying complex conversations

