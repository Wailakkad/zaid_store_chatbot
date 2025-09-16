import { NextResponse } from "next/server";
import products from "@/data/product.json";

// Minimal in-memory store
const conversations: Record<string, { role: string; content: string }[]> = {};

// Function to detect buying intent in Darija
function detectBuyingIntent(message: string): boolean {
  const buyingKeywords = [
    'bghit nchri', 'bghit nakhod', 'nachri' , 'kayf nchri', 'wach ymkan nchri', 
    'bghit n3ti command', 'bghit ncommandi', 'fin ymkan nchri',
    'ch7al taman', 'wach 3andkom', 'kayf n3ti les coordonnées',
    'bghit nkhlase', 'ready nchri', 'ndir commande', 'nsift flous',
    'kayn stock', 'available wlla la', 'nakhod', 'ncommandi'
  ];
  
  return buyingKeywords.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );
}

// Function to find relevant products based on user query
function findRelevantProducts(message: string) {
  const messageLower = message.toLowerCase();
  
  // Check if asking for "all products" or "kol chi" or similar
  const askingForAll = [
    'kol chi', 'ga3 les produits', 'kol les produits', 'ga3 chi',
    'all products', 'tout les produits', 'kollchi', 'ga3ma 3andkom',
    'ga3 li 3andkom', 'ch7al mn produit 3andkom' , 'kolchi li 3andkom' , 'bghit nshoof kolchi' , 'ta9adar twarini kolchi' , 'chno li 3andkom' , 'bghit nchouf kol wa7ad'
  ].some(phrase => messageLower.includes(phrase));
  
  if (askingForAll) {
    return products.products; // Return all products
  }
  
  // Check if asking for all products of a specific category
  const categoryRequests = [
    { keywords: ['kol les phones', 'ga3 les téléphones', 'ga3 les phones', 'kol les iPhone', 'ga3 les iphones', 'les iphone li 3andkom', 'les iphones li 3andkom', 'chno homa les iphone'], category: 'phone' },
    { keywords: ['kol les airpods', 'ga3 les écouteurs', 'ga3 les earbuds', 'les airpods li 3andkom', 'chno homa les airpods'], category: 'earbuds' },
    { keywords: ['kol les chargeurs', 'ga3 les chargers', 'ga3 les chargeurs', 'les chargeurs li 3andkom', 'chno homa les chargeurs'], category: 'charger' }
  ];
  
  for (const categoryReq of categoryRequests) {
    if (categoryReq.keywords.some(keyword => messageLower.includes(keyword))) {
      return products.products.filter(product => product.category === categoryReq.category);
    }
  }
  
  // Look for SPECIFIC product by exact name match FIRST
  const exactMatch = products.products.find(product => 
    messageLower.includes(product.name.toLowerCase())
  );
  
  if (exactMatch) {
    return [exactMatch]; // Return only the exact match
  }
  
  // Look for specific product by exact keyword match
  const keywordMatch = products.products.find(product => 
    product.keywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      // For exact matches like "iphone 12", "airpods pro", etc.
      return messageLower.includes(keywordLower) && keywordLower.length > 4;
    })
  );
  
  if (keywordMatch) {
    return [keywordMatch]; // Return only the specific product
  }
  
  // If asking about a category in general (without "all" or "kol"), return all products of that category
  const categories = ['phone', 'earbuds', 'charger'];
  for (const category of categories) {
    if (messageLower.includes(category) || 
        (category === 'phone' && (messageLower.includes('téléphone') || messageLower.includes('telephone'))) ||
        (category === 'earbuds' && (messageLower.includes('écouteur') || messageLower.includes('airpods'))) ||
        (category === 'charger' && (messageLower.includes('chargeur') || messageLower.includes('charger')))) {
      return products.products.filter(product => product.category === category);
    }
  }
  
  // If no match found, return empty array
  return [];
}

