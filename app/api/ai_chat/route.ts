import { NextResponse } from "next/server";
import products from "@/data/product.json";

// Define types for better type safety
interface Message {
  role: string;
  content: string;
}

interface IntentResult {
  hasBuyingIntent: boolean;
  confidence: number;
  reasoning: string;
}

// Minimal in-memory store
const conversations: Record<string, Message[]> = {};

// 🤖 AI-powered buying intent detection (NO KEYWORDS NEEDED!)
async function detectBuyingIntentWithAI(message: string, conversationHistory: Message[] = []): Promise<IntentResult> {
  const intentPrompt = `
You are an expert at analyzing customer messages to detect buying intent. 

Analyze this customer message and conversation context to determine if the customer wants to make a purchase.

CUSTOMER MESSAGE: "${message}"

CONVERSATION CONTEXT: ${JSON.stringify(conversationHistory.slice(-3))} // Last 3 messages for context

INSTRUCTIONS:
1. Determine if the customer has buying intent (wants to purchase, order, or complete a transaction)
2. Consider the conversation context and flow
3. Look for implicit signals like:
   - Asking about availability/stock
   - Requesting pricing information
   - Asking about delivery/payment methods
   - Expressing urgency or readiness
   - Asking how to order/purchase
   - Requesting contact information for purchase
   - Comparing products for purchase decision

RESPOND WITH ONLY A JSON OBJECT:
{
  "hasBuyingIntent": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

Examples:
- "bghit nchri iPhone" → {"hasBuyingIntent": true, "confidence": 0.95, "reasoning": "Direct purchase statement"}
- "ch7al taman iPhone?" → {"hasBuyingIntent": true, "confidence": 0.8, "reasoning": "Price inquiry indicates purchase consideration"}
- "kayn stock?" → {"hasBuyingIntent": true, "confidence": 0.7, "reasoning": "Stock inquiry suggests purchase intent"}
- "wach hadi phone mezyan?" → {"hasBuyingIntent": false, "confidence": 0.3, "reasoning": "Just asking for opinion/review"}
- "chokran bzaf" → {"hasBuyingIntent": false, "confidence": 0.1, "reasoning": "Just thanking"}
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3.1:free",
        messages: [
          { role: "system", content: intentPrompt }
        ],
        temperature: 0.1, // Low temperature for consistent results
        max_tokens: 200
      }),
    });
    
    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    console.log("🤖 AI Intent Detection:", result);
    return result;
    
  } catch (error) {
    console.error("❌ Intent detection failed:", error);
    // Simple fallback - assume no buying intent if AI fails
    return { 
      hasBuyingIntent: false, 
      confidence: 0.0, 
      reasoning: "AI detection failed, defaulting to no intent" 
    };
  }
}

function findRelevantProducts(message: string) {
  const messageLower = message.toLowerCase();
  
  // Check if asking for "all products"
  const askingForAll = [
    'kol chi', 'ga3 les produits', 'kol les produits', 'ga3 chi',
    'all products', 'tout les produits', 'kollchi', 'ga3ma 3andkom',
    'ga3 li 3andkom', 'ch7al mn produit 3andkom', 'kolchi li 3andkom',
    'bghit nshoof kolchi', 'ta9adar twarini kolchi', 'chno li 3andkom',
    'bghit nchouf kol wa7ad'
  ].some(phrase => messageLower.includes(phrase));
  
  if (askingForAll) {
    return products.products;
  }
  
  // Category requests
  const categoryRequests = [
    { 
      keywords: ['kol les phones', 'ga3 les téléphones', 'ga3 les phones', 'kol les iPhone', 'ga3 les iphones'], 
      category: 'phone' 
    },
    { 
      keywords: ['kol les airpods', 'ga3 les écouteurs', 'ga3 les earbuds'], 
      category: 'earbuds' 
    },
    { 
      keywords: ['kol les chargeurs', 'ga3 les chargers', 'ga3 les chargeurs'], 
      category: 'charger' 
    }
  ];
  
  for (const categoryReq of categoryRequests) {
    if (categoryReq.keywords.some(keyword => messageLower.includes(keyword))) {
      return products.products.filter(product => product.category === categoryReq.category);
    }
  }
  
  // Exact product match
  const exactMatch = products.products.find(product => 
    messageLower.includes(product.name.toLowerCase())
  );
  
  if (exactMatch) {
    return [exactMatch];
  }
  
  // Keyword match
  const keywordMatch = products.products.find(product => 
    product.keywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      return messageLower.includes(keywordLower) && keywordLower.length > 4;
    })
  );
  
  if (keywordMatch) {
    return [keywordMatch];
  }
  
  // Category match
  const categories = ['phone', 'earbuds', 'charger'];
  for (const category of categories) {
    if (messageLower.includes(category) || 
        (category === 'phone' && (messageLower.includes('téléphone') || messageLower.includes('telephone'))) ||
        (category === 'earbuds' && (messageLower.includes('écouteur') || messageLower.includes('airpods'))) ||
        (category === 'charger' && (messageLower.includes('chargeur') || messageLower.includes('charger')))) {
      return products.products.filter(product => product.category === category);
    }
  }
  
  return [];
}

export async function POST(req: Request) {
  const { message, clientId } = await req.json();
  
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }
  
  // Initialize conversation if first time
  if (!conversations[clientId]) conversations[clientId] = [];
  
  // System prompt for the main AI assistant
  const systemPrompt = `
You are a Moroccan tech shop assistant. Your job is to answer customer questions about products (phones, watches, AirPods, accessories) in a natural human-like way.

Follow these rules:
1. Always respond in **Moroccan Darija** using natural, friendly, human expressions.
2. Never reply in English or French unless the customer writes in those languages.
3. Include the following information naturally in your response whenever relevant:
   - Product name
   - Price (MAD)
   - Stock availability
   - Short product description
   - Store location (Sidi Moumen or Lagroun)
   - Contact info (phone, email) if requested
4. Keep your reply concise, friendly, and clear, like you are talking to a real customer.
5. Never include JSON, code snippets, extra symbols, or unnecessary explanations.
6. If the customer asks about a product you don't have, politely say you don't have it and suggest alternatives.

Store Information:
- Name: ${products.store.name} (${products.store.main_name})
- Locations: Sidi Moumen & Lagroun, Casablanca
- Phone: ${products.store.phone}
- Email: ${products.store.email}
- Hours: ${products.store.hours}

Product Catalog:
${JSON.stringify(products.products)}
`;

  // Add user message to conversation
  conversations[clientId].push({ role: "user", content: message });
  
  // 🤖 AI-powered intent detection (NO KEYWORDS!)
  const intentResult = await detectBuyingIntentWithAI(message, conversations[clientId]);
  
  // 🔍 Find relevant products
  const relevantProducts = findRelevantProducts(message);
  
  // 💬 Send conversation to main AI assistant
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat-v3.1:free",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversations[clientId],
      ],
    }),
  });
  
  const data = await response.json();
  const reply = data.choices[0].message.content;
  
  // Save AI reply to conversation history
  conversations[clientId].push({ role: "assistant", content: reply });
  
  // 🎯 Make intelligent decisions based on AI confidence
  const shouldShowForm = intentResult.hasBuyingIntent && intentResult.confidence > 0.6;
  
  console.log(`📊 Intent Analysis: ${intentResult.hasBuyingIntent ? 'BUY' : 'NO_BUY'} (${Math.round(intentResult.confidence * 100)}%)`);
  
  // Return enhanced response
  return NextResponse.json({ 
    reply,
    showForm: shouldShowForm,
    products: relevantProducts.length > 0 ? relevantProducts : null,
    intentAnalysis: {
      hasBuyingIntent: intentResult.hasBuyingIntent,
      confidence: intentResult.confidence,
      reasoning: intentResult.reasoning
    }
  });
}