/**
 * Gemini API Service
 * Handles all AI operations for different node types
 */

const GEMINI_API_KEY = "AIzaSyBxPXo5p3uzSC6QXSP-6qFV48vfvVxJANA";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models";

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
      }>;
    };
  }>;
}

export interface ImageGenerationResponse {
  images?: string[];
  error?: string;
}

/**
 * Generate text using Gemini Pro model
 * Best for: Text generation from prompts
 */
export async function generateText(prompt: string): Promise<string> {
  try {
    if (!prompt.trim()) {
      throw new Error("Prompt cannot be empty");
    }

    const response = await fetch(
      `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2048,
            topP: 1,
            topK: 1,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate text");
    }

    const data: GeminiResponse = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response generated";
    return text;
  } catch (error) {
    console.error("Text generation error:", error);
    throw error;
  }
}

/**
 * Generate image using Gemini Pro Vision model
 * Best for: Image generation from text descriptions
 */
export async function generateImage(prompt: string): Promise<string> {
  try {
    if (!prompt.trim()) {
      throw new Error("Prompt cannot be empty");
    }

    // Use Pollinations.ai - Free, fast, and efficient image generation
    // No API key required, generates high-quality images instantly
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${Math.random()}`;
    
    console.log("Generating image from prompt:", prompt);
    console.log("Image URL:", imageUrl);
    
    // Return the image URL directly
    // Pollinations.ai handles image generation server-side
    return imageUrl;
  } catch (error) {
    console.error("Image generation error:", error);
    // Return a fallback placeholder image on error
    return generatePlaceholderImage(prompt);
  }
}

/**
 * Extract text from file content using Gemini Pro Vision
 * Best for: Processing documents and extracting information
 */
export async function extractTextFromFile(fileData: string): Promise<string> {
  try {
    if (!fileData.trim()) {
      throw new Error("File data cannot be empty");
    }

    const response = await fetch(
      `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Extract and summarize the key information from the following text. Keep it concise and clear:\n\n${fileData}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to extract text from file");
    }

    const data: GeminiResponse = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No text extracted";
    return text;
  } catch (error) {
    console.error("File extraction error:", error);
    throw error;
  }
}

/**
 * Extract text description from image using Gemini Pro Vision
 * Best for: Understanding and describing images
 */
export async function extractTextFromImage(
  imageData: string
): Promise<string> {
  try {
    if (!imageData.trim()) {
      throw new Error("Image data cannot be empty");
    }

    // Extract base64 from data URL if needed
    let base64Data = imageData;
    if (imageData.includes(",")) {
      base64Data = imageData.split(",")[1];
    }

    const response = await fetch(
      `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Analyze this image and provide a detailed description of what you see. Include objects, colors, composition, and any text visible.",
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error?.message || "Failed to extract text from image"
      );
    }

    const data: GeminiResponse = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No description generated";
    return text;
  } catch (error) {
    console.error("Image text extraction error:", error);
    throw error;
  }
}

/**
 * Extract text from binary files (PDF, DOCX, etc) using Gemini
 * Best for: Processing documents in binary formats
 */
export async function extractTextFromFileBinary(
  base64Data: string,
  mimeType: string
): Promise<string> {
  try {
    if (!base64Data.trim()) {
      throw new Error("File data cannot be empty");
    }

    const response = await fetch(
      `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Extract and summarize all the key information and content from this document. Keep it concise and clear. Include all important text, headings, and data.",
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to extract text from file");
    }

    const data: GeminiResponse = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No text extracted";
    return text;
  } catch (error) {
    console.error("Binary file extraction error:", error);
    throw error;
  }
}

/**
 * Process a complete workflow
 * Executes nodes in sequence based on connections
 */
export async function processWorkflow(
  nodes: any[],
  edges: any[],
  startNodeId: string
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  const visited = new Set<string>();

  async function processNode(nodeId: string): Promise<string> {
    if (visited.has(nodeId)) {
      return results[nodeId] || "";
    }

    visited.add(nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    // Get input from connected nodes
    const inputEdges = edges.filter((e) => e.target === nodeId);
    const inputs: Record<string, string> = {};

    for (const edge of inputEdges) {
      const sourceResult = await processNode(edge.source);
      inputs[edge.source] = sourceResult;
    }

    let output = "";

    switch (node.type) {
      case "textGenerationNode":
        const textPrompt = node.data.prompt || "Generate a response";
        const contextText = Object.values(inputs).join("\n");
        const finalTextPrompt = contextText
          ? `${textPrompt}\n\nContext:\n${contextText}`
          : textPrompt;
        output = await generateText(finalTextPrompt);
        break;

      case "imageGenerationNode":
        const imagePrompt = node.data.prompt || "Generate an image";
        const contextImage = Object.values(inputs).join("\n");
        const finalImagePrompt = contextImage
          ? `${imagePrompt}\n\nBased on: ${contextImage}`
          : imagePrompt;
        output = await generateImage(finalImagePrompt);
        break;

      case "fileToTextNode":
        if (node.data.file?.data) {
          // Check if it's a PDF or other binary format (base64 encoded)
          const fileData = node.data.file.data;
          const fileName = node.data.file.name || "";
          
          if (fileData.startsWith("data:") || fileName.endsWith(".pdf")) {
            // It's a binary file (PDF, etc) - send as base64 to Gemini
            let base64Data = fileData;
            if (fileData.includes(",")) {
              base64Data = fileData.split(",")[1];
            }
            
            // Determine MIME type
            let mimeType = "application/pdf";
            if (fileName.endsWith(".txt")) mimeType = "text/plain";
            else if (fileName.endsWith(".docx")) mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            else if (fileName.endsWith(".doc")) mimeType = "application/msword";
            
            output = await extractTextFromFileBinary(base64Data, mimeType);
          } else {
            // It's plain text
            output = await extractTextFromFile(fileData);
          }
        } else {
          throw new Error("No file provided for file-to-text node");
        }
        break;

      case "imageToTextNode":
        if (node.data.file?.data) {
          output = await extractTextFromImage(node.data.file.data);
        } else {
          throw new Error("No image provided for image-to-text node");
        }
        break;

      case "outputNode":
        // Output node just passes through the input
        output = Object.values(inputs).join("\n") || "No input";
        break;

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }

    results[nodeId] = output;
    return output;
  }

  // Start processing from the output node
  const outputNode = nodes.find((n) => n.type === "outputNode");
  if (outputNode) {
    await processNode(outputNode.id);
  }

  return results;
}

/**
 * Helper function to generate a placeholder image
 * In production, this would call actual image generation APIs
 */
function generatePlaceholderImage(prompt: string): string {
  // Create an SVG placeholder with the prompt text
  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="url(#grad)"/>
      <text x="50%" y="50%                                                                " font-family="Arial" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle" word-spacing="3px">
        ${prompt.substring(0, 100)}
      </text>
      <text x="50%" y="85%" font-family="Arial" font-size="14" fill="rgba(255,255,255,0.7)" text-anchor="middle">
        Generated with Gemini AI
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
