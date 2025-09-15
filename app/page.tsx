'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Send, Smartphone, Watch, Headphones, Zap, MessageCircle, X, User, Mail, Phone, MapPin } from 'lucide-react';
import Image from 'next/image';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
  description: string;
  image: string;
  keywords: string[];
}
type OrderFormData = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  store: string;
};

interface ApiResponse {
  reply: string;
  showForm: boolean;
  products: Product[] | null;
}

// Mock function for client ID - replace with your actual implementation
const getClientId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize client ID on mount
  useEffect(() => {
    const id = getClientId();
    setClientId(id);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const sendMessage = async () => {
    if (!inputValue.trim() || !clientId || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai_chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          clientId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data: ApiResponse = await response.json();
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle form display
      if (data.showForm) {
        setShowOrderForm(true);
      }

      // Handle products display
      if (data.products && data.products.length > 0) {
        setDisplayedProducts(data.products);
      } else {
        setDisplayedProducts([]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

const handleOrderSubmit = (formData: OrderFormData) => {
  console.log("Order submitted:", formData);
  setShowOrderForm(false);
};



  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-hidden transform animate-scale-in">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Product Details</h2>
                  <p className="text-blue-100 text-sm">Complete specifications</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Product Image */}
              <div className="text-center">
                <div className="relative inline-block">
                  <Image
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    width={192}
                    height={192}
                    className="w-48 h-48 mx-auto rounded-2xl object-cover shadow-xl ring-4 ring-blue-100"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiBmaWxsPSIjRjFGNUY5Ii8+CjxwYXRoIGQ9Ik02MCA2MEgxMzJWMTMySDYwVjYwWiIgZmlsbD0iI0UyRThGMCIvPgo8cGF0aCBkPSJNODQgOTZMOTYgODRMMTA4IDk2TDEyMCA4NEwxMzIgOTZWMTMySDYwVjk2TDcyIDEwOEw4NCA5NloiIGZpbGw9IiNDQkQ1RTEiLz4KPHN2Zz4K';
                    }}
                  />
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    In Stock
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-4">
                <div className="text-center border-b border-slate-200 pb-4">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">{selectedProduct.name}</h3>
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {selectedProduct.price} {selectedProduct.currency}
                    </span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedProduct.category}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2 text-blue-600" />
                    Description
                  </h4>
                  <p className="text-slate-600 leading-relaxed">{selectedProduct.description}</p>
                </div>

                {/* Stock & Keywords */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-green-600" />
                      Availability
                    </h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-700 font-medium">{selectedProduct.stock} units available</span>
                    </div>
                  </div>

                  {selectedProduct.keywords.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                        <Smartphone className="w-4 h-4 mr-2 text-blue-600" />
                        Features & Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="bg-white text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200 shadow-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowOrderForm(true)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-105"
                >
                  Order Now
                </button>
                <button
                  onClick={() => {
                    const message = `I'm interested in ${selectedProduct.name}. Can you tell me more?`;
                    setInputValue(message);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-3 px-6 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  Ask About It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl p-6 border-b border-slate-200/50 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Order Information
                </h2>
                <button
                  onClick={() => setShowOrderForm(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
            
              <form
  className="p-6 space-y-4"
  onSubmit={(e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as unknown as OrderFormData;
    handleOrderSubmit(data);
  }}
>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-600" />
                    Full Name / الاسم الكامل
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-blue-600" />
                    Phone Number / رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-blue-600" />
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                    Address / العنوان
                  </label>
                  <textarea
                    name="address"
                    required
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 resize-none"
                    placeholder="Enter your delivery address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Preferred Store Location
                  </label>
                  <select
                    name="store"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                  >
                    <option value="">Select store location</option>
                    <option value="Sidi Moumen">Sidi Moumen</option>
                    <option value="Lagroun">Lagroun</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
              >
                Submit Order
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modern Header with Gradient */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 px-4 py-4 shadow-lg shadow-blue-500/5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                LBatal
              </h1>
              <p className="text-sm text-slate-600">Your premium tech companion</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-slate-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium">Online</span>
          </div>
        </div>
      </header>

      {/* Messages Container with Enhanced Styling */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl shadow-blue-500/10 border border-white/20 max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Welcome to LBatal! مرحبا!</h2>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Your premium destination for the latest tech. Ask me about phones, watches, AirPods, and accessories!
                </p>
                
                {/* Quick Action Cards */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <div className="bg-blue-50 rounded-xl p-3 hover:bg-blue-100 transition-colors cursor-pointer">
                    <Smartphone className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <span className="text-xs font-medium text-blue-700">Phones</span>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-3 hover:bg-indigo-100 transition-colors cursor-pointer">
                    <Watch className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
                    <span className="text-xs font-medium text-indigo-700">Watches</span>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 hover:bg-purple-100 transition-colors cursor-pointer">
                    <Headphones className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                    <span className="text-xs font-medium text-purple-700">Audio</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animation: 'fadeInUp 0.3s ease-out forwards'
                }}
              >
                <div className={`flex items-start space-x-3 max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30' 
                      : 'bg-gradient-to-r from-slate-600 to-slate-700 shadow-lg shadow-slate-500/30'
                  }`}>
                    {message.role === 'user' ? (
                      <span className="text-white text-xs font-bold">U</span>
                    ) : (
                      <MessageCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  
                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm relative ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/20'
                        : 'bg-white/80 text-slate-800 border border-white/20 shadow-slate-500/10'
                    }`}
                  >
                    <p className="text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                    
                    {/* Message Tail */}
                    <div className={`absolute top-4 ${
                      message.role === 'user' 
                        ? 'right-[-6px] border-l-[6px] border-l-blue-600 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent' 
                        : 'left-[-6px] border-r-[6px] border-r-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent'
                    }`}></div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Products Display */}
          {displayedProducts.length > 0 && (
            <div className="animate-fade-in-up">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-blue-500/10 border border-white/20">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <Smartphone className="w-5 h-5 mr-2 text-blue-600" />
                  {displayedProducts.length === 1 ? 'Product Details' : `Products (${displayedProducts.length})`}
                </h3>
                <div className={`grid gap-4 ${displayedProducts.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                  {displayedProducts.map((product) => (
                    <div 
                      key={product.id} 
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 hover:border-blue-200"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-lg object-cover shadow-md"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjFGNUY5Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIGZpbGw9IiNFMkU4RjAiLz4KPHBhdGggZD0iTTI4IDMwTDMyIDI2TDM2IDMwTDQwIDI2TDQ0IDMwVjQ0SDIwVjMwTDI0IDM0TDI4IDMwWiIgZmlsbD0iI0NCRDVFMSIvPgo8L3N2Zz4K';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-800 truncate">{product.name}</h4>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-bold text-blue-600">{product.price} {product.currency}</span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                {product.stock} in stock
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Loading indicator */}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-600 to-slate-700 shadow-lg shadow-slate-500/30 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/80 backdrop-blur-sm text-slate-800 border border-white/20 rounded-2xl px-4 py-3 shadow-lg shadow-slate-500/10 max-w-xs">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-sm text-slate-600 font-medium">LBatal is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Input Area */}
      <div className="bg-white/60 backdrop-blur-xl border-t border-white/20 px-4 py-4 shadow-2xl shadow-blue-500/10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg shadow-slate-500/10 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about phones, watches, accessories... اسأل عن الهواتف والساعات..."
                  className="w-full px-5 py-4 bg-transparent resize-none focus:outline-none text-sm sm:text-base max-h-32 min-h-[56px] placeholder-slate-400 text-slate-700 rounded-2xl"
                  rows={1}
                  disabled={isLoading}
                />
                <div className="absolute right-3 bottom-3 text-slate-400">
                  <div className="w-1 h-4 bg-slate-300 animate-pulse rounded-full"></div>
                </div>
              </div>
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white p-4 rounded-2xl font-medium text-sm sm:text-base transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3 px-2">
            <p className="text-xs text-slate-500">
              Press <kbd className="px-2 py-1 bg-slate-200 rounded text-xs">Enter</kbd> to send • <kbd className="px-2 py-1 bg-slate-200 rounded text-xs">Shift+Enter</kbd> for new line
            </p>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Secure & Private</span>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.3s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fadeInUp 0.3s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .animate-scale-in {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}