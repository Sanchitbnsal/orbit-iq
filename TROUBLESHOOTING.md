# Troubleshooting & Debugging Guide

## 🔧 Debugging Workflow Issues

### Enable Debug Mode

Add this to your browser console to enable detailed logging:

```javascript
// In browser console (F12)
localStorage.setItem('debug-workflow', 'true');
// Then refresh the page

// To disable:
localStorage.removeItem('debug-workflow');
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "No nodes in workflow"

**Symptom**: Click Generate → Error dialog shows "No nodes in workflow"

**Root Cause**: 
- You haven't added any nodes yet
- All nodes were deleted

**Solution**:
1. Click "Add Node" button
2. Select a node type from dropdown
3. Node appears on canvas
4. Try again

---

### Issue 2: "Output node must be connected to at least one other node"

**Symptom**: Error appears when clicking Generate even though you have nodes

**Root Cause**:
- Output node has no incoming connections
- Connection was not properly established

**Solutions**:
1. **Check Connection**:
   - Look for line from other node to Output node
   - Should be visible on canvas

2. **Reconnect**:
   - Click and drag from bottom handle of a node
   - Drag to top handle of Output node
   - Release to create connection

3. **Delete Bad Connection**:
   - Double-click the line to delete
   - Redo the connection

---

### Issue 3: Execution starts but then shows "API Error"

**Symptom**: Progress dialog shows execution, then error message

**Root Cause**: 
- Network connectivity issue
- API key is invalid
- Rate limit exceeded
- API is down

**Solutions**:

1. **Check Internet Connection**:
   ```bash
   ping google.com
   ```

2. **Verify API Key**:
   - Open `lib/gemini-service.ts`
   - Check line 3 has correct key
   - Key should be: `AIzaSyDlkiAX-NpnRvETXjiJqKFOBOqPT-B1_yE`
   - Key should NOT have quotes around it

3. **Check Rate Limiting**:
   - Gemini has 60 requests/minute limit
   - Wait a minute if you sent many requests
   - Try again after waiting

4. **Check Gemini Status**:
   - Visit: https://ai.google.dev
   - Check if services are operational
   - If down, wait for restoration

5. **Browser Console Check**:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for detailed error messages
   - Copy error text and search for solution

---

### Issue 4: "No file provided for file-to-text node"

**Symptom**: Click Generate → Error about missing file

**Root Cause**:
- File-to-Text node has no file uploaded

**Solution**:
1. Click the "Upload File" button in the node
2. Select a file from your computer (.txt, .pdf, .doc, .docx)
3. Wait for file preview to appear
4. Try Generate again

---

### Issue 5: "No image provided for image-to-text node"

**Symptom**: Click Generate → Error about missing image

**Root Cause**:
- Image-to-Text node has no image uploaded

**Solution**:
1. Click the "Upload Image" button in the node
2. Select an image file from your computer
3. Wait for image preview to appear
4. Try Generate again

---

### Issue 6: Text Generation node with empty prompt

**Symptom**: Empty result or error from Text Generation

**Root Cause**:
- Prompt field is empty
- Or prompt is just whitespace

**Solution**:
1. Click in the Textarea of Text Generation node
2. Type a clear, descriptive prompt:
   - ✅ Good: "Write a professional email requesting a meeting"
   - ❌ Bad: "Write"
   - ❌ Bad: "   " (just spaces)
3. Try again

---

### Issue 7: Output node shows no result

**Symptom**: Execution completes but Output node still says "Output will appear here"

**Root Cause**:
- Execution succeeded but result wasn't displayed
- Output node wasn't receiving result

**Solution**:
1. **Refresh Page**:
   - Press F5 or Ctrl+R
   - Try workflow again

2. **Check Connection to Output**:
   - Verify line connects to Output node
   - Try deleting and reconnecting

3. **Check Browser Console**:
   - F12 → Console tab
   - Look for JavaScript errors
   - Report errors if persistent

---

### Issue 8: Multiple quick clicks creates duplicate execution

**Symptom**: Clicking Generate multiple times creates overlapping requests

**Current Behavior**: 
- Button is disabled during execution
- Should prevent this

**If Still Happens**:
1. Wait for dialog to complete
2. Close dialog
3. Button re-enables
4. Try again

---

### Issue 9: Image-to-Text returns low-quality description

**Symptom**: Image description is vague or irrelevant

**Root Cause**:
- Image quality is poor
- Image is not what you expect
- API limitation

**Solutions**:
1. **Use Better Images**:
   - Use high-resolution images
   - Ensure image is clear
   - Good lighting helps

2. **Try Different Images**:
   - Some images analyze better than others
   - Try a different image

3. **Use Text Generation After**:
   - Chain to Text Generation node
   - Tell it to "Enhance this description: [description]"
   - Get improved result

---

### Issue 10: File Processing takes very long

**Symptom**: File-to-Text execution takes 30+ seconds

**Root Cause**:
- Large file size
- Network latency
- API processing time

**Solutions**:
1. **Use Smaller Files**:
   - Break large files into smaller chunks
   - Process separately

2. **Try Different Format**:
   - Convert .pdf to .txt if possible
   - Text files process faster

3. **Check Network**:
   - Ensure good internet connection
   - Close other bandwidth-heavy apps

---

## 🔍 Advanced Debugging

### Check Network Requests

1. Open DevTools (F12)
2. Go to "Network" tab
3. Click Generate
4. Look for requests to `generativelanguage.googleapis.com`
5. Click each request to see:
   - Request headers
   - Request body
   - Response status
   - Response body

### Check Application State

1. Open DevTools (F12)
2. Go to "Console" tab
3. Type:
   ```javascript
   // Check workflow state
   JSON.stringify(localStorage.getItem('workflow-builder-state'), null, 2)
   
   // See all nodes
   const state = JSON.parse(localStorage.getItem('workflow-builder-state'));
   console.table(state.nodes);
   
   // See all connections
   console.table(state.edges);
   ```

### Check Component State

1. Install React DevTools browser extension
2. Open it in DevTools
3. Select "Providers" component
4. Inspect Recoil state
5. Look for `workflowState` atom

---

## 📝 Creating Error Report

If you encounter a persistent issue:

### Required Information:
1. **Steps to reproduce**:
   - What nodes did you add?
   - What prompts/files did you use?
   - What exact button did you click?

2. **Expected behavior**:
   - What should happen?

3. **Actual behavior**:
   - What actually happened?

4. **Error message**:
   - Copy text from error dialog
   - Or from browser console

5. **Environment**:
   - Browser (Chrome, Firefox, Safari, Edge)
   - Browser version
   - Operating system
   - Node version (if relevant)

6. **Screenshots**:
   - Workflow screenshot
   - Error dialog screenshot
   - Console error screenshot

### Example Report:

```
**Issue**: Image-to-Text node fails with "Cannot read properties"