// Function to generate error fallback message in Darija
function generateErrorFallback(): string {
  return `Smah liya, daba kayn mochkil f système. Ta9dar twasal m3ana f had numéro: ${products.store.phone}, ola b email: ${products.store.email}. L magasin kaykhdem mn: ${products.store.hours}.`;
}

export async function POST(req: Request) {
  try {
    const { message, clientId } = await req.json();
    
    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }
    
    // Initialize conversation if first time
    if (!conversations[clientId]) conversations[clientId] = [];
    
    // System prompt with product catalog
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

Example conversation style:
Customer: "bghit na3raf ch7al taman dial AirPods Pro"
Assistant: "AirPods Pro 2 kayn b 2490 MAD, kayn 20 units f stock. Wach bghiti n3tik les détails dyal kol wa7ed?"

Store Information:
- Name: ${products.store.name} (${products.store.main_name})
- Locations: Sidi Moumen & Lagroun, Casablanca
- Phone: ${products.store.phone}
- Email: ${products.store.email}
- Hours: ${products.store.hours}

Product Catalog:
${JSON.stringify(products.products)}
`;

    // Check if this is the first message (welcome message)
    const isFirstMessage = conversations[clientId].length === 0;
    
    // Add user message to conversation
    conversations[clientId].push({ role: "user", content: message });
    console.log("Conversation:", conversations[clientId]);
    
    // If first message, return custom welcome response
    if (isFirstMessage) {
      const welcomeResponse = "Ahlan wa sahlan! Marhaba bik f " + products.store.name + "! Ana hna bach n3awnek takhtar afdal produit. Wach bghiti tshoof les produits li 3andna ola 3andek chi soual m3ayyan? 😊";
      
      // Save welcome response in conversation
      conversations[clientId].push({ role: "assistant", content: welcomeResponse });
      
      return NextResponse.json({ 
        reply: welcomeResponse,
        showForm: false,
        products: null
      });
    }
    
    // Detect buying intent
    const showForm = detectBuyingIntent(message);
    
    // Find relevant products for the query
    const relevantProducts = findRelevantProducts(message);
    
    // Check if OpenRouter API key exists
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OpenRouter API key is missing");
      return NextResponse.json({ 
        reply: generateErrorFallback(),
        showForm: false,
        products: relevantProducts.length > 0 ? relevantProducts : null
      });
    }
    
    // Send conversation + system prompt to AI
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
    
    // Check if response is ok - handle rate limits and other errors
    if (!response.ok) {
      console.error("OpenRouter API error:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      
      // Check for rate limit specifically (429) or other API errors
      if (response.status === 429) {
        console.error("Rate limit reached");
      }
      
      return NextResponse.json({ 
        reply: generateErrorFallback(),
        showForm: showForm,
        products: relevantProducts.length > 0 ? relevantProducts : null
      });
    }
    
    const data = await response.json();
    console.log("Full API Response:", JSON.stringify(data, null, 2));
    
    // Check if the response has the expected structure
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error("Invalid API response structure:", data);
      
      return NextResponse.json({ 
        reply: generateErrorFallback(),
        showForm: showForm,
        products: relevantProducts.length > 0 ? relevantProducts : null
      });
    }
    
    const reply = data.choices[0]?.message?.content;
    
    if (!reply) {
      console.error("No content in API response:", data.choices[0]);
      
      return NextResponse.json({ 
        reply: generateErrorFallback(),
        showForm: showForm,
        products: relevantProducts.length > 0 ? relevantProducts : null
      });
    }
    
    console.log("AI Reply:", reply);
    
    // Save AI reply in conversation
    conversations[clientId].push({ role: "assistant", content: reply });
    
    // Return response with flags and product data
    return NextResponse.json({ 
      reply,
      showForm: showForm,
      products: relevantProducts.length > 0 ? relevantProducts : null
    });
    
  } catch (error) {
    console.error("Error in POST handler:", error);
    
    return NextResponse.json({ 
      reply: generateErrorFallback(),
      showForm: false,
      products: null
    }, { status: 500 });
  }
}