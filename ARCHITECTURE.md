# Architecture & Data Flow Guide

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                     │
│                    (Client + Server Side)                   │
└────────────┬────────────────────────────────────────────────┘
             │
        ┌────┴─────────────────────────────────────┐
        │                                           │
        ▼                                           ▼
┌─────────────────────────────┐        ┌──────────────────────────┐
│   React Components          │        │   State Management       │
│                             │        │   (Recoil)               │
│ - Workflow Builder          │        │                          │
│ - Node Components           │        │ - workflowState atom     │
│ - AIButton Enhanced         │        │ - Node data              │
│ - Output Display            │        │ - Edge connections       │
└─────────────────────────────┘        └──────────────────────────┘
        │
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│              Gemini Service (lib/gemini-service.ts)         │
│                                                              │
│  - generateText()                                           │
│  - generateImage()                                          │
│  - extractTextFromFile()                                    │
│  - extractTextFromImage()                                   │
│  - processWorkflow()                                        │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│         Google Generative Language API (Cloud)             │
│                                                              │
│  - gemini-pro:generateContent (Text & File Processing)    │
│  - gemini-1.5-flash:generateContent (Image Analysis)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

### User Interaction Flow

```
User Opens OrbitIQ
        │
        ▼
┌───────────────────┐
│  Load Workflow    │  ← Restore from localStorage
│  from Storage     │
└────────┬──────────┘
         │
         ▼
┌───────────────────────────┐
│  Display Canvas with      │
│  - Existing Nodes         │
│  - Existing Connections   │
│  - Output Node (always)   │
└────────┬──────────────────┘
         │
    ┌────┴──────────────────────────────────────────┐
    │                                               │
    ▼                                               ▼
User Adds                               User Configures Nodes
Nodes                                   - Types prompts
    │                                   - Uploads files
    ▼                                   - Uploads images
Create New                                  │
Node Instance            ┌───────────────┬──┘
    │                    │
    ▼                    ▼
Add to                Connect to
Canvas            Output Node
    │                  │
    └────┬─────────────┘
         │
         ▼
    User Clicks
    "Generate"
         │
         ▼
    ┌────────────────────────────────┐
    │  useWorkflowExecution Hook     │
    │  - Set isExecuting = true      │
    │  - Show progress dialog        │
    │  - Call executeWorkflow()      │
    └────────────┬───────────────────┘
                 │
                 ▼
         ┌───────────────────┐
         │  Validate         │
         │  Workflow         │
         │                   │
         │  - Check Output   │
         │  - Check Edges    │
         │  - Check Data     │
         └────────┬──────────┘
                  │
         Error?   ├─ YES → Show Error Dialog
         No       │
                  ▼
         ┌────────────────────┐
         │  Call             │
         │  processWorkflow() │
         │                    │
         │  - Traverse nodes  │
         │  - Execute each    │
         │  - Pass results    │
         └────────┬───────────┘
                  │
              ┌───┴─────────────────┬───────────────────┐
              │                     │                   │
              ▼                     ▼                   ▼
        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │ Text Gen     │   │ Image Gen    │   │ File→Text    │
        │              │   │              │   │              │
        │ Call API:    │   │ Call API:    │   │ Call API:    │
        │ gemini-pro   │   │ gemini-pro   │   │ gemini-pro   │
        │ + prompt     │   │ + enhanced   │   │ + file       │
        │              │   │ prompt       │   │ content      │
        └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
               │                  │                  │
               └──────────────┬───┴──────────────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ Collect Results    │
                    │ in Dictionary      │
                    │                    │
                    │ {                  │
                    │   node1: result1,  │
                    │   node2: result2,  │
                    │   ...              │
                    │ }                  │
                    └────────┬───────────┘
                             │
                             ▼
                    ┌──────────────────────┐
                    │ Update Output Node   │
                    │ with Final Result    │
                    │                      │
                    │ - Set output prop    │
                    │ - Set outputType     │
                    │ - Trigger re-render  │
                    └────────┬─────────────┘
                             │
                             ▼
                    ┌──────────────────────┐
                    │ Show Success Dialog  │
                    │ - Update progress    │
                    │ - Show result        │
                    │ - Enable close       │
                    └────────┬─────────────┘
                             │
                             ▼
                    ┌──────────────────────┐
                    │ Save to Local        │
                    │ Storage              │
                    │ - All nodes          │
                    │ - All connections    │
                    │ - Metadata           │
                    └────────┬─────────────┘
                             │
                             ▼
                    ┌──────────────────────┐
                    │ Show Toast           │
                    │ Notification         │
                    └──────────────────────┘
```

---

## 🔄 Workflow Execution Engine

### Node Processing Algorithm