**Steps to Reproduce**:
1. Add Image-to-Text node
2. Upload image.jpg (2MB)
3. Connect to Output node
4. Click Generate

**Expected**: Image description appears in Output node

**Actual**: Execution dialog shows error, image not processed

**Error Message**: 
"Failed to extract text from image: SyntaxError: 
Unexpected token < in JSON at position 0"

**Browser**: Chrome 120.0.6099.91
**OS**: Windows 11
**Screenshot**: [attached]
**Console Error**: [attached]
```

---

## 🔄 Reset Workflow State

If state gets corrupted:

```javascript
// Clear all saved state
localStorage.removeItem('workflow-builder-state');

// Refresh page
location.reload();

// Workflow will reset to default (just Output node)
```

---

## 🎯 Performance Optimization

### If Generation is Slow:

1. **Reduce Temperature**:
   - Lower temperature = faster but less creative
   - Edit `lib/gemini-service.ts`
   - Change temperature from 0.9 to 0.5

2. **Reduce Max Tokens**:
   - Lower tokens = shorter responses
   - Edit `generationConfig.maxOutputTokens`
   - Change from 2048 to 1024

3. **Use Faster Model**:
   - Current: `gemini-pro`
   - Alternative: `gemini-1.5-flash` (but different capabilities)

### Example:
```typescript
// In lib/gemini-service.ts, find generateText function:

