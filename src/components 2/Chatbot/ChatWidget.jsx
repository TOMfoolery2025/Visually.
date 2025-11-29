import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Cpu, Zap, Settings } from 'lucide-react';

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: "Hi! I'm your Cache Assistant. Ask me about hits, misses, or AMAT!" }
    ]);
    const [input, setInput] = useState("");
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || "");
    const [showSettings, setShowSettings] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSaveKey = () => {
        localStorage.setItem('gemini_api_key', apiKey);
        setShowSettings(false);
        setMessages(prev => [...prev, { role: 'bot', text: "API Key saved! I'm ready to chat." }]);
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            let botText = "";
            if (!apiKey) {
                // Fallback Local Logic
                botText = getLocalResponse(input);
            } else {
                // Gemini API Call
                botText = await callGemini(input, apiKey);
            }
            setMessages(prev => [...prev, { role: 'bot', text: botText }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I encountered an error. Please check your API key." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-5 right-5 w-14 h-14 rounded-full bg-[color:var(--accent-color)] text-white shadow-lg flex items-center justify-center z-50 transition-transform hover:scale-110 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
            >
                <MessageCircle size={28} />
            </button>

            {/* Chat Window */}
            <div className={`fixed bottom-5 right-5 w-[350px] h-[500px] bg-[color:var(--surface-1)] border border-[color:var(--glass-border)] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-90 opacity-0 pointer-events-none translate-y-10'}`}>

                {/* Header */}
                <div className="bg-[color:var(--accent-color)] p-4 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Cpu size={20} />
                        <span className="font-semibold">Cache Assistant</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowSettings(!showSettings)} className="p-1 hover:bg-white/20 rounded">
                            <Settings size={18} />
                        </button>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="p-4 bg-black/10 border-b border-[color:var(--glass-border)]">
                        <label className="text-xs text-[color:var(--text-secondary)] block mb-1">Gemini API Key</label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="flex-1 px-2 py-1 rounded text-sm bg-white/10 border border-white/20"
                                placeholder="Enter key..."
                            />
                            <button onClick={handleSaveKey} className="text-xs bg-[color:var(--accent-color)] text-white px-2 rounded">Save</button>
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[color:var(--surface-2)]">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-[color:var(--accent-color)] text-white rounded-tr-none' : 'bg-[color:var(--surface-strong)] border border-[color:var(--glass-border)] rounded-tl-none'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-[color:var(--surface-strong)] p-3 rounded-xl rounded-tl-none border border-[color:var(--glass-border)] flex gap-1">
                                <span className="w-2 h-2 bg-[color:var(--text-secondary)] rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-[color:var(--text-secondary)] rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-[color:var(--text-secondary)] rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 bg-[color:var(--surface-1)] border-t border-[color:var(--glass-border)] flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask a question..."
                        className="flex-1 bg-[color:var(--card-bg)] border border-[color:var(--glass-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[color:var(--accent-color)]"
                    />
                    <button onClick={sendMessage} className="p-2 bg-[color:var(--accent-color)] text-white rounded-lg hover:bg-[color:var(--accent-hover)]">
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </>
    );
}

// Helper Functions (Simplified)
function getLocalResponse(input) {
    const lower = input.toLowerCase();
    if (lower.includes('hit')) return "A cache hit occurs when the requested data is found in the cache. It's fast!";
    if (lower.includes('miss')) return "A cache miss means the data wasn't found in the cache and had to be fetched from memory.";
    if (lower.includes('amat')) return "AMAT stands for Average Memory Access Time. It's a key metric for cache performance.";
    return "I can help with cache concepts. Try asking about 'hits', 'misses', or 'AMAT'. For advanced answers, please add a Gemini API Key.";
}

async function callGemini(prompt, key) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "You are a Cache Simulator Assistant. Keep answers short. " + prompt }] }] })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
}