```typescript
async function processWorkflow(nodes, edges, startNodeId) {
  const results = {}              // Store results
  const visited = new Set()       // Track processed nodes
  
  async function processNode(nodeId) {
    // Step 1: Check if already processed
    if (visited.has(nodeId)) {
      return results[nodeId]      // Return cached result
    }
    
    visited.add(nodeId)            // Mark as processing
    const node = findNode(nodeId)  // Get node definition
    
    // Step 2: Process dependencies
    const inputEdges = edges.filter(e => e.target === nodeId)
    const inputs = {}
    
    for (const edge of inputEdges) {
      const sourceResult = await processNode(edge.source)
      inputs[edge.source] = sourceResult
    }
    
    // Step 3: Execute based on node type
    let output
    
    switch(node.type) {
      case 'textGenerationNode':
        // Combine prompt with inputs
        const prompt = `${node.prompt}\n\nContext: ${inputs}`
        output = await generateText(prompt)
        break
        
      case 'imageGenerationNode':
        // Similar for image
        break
        
      case 'fileToTextNode':
        // Extract from file data
        output = await extractTextFromFile(node.file)
        break
        
      case 'imageToTextNode':
        // Analyze image
        output = await extractTextFromImage(node.image)
        break
    }
    
    // Step 4: Store result
    results[nodeId] = output
    return output
  }
  
  // Step 5: Start from output node
  const outputNode = nodes.find(n => n.type === 'outputNode')
  await processNode(outputNode.id)
  
  return results
}
```

---

## 🎯 Component Hierarchy

```
App (page.tsx)
│
├─ WorkflowBuilder
│  │
│  ├─ ReactFlow Container
│  │  │
│  │  ├─ TextGenerationNode
│  │  │  └─ BaseNode
│  │  │     ├─ Handle (input)
│  │  │     ├─ Textarea (prompt)
│  │  │     └─ Handle (output)
│  │  │
│  │  ├─ ImageGenerationNode
│  │  │  └─ BaseNode
│  │  │
│  │  ├─ FileToTextNode
│  │  │  ├─ BaseNode
│  │  │  └─ FilePreview
│  │  │
│  │  ├─ ImageToTextNode
│  │  │  ├─ BaseNode
│  │  │  └─ FilePreview
│  │  │
│  │  └─ OutputNode
│  │     └─ BaseNode
│  │        ├─ Text Display
│  │        └─ Image Display
│  │
│  └─ Control Panels
│     ├─ WorkflowMetadata
│     ├─ AIButtonEnhanced
│     │  └─ ExecutionDialog
│     ├─ Add Node Dropdown
│     ├─ Export Button
│     └─ Import Button
│
└─ Providers
   ├─ Recoil Root
   ├─ ThemeProvider
   └─ Toaster
```

---

## 📡 API Request/Response Cycle

### Text Generation Flow

```
User clicks Generate
        │
        ▼
┌─────────────────────────────────────┐
│   Request to Gemini API             │
│                                      │
│  POST /v1beta/models/gemini-pro:    │
│       generateContent?key=...        │
│                                      │
│  Body: {                            │
│    "contents": [{                   │
│      "parts": [{ "text": "..." }]   │
│    }],                              │
│    "generationConfig": {            │
│      "temperature": 0.9,            │
│      "maxOutputTokens": 2048        │
│    }                                │
│  }                                  │
└─────────────┬───────────────────────┘
              │
              ▼
    (Network Request)
              │
              ▼
┌──────────────────────────────────────┐
│  Google API Server                    │
│                                       │
│  1. Validate API key                 │
│  2. Parse request                    │
│  3. Load gemini-pro model            │
│  4. Generate response                │
│  5. Apply safety filters             │
│  6. Return response                  │
└──────────────┬───────────────────────┘
               │
               ▼
    (Network Response)
               │
               ▼
┌──────────────────────────────────────┐
│  Response from API                    │
│                                       │
│  {                                   │
│    "candidates": [{                  │
│      "content": {                    │
│        "parts": [{                   │
│          "text": "Generated text..." │
│        }]                            │
│      }                               │
│    }]                                │
│  }                                   │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Parse Response                       │
│  Extract: data.candidates[0].content │
│           .parts[0].text             │
└──────────────┬───────────────────────┘
               │
               ▼
        Result Text
               │
               ▼
      Store in Node
               │
               ▼
    Update Output Node
               │
               ▼
     Show in Dialog
```

---

## 🔐 State Management Flow

### Recoil State Updates

```
workflowState (Recoil Atom)
│
├─ nodes: Array<Node>
│  │
│  ├─ id: string
│  ├─ type: 'textGenerationNode' | ...
│  ├─ position: { x, y }
│  └─ data:
│     ├─ label: string
│     ├─ prompt: string (optional)
│     ├─ file: File (optional)
│     └─ output: string (optional)
│
├─ edges: Array<Edge>
│  │
│  ├─ id: string
│  ├─ source: string (nodeId)
│  └─ target: string (nodeId)
│
└─ metadata:
   ├─ name: string
   ├─ description: string
   ├─ created: ISO string
   └─ updated: ISO string

Updates trigger:
1. Component re-render
2. LocalStorage save
3. Workflow state sync
```

---

## 🔌 Hook Integration Points

### useWorkflowExecution Hook