// BEFORE (slower, more creative):
generationConfig: {
  temperature: 0.9,
  maxOutputTokens: 2048,
}

// AFTER (faster, more concise):
generationConfig: {
  temperature: 0.7,
  maxOutputTokens: 1024,
}
```

---

## 🧪 Testing Checklist

### Before Reporting Issue:

- [ ] Tried refreshing page (F5)
- [ ] Cleared browser cache (Ctrl+Shift+Delete)
- [ ] Tried in incognito/private mode
- [ ] Tried different browser (Chrome, Firefox, Safari)
- [ ] Checked internet connection
- [ ] Verified API key is correct
- [ ] Waited 2 minutes after rate limit error
- [ ] Tried with simpler workflow
- [ ] Checked browser console for errors
- [ ] Tried on different device if possible

---

## 📞 Getting Help

### Resources:

1. **This Guide**: Covers 90% of issues
2. **GEMINI_INTEGRATION_GUIDE.md**: Complete API documentation
3. **Browser Console**: DevTools → Console tab (F12)
4. **Network Tab**: DevTools → Network tab
5. **Gemini Status**: https://ai.google.dev

### When Asking for Help:

Always provide:
- What you were trying to do
- Exact error message
- Steps to reproduce
- Browser and OS info
- Screenshots if helpful

---

## 🎓 Advanced Topics

### Understanding API Responses

Successful response:
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Your generated response here"
          }
        ]
      }
    }
  ]
}
```

Error response:
```json
{
  "error": {
    "code": 400,
    "message": "Invalid argument",
    "status": "INVALID_ARGUMENT"
  }
}
```

### Understanding Node Data Flow

```typescript
// Each node has this structure:
{
  id: "textGenerationNode-1",
  type: "textGenerationNode",
  position: { x: 100, y: 100 },
  data: {
    label: "Text Generation",
    prompt: "User's prompt text",
    // ... other fields
  }
}

// During execution, results flow:
Node 1 Result → Node 2 Input → Node 2 Result → ...
```

---

## ⚙️ Configuration Deep Dive

### Temperature Scale Explained:

- **0.0**: Deterministic (same response every time)
- **0.3**: Factual, accurate, consistent
- **0.5-0.7**: Balanced
- **0.8-1.0**: Creative, varied, unpredictable

### Choosing Temperature:

| Use Case | Temperature |
|----------|-------------|
| Summaries | 0.3-0.5 |
| Analysis | 0.5-0.7 |
| Stories | 0.7-0.9 |
| Brainstorming | 0.9-1.0 |

### Max Tokens Guide:

| Length | Tokens | Use |
|--------|--------|-----|
| Short (1-2 sentences) | 100-300 | Quick responses |
| Medium (paragraph) | 300-800 | Standard output |
| Long (multiple paragraphs) | 800-2048+ | Detailed content |

---

## 🚨 Critical Errors & Solutions

### "INVALID_API_KEY"
```
Error: 400 INVALID_API_KEY
```
**Fix**: Check API key in lib/gemini-service.ts line 3

### "QUOTA_EXCEEDED"
```
Error: 429 QUOTA_EXCEEDED
```
**Fix**: Wait 60 seconds, then retry (rate limit)

### "PERMISSION_DENIED"
```
Error: 403 PERMISSION_DENIED
```
**Fix**: Verify API key has Generative Language API enabled

### "RESOURCE_EXHAUSTED"
```
Error: 429 RESOURCE_EXHAUSTED
```
**Fix**: Reduce request frequency, implement queue

---

**Last Updated**: November 17, 2025
**Version**: 1.0
**Status**: Complete
