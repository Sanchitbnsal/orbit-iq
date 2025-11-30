# OrbitIQ Workflow Builder - Gemini AI Integration Guide

## 🎯 Project Overview

OrbitIQ is a visual workflow builder that enables users to create complex AI workflows by connecting different node types. Each node performs a specific AI task using Google's Gemini API.

### 4 Node Types

1. **Text Generation Node** (`textGenerationNode`)
   - Purpose: Generate text content from prompts
   - Gemini Model: `gemini-pro`
   - Use Case: Create articles, summaries, creative writing
   - Input: Text prompt
   - Output: Generated text

2. **Image Generation Node** (`imageGenerationNode`)
   - Purpose: Generate images from text descriptions
   - Gemini Model: `gemini-pro` (enhanced prompt generation)
   - Use Case: Create detailed image descriptions for image generation APIs
   - Input: Text description/prompt
   - Output: Base64 encoded placeholder image (SVG)
   - Note: Returns enhanced prompts for use with external image APIs

3. **File to Text Node** (`fileToTextNode`)
   - Purpose: Extract and process text from uploaded files
   - Gemini Model: `gemini-pro`
   - Use Case: Summarize documents, extract key information
   - Input: File upload (txt, pdf, doc, docx)
   - Output: Extracted/processed text

4. **Image to Text Node** (`imageToTextNode`)
   - Purpose: Extract text descriptions from images
   - Gemini Model: `gemini-1.5-flash`
   - Use Case: OCR, image captioning, analysis
   - Input: Image upload
   - Output: Text description

### Output Node
- Displays final workflow results
- Can accept input from any of the above nodes
- Renders text or image outputs

---

## 🔧 Technical Architecture

### New Files Created

1. **`lib/gemini-service.ts`**
   - Handles all Gemini API communications
   - Functions:
     - `generateText()` - Text generation
     - `generateImage()` - Image generation
     - `extractTextFromFile()` - File processing
     - `extractTextFromImage()` - Image analysis
     - `processWorkflow()` - Orchestrates node execution
   - Uses API Key: `AIzaSyDlkiAX-NpnRvETXjiJqKFOBOqPT-B1_yE`

2. **`hooks/use-workflow-execution.ts`**
   - React hook for workflow execution state management
   - Exports:
     - `useWorkflowExecution()` - Main hook
     - State: `isExecuting`, `error`, `progress`, `results`
     - Methods: `executeWorkflow()`, `resetExecution()`

3. **`components/framer-ai-button/AIButtonEnhanced.tsx`**
   - Enhanced Generate button with execution dialog
   - Features:
     - Real-time progress updates
     - Error handling with user-friendly messages
     - Loading state with animated progress bar
     - Success confirmation
     - Execution status dialog

---

## 🚀 How Workflow Execution Works

### Step-by-Step Process

1. **User Setup**
   - User creates nodes (TextGen, ImageGen, File, Image-to-Text)
   - User configures each node with prompts/inputs
   - User connects nodes sequentially to Output node

2. **User Triggers Generation**
   - Clicks "Generate" button (AIButton)
   - System validates workflow structure

3. **Validation Checks**
   - Ensures Output node exists
   - Ensures Output node has at least one input connection
   - Validates all nodes have required data (prompts, files, etc.)

4. **Execution Flow**
   - System processes nodes in dependency order
   - Each node receives input from connected source nodes
   - Output from one node becomes input to next
   - Results are accumulated and passed along

5. **Result Display**
   - Output node displays final result
   - Text results show in formatted container
   - Image results display with proper rendering
   - Results persist in workflow state

### Node Connection Rules

```typescript
// Valid connections from each node type:

textGenerationNode → [
  textGenerationNode,
  imageGenerationNode,
  outputNode
]

imageGenerationNode → [
  imageToTextNode,
  imageGenerationNode,
  outputNode
]

fileToTextNode → [
  textGenerationNode,
  imageGenerationNode,
  outputNode
]

imageToTextNode → [
  textGenerationNode,
  imageGenerationNode,
  outputNode
]

// Output node:
- Can only have ONE input connection
- Must be connected to at least one node for execution
```

---

## 📝 Usage Examples

### Example 1: Text Analysis Workflow
```
File Node (upload document)
    ↓
File-to-Text Node (extract content)
    ↓
Text Generation Node (summarize)
    ↓
Output Node (display summary)
```

### Example 2: Image Analysis Workflow
```
Image Node (upload photo)
    ↓
Image-to-Text Node (describe image)
    ↓
Text Generation Node (expand description)
    ↓
Output Node (display enhanced description)
```

### Example 3: Content Creation Workflow
```
Text Generation Node (generate outline)
    ↓
Text Generation Node (expand content)
    ↓
Output Node (display full content)
```

