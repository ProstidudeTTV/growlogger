import { config } from '../config/index.js';

interface StrainInfo {
  name: string;
  type?: string; // Indica, Sativa, Hybrid
  thc?: string;
  cbd?: string;
  effects?: string[];
  flavors?: string[];
  growingInfo?: string;
  floweringTime?: string;
  yield?: string;
  difficulty?: string;
  description?: string;
}

/**
 * Check if we're using Ollama (local or network instance)
 */
function isOllamaUrl(url: string): boolean {
  const match = url.match(/192\.168\.\d+\.\d+:11434/);
  return url.includes('ollama') || url.includes('11434') || url.includes('localhost:11434') || url.includes('127.0.0.1:11434') || (match !== null);
}

/**
 * Check if we're using Gemini API
 */
function isGeminiProvider(provider: string, apiKey?: string): boolean {
  if (provider === 'gemini') return true;
  if (provider === 'auto' && apiKey?.startsWith('AIza')) return true; // Gemini keys start with AIza
  return false;
}

/**
 * Normalize Gemini model names.
 * Valid Gemini models include:
 * - gemini-2.5-flash (latest, fastest)
 * - gemini-2.5-pro (latest, more capable)
 * - gemini-flash-latest (stable)
 * - gemini-pro-latest (stable)
 */
function normalizeGeminiModel(model: string): string {
  const trimmed = model.trim();
  if (!trimmed) return 'gemini-flash-latest';

  // If already looks like a Gemini model, keep it.
  if (trimmed.startsWith('gemini-')) {
    // Common shorthand people use - map to valid models
    if (trimmed === 'gemini-1.5-flash' || trimmed === 'gemini-1.5-flash-latest') return 'gemini-2.5-flash';
    if (trimmed === 'gemini-1.5-pro' || trimmed === 'gemini-1.5-pro-latest') return 'gemini-2.5-pro';
    if (trimmed === 'gemini-pro') return 'gemini-pro-latest';
    if (trimmed === 'gemini-flash') return 'gemini-flash-latest';
    return trimmed;
  }

  // If they accidentally set an Ollama/OpenAI model while using Gemini, override.
  return 'gemini-flash-latest';
}

/**
 * Convert OpenAI-compatible URL to Ollama native API URL
 */
function getOllamaApiUrl(url: string): string {
  // If it's already using /api/generate, return as-is
  if (url.includes('/api/generate')) {
    return url;
  }
  
  // If it's using /v1/chat/completions, convert to /api/generate
  if (url.includes('/v1/chat/completions')) {
    return url.replace('/v1/chat/completions', '/api/generate');
  }
  
  // If it's just the base URL, add /api/generate
  const baseUrl = url.replace(/\/+$/, ''); // Remove trailing slashes
  return `${baseUrl}/api/generate`;
}

/**
 * Get strain information using AI (supports OpenAI and Ollama)
 */