```
useWorkflowExecution()
│
├─ State
│  ├─ isExecuting: boolean
│  ├─ error: string | null
│  ├─ progress: string
│  └─ results: Record<string, string>
│
├─ Methods
│  ├─ executeWorkflow(nodes, edges)
│  │  │
│  │  ├─ Validate workflow
│  │  ├─ Call processWorkflow()
│  │  ├─ Update state
│  │  └─ Return result
│  │
│  └─ resetExecution()
│     └─ Clear state
│
└─ Integration
   ├─ useCallback for memoization
   ├─ useState for state
   ├─ useRecoilState for workflow
   └─ toast for notifications
```

---

## 📱 UI Rendering Pipeline

### Component Update Cycle

```
User Action
(e.g., Add Node)
        │
        ▼
Event Handler Fired
        │
        ▼
State Updated
(useState, Recoil)
        │
        ▼
Component Re-renders
        │
        ▼
New JSX Generated
        │
        ▼
Virtual DOM Updated
        │
        ▼
Diff Applied
        │
        ▼
Real DOM Updated
        │
        ▼
Browser Paints
        │
        ▼
Animation Frame
(Framer Motion)
        │
        ▼
User Sees Update
```

---

## 🎨 File Organization

### Directory Structure

```
OrbitIQ/
│
├── app/
│   ├── layout.tsx ..................... Root layout
│   ├── page.tsx ....................... Homepage
│   ├── globals.css .................... Global styles
│   └── providers.tsx .................. Context providers
│
├── components/
│   ├── workflow-builder.tsx ........... Main canvas
│   ├── node-types/
│   │   ├── base-node.tsx ............. Shared node UI
│   │   ├── text-generation-node.tsx .. Text gen
│   │   ├── image-generation-node.tsx . Image gen
│   │   ├── file-to-text-node.tsx .... File process
│   │   ├── image-to-text-node.tsx ... Image analysis
│   │   └── output-node.tsx .......... Results display
│   │
│   ├── framer-ai-button/
│   │   ├── AIButton.tsx ............ Original button
│   │   ├── AIButtonEnhanced.tsx .... New with execution
│   │   ├── Button.anim.tsx ......... Animations
│   │   └── components/ ............ Sub-components
│   │
│   └── ui/ ......................... Shadcn components
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       └── ... (40+ UI components)
│
├── hooks/
│   ├── use-toast.ts ................. Toast hook
│   └── use-workflow-execution.ts .... NEW: Execution
│
├── lib/
│   ├── atoms.ts ..................... Recoil state
│   ├── types.ts ..................... TypeScript types
│   ├── utils.ts ..................... Utilities
│   └── gemini-service.ts ............ NEW: API wrapper
│
├── public/
│   └── ... (images, fonts)
│
├── Documentation/
│   ├── README_GEMINI_INTEGRATION.md
│   ├── INTEGRATION_SUMMARY.md
│   ├── GEMINI_INTEGRATION_GUIDE.md
│   ├── IMPLEMENTATION_CHECKLIST.md
│   ├── QUICK_REFERENCE.md
│   └── TROUBLESHOOTING.md
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── components.json
└── postcss.config.js
```

---

## 🔄 Error Handling Pipeline

```
Error Occurs
(API call, validation, etc.)
        │
        ▼
Catch Block Triggered
        │
        ▼
┌──────────────────────────────┐
│ Error Analysis               │
│ - Is it validation error?    │
│ - Is it API error?           │
│ - Is it network error?       │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ Generate Error Message       │
│ - User-friendly format       │
│ - Specific instructions      │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ Update State                 │
│ - Set error message          │
│ - Set isExecuting = false    │
│ - Show in dialog             │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ Show to User                 │
│ - Error dialog               │
│ - Toast notification         │
│ - Console log for debug      │
└──────────────────────────────┘
```

---

## 📊 Performance Characteristics

### Time Complexity

| Operation | Time |
|-----------|------|
| Load workflow | O(n) - n = total nodes |
| Save workflow | O(n) - save all nodes |
| Execute workflow | O(n*m) - n = nodes, m = avg API time |
| Render canvas | O(n) - n = visible nodes |
| Find node | O(n) - n = total nodes |

### Space Complexity

| Storage | Size |
|---------|------|
| Per node | ~2KB |
| Per edge | ~0.5KB |
| Local storage | ~100KB per workflow |

---

## 🎓 Key Design Patterns

### 1. Component Composition
```
BaseNode
  └─ (Specific Node Types)
     ├─ TextGenerationNode
     ├─ ImageGenerationNode
     ├─ FileToTextNode
     └─ ImageToTextNode
```

### 2. State Lift-up
```
WorkflowBuilder (Parent)
  ├─ Holds: nodes, edges, workflow state
  ├─ Passes down: updateNodeData callback
  └─ Listens to: onChange events
```

### 3. Custom Hooks
```
useWorkflowExecution()
  └─ Encapsulates:
     ├─ Execution logic
     ├─ State management
     └─ API integration
```

### 4. Atomic State
```
Recoil workflowState atom
  └─ Single source of truth for:
     ├─ All nodes
     ├─ All connections
     └─ Metadata
```

---

**Architecture Documentation Complete** ✨

For implementation details, see `GEMINI_INTEGRATION_GUIDE.md`
For quick reference, see `QUICK_REFERENCE.md`