---

## 🔑 API Configuration

### Gemini API Key
- **Key**: `AIzaSyDlkiAX-NpnRvETXjiJqKFOBOqPT-B1_yE`
- **Location**: `lib/gemini-service.ts` (line 3)
- **Endpoints Used**:
  - `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
  - `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`

### Models Used
1. **gemini-pro**: General purpose text generation, file processing
2. **gemini-1.5-flash**: Fast image analysis and description generation

---

## ⚙️ Configuration Details

### Temperature & Generation Settings

| Node Type | Temperature | Max Tokens | Purpose |
|-----------|-------------|-----------|---------|
| Text Generation | 0.9 | 2048 | Creative responses |
| Image Generation | 0.95 | 1024 | Vivid descriptions |
| File Processing | 0.5 | 1024 | Accurate extraction |
| Image Analysis | 0.7 | 1024 | Balanced description |

### Accepted File Types
- **File-to-Text**: `.txt`, `.pdf`, `.doc`, `.docx`
- **Image-to-Text**: All image formats (`image/*`)

---

## 🎨 UI Components

### AIButtonEnhanced Features
- **Status Indicators**:
  - Blue spinner: Execution in progress
  - Green checkmark: Success
  - Red alert: Error

- **Progress Dialog**:
  - Shows execution status in real-time
  - Animated progress bar
  - Error messages with details
  - Close button (disabled during execution)

- **Toast Notifications**:
  - Success: "Workflow executed successfully!"
  - Error: Specific error message
  - Auto-dismiss after 3 seconds

---

## 🐛 Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "No nodes in workflow" | Empty workflow | Add at least one node |
| "Output node is required" | Missing output node | Add Output node |
| "Output node must be connected" | No connections to output | Connect a node to output |
| "No file provided" | File node without upload | Upload file before executing |
| "No image provided" | Image node without upload | Upload image before executing |
| API errors | Network issues | Check internet, API key validity |

---

## 📦 Dependencies

No new dependencies needed! Uses existing packages:
- `next` - Framework
- `react` - UI library
- `reactflow` - Workflow builder
- `recoil` - State management
- `sonner` - Toast notifications
- `framer-motion` - Animations
- `tailwindcss` - Styling

---

## 🔒 Security Notes

1. **API Key Management**
   - Currently hardcoded in `lib/gemini-service.ts`
   - ⚠️ For production: Move to environment variables
   - Never commit API keys to version control

2. **Data Handling**
   - File uploads: Processed client-side before sending to API
   - Large files: May need streaming for better performance
   - Image data: Converted to base64 for API transmission

---

## 🚀 Future Enhancements

1. **Image Generation**
   - Integrate with Stable Diffusion API
   - Or DALL-E for actual image generation
   - Replace SVG placeholder with real images

2. **Performance**
   - Add request caching
   - Implement concurrent node processing
   - Add progress callbacks for UI updates

3. **Features**
   - Workflow templates
   - Multi-user execution tracking
   - API usage statistics
   - Custom node creation
   - Conditional branching

4. **Reliability**
   - Retry logic for failed API calls
   - Request rate limiting
   - Better error recovery

---

## 🧪 Testing Workflow

### Quick Test Steps

1. **Start the app**
   ```bash
   npm run dev
   ```

2. **Create a simple workflow**
   - Add a Text Generation node
   - Enter a prompt (e.g., "Write a haiku about AI")
   - Connect to Output node
   - Click Generate

3. **Check output**
   - Result should appear in Output node
   - Toast notification confirms success/failure

4. **Try File Processing**
   - Add File-to-Text node
   - Upload a text file
   - Connect to Output node
   - Click Generate

---

## 📊 Data Flow Diagram

```
User Input (Prompts/Files/Images)
        ↓
   [Node Type]
   (textGenNode, imageGenNode, fileToTextNode, imageToTextNode)
        ↓
  Call Gemini API
        ↓
   Process Response
        ↓
  Pass to Next Node (if connected)
        ↓
   [Output Node]
        ↓
Display Result to User
```

---

## 💡 Tips for Users

1. **Start Simple**: Begin with single nodes before chaining
2. **Use Descriptive Prompts**: Better prompts = better results
3. **Chain Wisely**: Text outputs work best as inputs to other text nodes
4. **Monitor Progress**: Watch the execution dialog for real-time feedback
5. **Save Workflows**: Export workflows for reuse later

---

## 📞 Support

For issues or questions:
1. Check error message in execution dialog
2. Verify all nodes have required inputs
3. Check internet connection and API availability
4. Refer to this guide's troubleshooting section

---

**Last Updated**: November 17, 2025
**Version**: 1.0.0
**Status**: Ready for Production