export async function getStrainInfo(strainName: string): Promise<string> {
  const apiKey = config.ai?.apiKey;
  const provider = config.ai?.provider || 'auto';
  const usingGemini = isGeminiProvider(provider, apiKey);

  // Only consider Ollama/OpenAI URL when NOT using Gemini.
  let apiUrl = config.ai?.apiUrl || 'https://api.openai.com/v1/chat/completions';
  const usingOllama = !usingGemini && isOllamaUrl(apiUrl);
  
  // Set default model based on provider
  let model = config.ai?.model?.trim();
  if (!model) {
    if (usingGemini) model = 'gemini-flash-latest';
    else if (usingOllama) model = 'llama2';
    else model = 'gpt-3.5-turbo';
  }

  // For OpenAI/Gemini, API key is required. For Ollama, it's optional (not needed for local instances)
  if (!usingOllama && !apiKey) {
    throw new Error('AI API key is not configured. Please set OPENAI_API_KEY or GEMINI_API_KEY in your environment variables, or use Ollama by setting OPENAI_API_URL to your Ollama instance.');
  }

  // Convert Ollama URLs to use native API endpoint
  if (usingOllama) {
    apiUrl = getOllamaApiUrl(apiUrl);
  }

  // Set up Gemini URL if using Gemini
  if (usingGemini) {
    const geminiModel = normalizeGeminiModel(model);
    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
    
    // Log request details for debugging (without exposing full API key)
    console.log('Gemini API Request:', {
      model: geminiModel,
      url: apiUrl.replace(apiKey || '', '***'),
      hasApiKey: !!apiKey
    });
  }

  // Shorter, more efficient prompt
  const systemPrompt = `You are a cannabis expert. Provide detailed information about cannabis strains including: type (Indica/Sativa/Hybrid), THC/CBD content, effects, flavors/terpenes, and growing info (flowering time, yield, difficulty). Be specific and accurate.`;

  const userPrompt = `Tell me about the cannabis strain: ${strainName}`;

  try {

    // Prepare request body
    let requestBody: any;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (usingGemini) {
      // Google Gemini API format
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      requestBody = {
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }]
      };
      // Authorization is in the URL query parameter for Gemini
      
      // Log request body for debugging (truncate if too long)
      console.log('Gemini Request Body:', {
        contents: requestBody.contents.map((c: any) => ({
          parts: c.parts.map((p: any) => ({
            ...p,
            text: p.text ? p.text.substring(0, 100) + '...' : p.text
          }))
        }))
      });
    } else if (usingOllama) {
      // Native Ollama API format (/api/generate)
      // Combine system and user prompts for Ollama
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      requestBody = {
        model: model,
        prompt: fullPrompt,
        stream: false,
      };
    } else {
      // OpenAI-compatible format
      requestBody = {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      };
      // Add Authorization header for OpenAI
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    // Create an AbortController for timeout (longer timeout for Ollama which can be slow, Gemini is fast)
    const controller = new AbortController();
    const timeoutDuration = usingOllama ? 120000 : 60000; // 120 seconds for Ollama, 60 for OpenAI/Gemini
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Unknown error' };
        }
        
        // Log the full error for debugging
        console.error('AI API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        
        let errorMessage = `AI API error: ${response.status} - ${errorData.error?.message || errorData.error || JSON.stringify(errorData)}`;
        
        // Provide helpful error messages for common issues
        if (usingGemini) {
          // Check for specific Gemini error messages
          if (errorData.error?.message?.includes('Received one or more errors')) {
            errorMessage = `Gemini API error: ${errorData.error.message}\n\n` +
              `This usually means:\n` +
              `- The request format is invalid\n` +
              `- The model doesn't support the requested operation\n` +
              `- There's an issue with the API key or permissions\n\n` +
              `Try:\n` +
              `- Using a different model (e.g., gemini-2.5-flash)\n` +
              `- Checking your API key is valid\n` +
              `- Verifying the model name is correct`;
          } else if (errorMessage.includes('models/')) {
            errorMessage += `\n\n💡 **Gemini Model Not Found / Not Supported**\n` +
              `Your Gemini API key is working, but the model name is not valid for this endpoint.\n\n` +
              `Try one of these (recommended):\n` +
              `- gemini-2.5-flash (fastest, latest - recommended)\n` +
              `- gemini-2.5-pro (more capable, latest)\n` +
              `- gemini-flash-latest (stable, fast)\n` +
              `- gemini-pro-latest (stable, higher quality)\n\n` +
              `Set it via: OPENAI_MODEL=gemini-2.5-flash\n` +
              `Or remove OPENAI_MODEL to use the default.`;
          }
        } else if (usingOllama && errorMessage.includes('not found')) {
          errorMessage += `\n\n💡 **Ollama Model Not Found**\n` +
            `The model "${model}" is not installed on your Ollama server.\n` +
            `To install a model, run on your Ollama server:\n` +
            `\`ollama pull ${model}\`\n\n` +
            `Or try a different model like: llama2, mistral, gemma2, llama3, etc.\n` +
            `Update OPENAI_MODEL in your .env file with the model name.`;
        } else if (usingOllama && response.status === 405) {
          errorMessage += `\n\n💡 **Ollama API Endpoint Issue**\n` +
            `The endpoint returned 405 (Method Not Allowed).\n` +
            `Make sure you're using the correct Ollama API endpoint.\n` +
            `Try setting OPENAI_API_URL to: http://192.168.1.160:11434/api/generate\n` +
            `(Note: Use /api/generate, not /v1/chat/completions)`;
        } else if (usingOllama && response.status === 404) {
          errorMessage += `\n\n💡 **Ollama Connection Issue**\n` +
            `Check that:\n` +
            `1. Ollama is running at ${apiUrl.replace('/api/generate', '').replace('/v1/chat/completions', '')}\n` +
            `2. You have models installed (run \`ollama list\` on the Ollama server)\n` +
            `3. The API endpoint is correct (use /api/generate for native Ollama API)`;
        }
        
        throw new Error(errorMessage);
      }

      // Get response as text first to check for error messages
      const responseText = await response.text();
      
      // Check for "Received one or more errors" in the raw response
      if (responseText.includes('Received one or more errors')) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText };
        }
        
        const errorDetails = errorData.error?.message || errorData.error || responseText.substring(0, 500);
        
        throw new Error(
          `Gemini API error: Received one or more errors\n\n` +
          `**Details:** ${errorDetails}\n\n` +
          `**This usually indicates:**\n` +
          `- Your API key may not have access to the model "${model}"\n` +
          `- The model name might be incorrect or unavailable in your region\n` +
          `- There may be a quota or permission issue with your API key\n\n` +
          `**Try these solutions:**\n` +
          `1. Update your .env file: \`OPENAI_MODEL=gemini-flash-latest\`\n` +
          `2. Or try: \`OPENAI_MODEL=gemini-pro-latest\`\n` +
          `3. Verify your Gemini API key is valid and has proper permissions\n` +
          `4. Check if the model is available in your region/account\n\n` +
          `**Current model:** ${model}\n` +
          `**Current provider:** ${provider}`
        );
      }
      
      // Parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response as JSON:', responseText.substring(0, 500));
        throw new Error(`Invalid JSON response from Gemini API: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      // Log full response for debugging (truncate if too long)
      console.log('Gemini API Response:', JSON.stringify(data, null, 2).substring(0, 1000));

      // Handle different response formats
      if (usingGemini) {
        // Check for errors in Gemini response (even with 200 status)
        if (data.error) {
          const errorMsg = data.error.message || JSON.stringify(data.error);
          
          // Check for the specific "Received one or more errors" message
          if (errorMsg.includes('Received one or more errors')) {
            throw new Error(
              `Gemini API error: ${errorMsg}\n\n` +
              `This usually indicates:\n` +
              `- The API key may not have access to this model\n` +
              `- The model name might be incorrect or unavailable\n` +
              `- There may be a quota or permission issue\n\n` +
              `Try:\n` +
              `- Using a different model: gemini-flash-latest or gemini-pro-latest\n` +
              `- Verifying your API key has the correct permissions\n` +
              `- Checking the Gemini API status page`
            );
          }
          
          throw new Error(`Gemini API error: ${errorMsg}`);
        }

        // Check for "errors" array in response (Gemini sometimes returns this)
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const errorMessages = data.errors.map((e: any) => e.message || JSON.stringify(e)).join(', ');
          
          if (errorMessages.includes('Received one or more errors')) {
            throw new Error(
              `Gemini API returned errors: ${errorMessages}\n\n` +
              `This usually indicates:\n` +
              `- The API key may not have access to this model\n` +
              `- The model name might be incorrect or unavailable\n` +
              `- There may be a quota or permission issue\n\n` +
              `Try:\n` +
              `- Using a different model: gemini-flash-latest or gemini-pro-latest\n` +
              `- Verifying your API key has the correct permissions`
            );
          }
          
          throw new Error(`Gemini API returned errors: ${errorMessages}`);
        }

        // Check for prompt feedback issues (safety blocks, etc.)
        if (data.promptFeedback) {
          const blockReason = data.promptFeedback.blockReason;
          if (blockReason && blockReason !== 'BLOCK_REASON_UNSPECIFIED') {
            const safetyRatings = data.promptFeedback.safetyRatings || [];
            const safetyIssues = safetyRatings
              .filter((r: any) => r.probability === 'HIGH' || r.probability === 'MEDIUM')
              .map((r: any) => `${r.category}: ${r.probability}`)
              .join(', ');
            
            throw new Error(
              `Content was blocked by Gemini safety filters. ` +
              `Reason: ${blockReason}${safetyIssues ? `. Issues: ${safetyIssues}` : ''}. ` +
              `Try rephrasing your question or removing any potentially sensitive content.`
            );
          }
        }

        // Check if candidates array is empty or missing
        if (!data.candidates || data.candidates.length === 0) {
          throw new Error(
            `Gemini API returned no candidates. ` +
            `This may indicate the request was blocked or invalid. ` +
            `Response: ${JSON.stringify(data).substring(0, 500)}`
          );
        }

        // Check for candidate finish reasons
        const candidate = data.candidates[0];
        
        // Check finish reason
        if (candidate.finishReason) {
          if (candidate.finishReason === 'SAFETY') {
            throw new Error(
              `Response was blocked due to safety concerns. ` +
              `Try rephrasing your question or removing potentially sensitive content.`
            );
          } else if (candidate.finishReason === 'RECITATION') {
            throw new Error(
              `Response was blocked due to recitation concerns. ` +
              `The content may be too similar to copyrighted material.`
            );
          } else if (candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
            throw new Error(
              `Response finished with reason: ${candidate.finishReason}. ` +
              `This may indicate an issue with the request.`
            );
          }
        }

        // Check for content
        if (candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text) {
          return candidate.content.parts[0].text.trim();
        }
        
        // Check if parts array is empty or has no text
        if (candidate.content && candidate.content.parts && candidate.content.parts.length === 0) {
          throw new Error(
            `Gemini returned empty content parts. ` +
            `This may indicate the response was blocked or filtered.`
          );
        }

        // If we get here, the response structure is unexpected
        console.error('Unexpected Gemini response structure:', JSON.stringify(data, null, 2));
        throw new Error(
          `Invalid response format from Gemini API. ` +
          `Expected candidates[0].content.parts[0].text but got: ${JSON.stringify(data).substring(0, 500)}`
        );
      } else if (usingOllama) {
        // Native Ollama format (/api/generate)
        if (data.response) {
          return data.response.trim();
        }
        // Some Ollama versions might use different format
        if (typeof data === 'string') {
          return data.trim();
        }
        throw new Error(`Invalid response format from Ollama API. Received: ${JSON.stringify(data).substring(0, 200)}`);
      } else {
        // OpenAI-compatible format
        if (data.choices && data.choices[0] && data.choices[0].message) {
          return data.choices[0].message.content.trim();
        }
        // Fallback: Some APIs might use 'message' directly
        if (data.message && data.message.content) {
          return data.message.content.trim();
        }
        throw new Error('Invalid response format from AI API');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutSeconds = usingOllama ? 120 : 60;
        let errorMsg = `Request timed out after ${timeoutSeconds} seconds.`;
        if (usingOllama) {
          errorMsg += ' Ollama may be slow - try using a faster model or wait a bit and try again.';
        } else if (usingGemini) {
          errorMsg += ' Gemini API may be experiencing issues.';
        } else {
          errorMsg += ' The AI service may be slow or overloaded.';
        }
        throw new Error(errorMsg);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch strain information from AI service');
  }
}

/**
 * Format strain information into Discord embed-friendly format
 * Returns an array of embed builders to handle long responses
 */
export function formatStrainInfo(strainName: string, aiResponse: string): { embeds: any[] } {
  // Clean up the AI response
  let formatted = aiResponse.trim();

  // Discord limits:
  // - Embed description: 4096 characters
  // - Embed field value: 1024 characters
  // - Embed field name: 256 characters
  // - Max fields per embed: 25
  // - Max embeds per message: 10

  // Try to parse structured sections from the response
  const sections = parseStrainResponse(formatted);
  
  if (sections.length > 0) {
    // Use fields for structured content
    return createStructuredEmbeds(strainName, sections);
  } else {
    // Use description for unstructured content, split into multiple embeds if needed
    return createDescriptionEmbeds(strainName, formatted);
  }
}

/**
 * Parse AI response into structured sections
 */
function parseStrainResponse(response: string): Array<{ name: string; value: string }> {
  const sections: Array<{ name: string; value: string }> = [];
  
  // Common patterns in strain descriptions
  const patterns = [
    { regex: /(?:Type|Strain Type|Genetics?)[:\-]?\s*(.+?)(?:\n|$)/i, name: '🧬 Type/Genetics' },
    { regex: /(?:THC|THC Content|THC Level)[:\-]?\s*(.+?)(?:\n|$)/i, name: '💊 THC Content' },
    { regex: /(?:CBD|CBD Content|CBD Level)[:\-]?\s*(.+?)(?:\n|$)/i, name: '💊 CBD Content' },
    { regex: /(?:Effects?|Effect Profile)[:\-]?\s*(.+?)(?:\n\n|$)/is, name: '✨ Effects' },
    { regex: /(?:Flavor|Flavors?|Taste|Aroma|Aromas?)[:\-]?\s*(.+?)(?:\n\n|$)/is, name: '👃 Flavors/Aromas' },
    { regex: /(?:Terpenes?|Terpene Profile)[:\-]?\s*(.+?)(?:\n\n|$)/is, name: '🌿 Terpenes' },
    { regex: /(?:Growing|Grow Info|Growing Info|Cultivation)[:\-]?\s*(.+?)(?:\n\n|$)/is, name: '🌱 Growing Info' },
    { regex: /(?:Flowering Time|Flower Time|Flowering)[:\-]?\s*(.+?)(?:\n|$)/i, name: '⏱️ Flowering Time' },
    { regex: /(?:Yield|Yield Size)[:\-]?\s*(.+?)(?:\n|$)/i, name: '📊 Yield' },
    { regex: /(?:Difficulty|Grow Difficulty|Difficulty Level)[:\-]?\s*(.+?)(?:\n|$)/i, name: '📈 Difficulty' },
    { regex: /(?:Description|Overview|Summary)[:\-]?\s*(.+?)(?:\n\n|$)/is, name: '📝 Description' },
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern.regex);
    if (match && match[1]) {
      let value = match[1].trim();
      // Limit field value to 1024 characters
      if (value.length > 1024) {
        value = value.substring(0, 1021) + '...';
      }
      if (value.length > 0) {
        sections.push({ name: pattern.name, value });
      }
    }
  }

  return sections;
}

/**
 * Create embeds using structured fields
 */
function createStructuredEmbeds(strainName: string, sections: Array<{ name: string; value: string }>): { embeds: any[] } {
  const embeds: any[] = [];
  const maxFieldsPerEmbed = 25;
  const maxFieldValueLength = 1024;

  // Split sections across multiple embeds if needed
  for (let i = 0; i < sections.length; i += maxFieldsPerEmbed) {
    const embedSections = sections.slice(i, i + maxFieldsPerEmbed);
    
    const embed: any = {
      title: i === 0 ? `🧬 Strain Information: ${strainName}` : `🧬 ${strainName} (continued)`,
      color: 0x9b59b6, // Purple
      fields: embedSections.map(section => ({
        name: section.name,
        value: section.value.length > maxFieldValueLength 
          ? section.value.substring(0, maxFieldValueLength - 3) + '...'
          : section.value,
        inline: false
      })),
      footer: { text: 'Information provided by AI • Results may vary' },
      timestamp: new Date()
    };

    embeds.push(embed);
  }

  return { embeds };
}

/**
 * Create embeds using description (for unstructured content)
 */
function createDescriptionEmbeds(strainName: string, content: string): { embeds: any[] } {
  const embeds: any[] = [];
  const maxDescriptionLength = 4096;
  const maxEmbeds = 10;

  // Split content into chunks that fit in description
  let remaining = content;
  let embedIndex = 0;

  while (remaining.length > 0 && embedIndex < maxEmbeds) {
    let chunk: string;
    
    if (remaining.length <= maxDescriptionLength) {
      chunk = remaining;
      remaining = '';
    } else {
      // Try to break at a sentence or paragraph boundary
      const breakPoint = findBestBreakPoint(remaining, maxDescriptionLength);
      chunk = remaining.substring(0, breakPoint);
      remaining = remaining.substring(breakPoint).trim();
    }

    const embed: any = {
      title: embedIndex === 0 ? `🧬 Strain Information: ${strainName}` : `🧬 ${strainName} (continued)`,
      description: chunk,
      color: 0x9b59b6, // Purple
      footer: { text: 'Information provided by AI • Results may vary' },
      timestamp: new Date()
    };

    embeds.push(embed);
    embedIndex++;
  }

  // If we still have content left, add a note
  if (remaining.length > 0) {
    embeds[embeds.length - 1].description += '\n\n*Response was too long and has been truncated.*';
  }

  return { embeds };
}

/**
 * Find the best break point in text (prefer sentence/paragraph boundaries)
 */
function findBestBreakPoint(text: string, maxLength: number): number {
  if (text.length <= maxLength) return text.length;

  // Try to break at paragraph (double newline)
  const paragraphBreak = text.lastIndexOf('\n\n', maxLength);
  if (paragraphBreak > maxLength * 0.7) return paragraphBreak + 2;

  // Try to break at sentence (period, exclamation, question mark)
  const sentenceBreak = Math.max(
    text.lastIndexOf('. ', maxLength),
    text.lastIndexOf('! ', maxLength),
    text.lastIndexOf('? ', maxLength)
  );
  if (sentenceBreak > maxLength * 0.7) return sentenceBreak + 2;

  // Try to break at single newline
  const lineBreak = text.lastIndexOf('\n', maxLength);
  if (lineBreak > maxLength * 0.7) return lineBreak + 1;

  // Fall back to word boundary
  const wordBreak = text.lastIndexOf(' ', maxLength);
  if (wordBreak > maxLength * 0.7) return wordBreak + 1;

  // Last resort: hard cut
  return maxLength;
}

/**
 * Convert image URL to base64 for Gemini API
 */
async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    // Determine content type from response headers or URL
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Error fetching image:', error);
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Ask a cannabis-related question with optional image attachments for plant problem identification
 */
export async function askCannabisQuestion(question: string, imageUrls: string[] = []): Promise<string> {
  const apiKey = config.ai?.apiKey;
  const provider = config.ai?.provider || 'auto';
  const usingGemini = isGeminiProvider(provider, apiKey);

  // Only consider Ollama/OpenAI URL when NOT using Gemini.
  let apiUrl = config.ai?.apiUrl || 'https://api.openai.com/v1/chat/completions';
  const usingOllama = !usingGemini && isOllamaUrl(apiUrl);
  
  // Set default model based on provider
  let model = config.ai?.model?.trim();
  if (!model) {
    if (usingGemini) model = 'gemini-flash-latest';
    else if (usingOllama) model = 'llama2';
    else model = 'gpt-3.5-turbo';
  }

  // For OpenAI/Gemini, API key is required. For Ollama, it's optional
  if (!usingOllama && !apiKey) {
    throw new Error('AI API key is not configured. Please set OPENAI_API_KEY or GEMINI_API_KEY in your environment variables, or use Ollama by setting OPENAI_API_URL to your Ollama instance.');
  }

  // Image support: Only Gemini currently supports vision/image analysis
  if (imageUrls.length > 0 && !usingGemini) {
    console.warn('Image analysis is only supported with Gemini. Processing question as text-only.');
  }

  // Convert Ollama URLs to use native API endpoint
  if (usingOllama) {
    apiUrl = getOllamaApiUrl(apiUrl);
  }

  // System prompt for cannabis expert
  const systemPrompt = `You are an expert cannabis cultivator and consultant with extensive knowledge of:
- Plant health, diseases, pests, and nutrient deficiencies
- Growing techniques, lighting, watering, and feeding schedules
- Problem diagnosis from visual symptoms
- Strain-specific care requirements
- Harvest timing and techniques
- Troubleshooting common growing issues

Provide detailed, accurate, and helpful answers. If analyzing images, describe what you see and provide specific recommendations.`;

  const userPrompt = question;

  try {
    // Prepare request body
    let requestBody: any;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (usingGemini) {
      // Google Gemini API format with image support
      const geminiModel = normalizeGeminiModel(model);
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
      
      const parts: any[] = [
        { text: `${systemPrompt}\n\n${userPrompt}` }
      ];

      // Add images if provided (Gemini supports vision)
      if (imageUrls.length > 0) {
        try {
          // Validate image URLs first
          for (const url of imageUrls) {
            if (!url || typeof url !== 'string' || !url.startsWith('http')) {
              throw new Error(`Invalid image URL: ${url}. URLs must start with http:// or https://`);
            }
          }

          // Fetch and convert images to base64
          const imagePromises = imageUrls.map((url, index) => 
            fetchImageAsBase64(url).catch(error => {
              throw new Error(`Failed to fetch image ${index + 1} (${url}): ${error instanceof Error ? error.message : 'Unknown error'}`);
            })
          );
          const base64Images = await Promise.all(imagePromises);
          
          for (let i = 0; i < base64Images.length; i++) {
            const base64Image = base64Images[i];
            // Parse data URI: data:image/jpeg;base64,<data>
            const parts_split = base64Image.split(',');
            if (parts_split.length < 2) {
              throw new Error(`Invalid image data format for image ${i + 1}. Expected data URI format.`);
            }
            
            const [mimePart, base64Data] = parts_split;
            const mimeType = mimePart.split(';')[0].split(':')[1] || 'image/jpeg';
            
            // Validate base64 data
            if (!base64Data || base64Data.length === 0) {
              throw new Error(`Empty image data for image ${i + 1}`);
            }

            // Check image size (Gemini has limits - typically 20MB per image, but base64 is ~33% larger)
            const imageSizeMB = (base64Data.length * 3) / 4 / 1024 / 1024;
            if (imageSizeMB > 20) {
              throw new Error(`Image ${i + 1} is too large (${imageSizeMB.toFixed(2)}MB). Maximum size is 20MB.`);
            }
            
            parts.push({
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            });
          }
        } catch (imageError) {
          console.error('Error processing images:', imageError);
          throw new Error(`Failed to process images: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
        }
      }

      requestBody = {
        contents: [{
          parts: parts
        }]
      };
    } else if (usingOllama) {
      // Native Ollama API format (/api/generate)
      // Note: Ollama may support vision models, but we'll use text-only for now
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      if (imageUrls.length > 0) {
        console.warn('Ollama image support not implemented. Processing as text-only.');
      }
      requestBody = {
        model: model,
        prompt: fullPrompt,
        stream: false,
      };
    } else {
      // OpenAI-compatible format
      // Note: OpenAI GPT-4 Vision supports images, but we'll use text-only for GPT-3.5
      // For full image support, you'd need to use GPT-4 Vision API
      if (imageUrls.length > 0) {
        console.warn('Image analysis requires GPT-4 Vision. Processing as text-only with GPT-3.5.');
      }
      requestBody = {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      };
      // Add Authorization header for OpenAI
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutDuration = usingOllama ? 120000 : 60000; // 120 seconds for Ollama, 60 for OpenAI/Gemini
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Unknown error' };
        }
        
        // Log the full error for debugging
        console.error('AI API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        
        let errorMessage = `AI API error: ${response.status} - ${errorData.error?.message || errorData.error || JSON.stringify(errorData)}`;
        
        // Check for specific Gemini error messages
        if (usingGemini) {
          if (errorData.error?.message?.includes('Received one or more errors')) {
            errorMessage = `Gemini API error: ${errorData.error.message}\n\n` +
              `This usually means:\n` +
              `- The request format is invalid\n` +
              `- Images couldn't be processed (check image URLs/format)\n` +
              `- The model doesn't support the requested operation\n\n` +
              `Try:\n` +
              `- Using text-only questions first to test\n` +
              `- Checking that image URLs are accessible\n` +
              `- Using a different model (e.g., gemini-2.5-flash)`;
          } else if (errorMessage.includes('models/')) {
            errorMessage += `\n\n💡 **Gemini Model Not Found / Not Supported**\n` +
              `Your Gemini API key is working, but the model name is not valid.\n\n` +
              `Try one of these:\n` +
              `- gemini-2.5-flash (fastest, latest - recommended)\n` +
              `- gemini-2.5-pro (more capable, latest)\n` +
              `- gemini-flash-latest (stable, fast)\n` +
              `- gemini-pro-latest (stable, higher quality)\n\n` +
              `Set it via: OPENAI_MODEL=gemini-2.5-flash`;
          }
        } else if (usingOllama && errorMessage.includes('not found')) {
          errorMessage += `\n\n💡 **Ollama Model Not Found**\n` +
            `The model "${model}" is not installed on your Ollama server.\n` +
            `To install a model, run: \`ollama pull ${model}\``;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json() as any;

      // Parse response based on provider
      if (usingGemini) {
        // Check for errors in Gemini response (even with 200 status)
        if (data.error) {
          const errorMsg = data.error.message || JSON.stringify(data.error);
          throw new Error(`Gemini API error: ${errorMsg}`);
        }

        // Check for "errors" array in response (Gemini sometimes returns this)
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const errorMessages = data.errors.map((e: any) => e.message || JSON.stringify(e)).join(', ');
          throw new Error(`Gemini API returned errors: ${errorMessages}`);
        }

        // Check for prompt feedback issues (safety blocks, etc.)
        if (data.promptFeedback) {
          const blockReason = data.promptFeedback.blockReason;
          if (blockReason && blockReason !== 'BLOCK_REASON_UNSPECIFIED') {
            const safetyRatings = data.promptFeedback.safetyRatings || [];
            const safetyIssues = safetyRatings
              .filter((r: any) => r.probability === 'HIGH' || r.probability === 'MEDIUM')
              .map((r: any) => `${r.category}: ${r.probability}`)
              .join(', ');
            
            throw new Error(
              `Content was blocked by Gemini safety filters. ` +
              `Reason: ${blockReason}${safetyIssues ? `. Issues: ${safetyIssues}` : ''}. ` +
              `Try rephrasing your question or removing any potentially sensitive content.`
            );
          }
        }

        // Check if candidates array is empty or missing
        if (!data.candidates || data.candidates.length === 0) {
          throw new Error(
            `Gemini API returned no candidates. ` +
            `This may indicate the request was blocked or invalid. ` +
            `Response: ${JSON.stringify(data).substring(0, 500)}`
          );
        }

        // Check for candidate finish reasons
        const candidate = data.candidates[0];
        
        // Check finish reason
        if (candidate.finishReason) {
          if (candidate.finishReason === 'SAFETY') {
            throw new Error(
              `Response was blocked due to safety concerns. ` +
              `Try rephrasing your question or removing potentially sensitive content.`
            );
          } else if (candidate.finishReason === 'RECITATION') {
            throw new Error(
              `Response was blocked due to recitation concerns. ` +
              `The content may be too similar to copyrighted material.`
            );
          } else if (candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
            throw new Error(
              `Response finished with reason: ${candidate.finishReason}. ` +
              `This may indicate an issue with the request.`
            );
          }
        }

        // Check for content
        if (candidate.content) {
          const content = candidate.content;
          if (content.parts && content.parts[0] && content.parts[0].text) {
            return content.parts[0].text.trim();
          }
          
          // Check if parts array is empty or has no text
          if (content.parts && content.parts.length === 0) {
            throw new Error(
              `Gemini returned empty content parts. ` +
              `This may indicate the response was blocked or filtered.`
            );
          }
        }

        // If we get here, the response structure is unexpected
        console.error('Unexpected Gemini response structure:', JSON.stringify(data, null, 2));
        throw new Error(
          `Invalid response format from Gemini API. ` +
          `Expected candidates[0].content.parts[0].text but got: ${JSON.stringify(data).substring(0, 500)}`
        );
      } else if (usingOllama) {
        if (data.response) {
          return data.response.trim();
        }
        throw new Error('Invalid response format from Ollama API');
      } else {
        // OpenAI-compatible format
        if (data.choices && data.choices[0] && data.choices[0].message) {
          return data.choices[0].message.content.trim();
        }
        throw new Error('Invalid response format from AI API');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutSeconds = usingOllama ? 120 : 60;
        let errorMsg = `Request timed out after ${timeoutSeconds} seconds.`;
        if (usingOllama) {
          errorMsg += ' Ollama may be slow - try using a faster model.';
        } else if (usingGemini) {
          errorMsg += ' Gemini API may be experiencing issues.';
        } else {
          errorMsg += ' The AI service may be slow or overloaded.';
        }
        throw new Error(errorMsg);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get answer from AI service');
  }
}
