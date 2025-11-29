import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Settings } from 'lucide-react';

export function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi! I'm your Cache Assistant. Ask me about cache theory, the simulator, or RISC-V assembly!", sender: 'bot' }
    ]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput("");

        // Simple heuristic response logic (or AI if key present)
        setTimeout(() => {
            const responseText = getBotResponse(input);
            const botMsg = { id: Date.now() + 1, text: responseText, sender: 'bot' };
            setMessages(prev => [...prev, botMsg]);
        }, 600);
    };

    const getBotResponse = (query) => {
        if (apiKey) {
            return "I have your API key! (AI integration coming soon). For now: " + getHeuristicResponse(query);
        }
        return getHeuristicResponse(query);
    };

    const getHeuristicResponse = (query) => {
        const q = query.toLowerCase();
        if (q.includes('hit') || q.includes('miss')) {
            return "A **Hit** occurs when data is found in the cache. A **Miss** means the data wasn't found, so we have to fetch it from a lower level (L2 or RAM).";
        }
        if (q.includes('associativ')) {
            return "**Associativity** determines how many places a block can go. Direct Mapped = 1 place. Fully Associative = Any place. N-way = N places.";
        }
        if (q.includes('write back') || q.includes('write through')) {
            return "**Write-Through**: Updates RAM immediately. **Write-Back**: Updates RAM only when the dirty block is evicted.";
        }
        if (q.includes('risc') || q.includes('assembly')) {
            return "I support basic RISC-V instructions like `LW`, `SW`, `ADD`, `ADDI`. Try typing: `ADDI x1, x0, 5` then `SW x1, 0x100(x0)`.";
        }
        if (q.includes('play') || q.includes('run')) {
            return "Use the **Play** button to auto-step through the trace. **Run All** executes everything instantly.";
        }
        return "I'm still learning! Try asking about 'cache hits', 'associativity', or 'RISC-V commands'.";
    };

    return (
        <div className="chatbot-container" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        background: 'var(--accent-color)', color: 'white', border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <MessageCircle size={32} />
                </button>
            )}

            {isOpen && (
                <div className="chat-window glass-panel" style={{
                    width: '350px', height: '500px', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)', borderRadius: '16px', overflow: 'hidden',
                    background: 'var(--card-bg)', border: '1px solid var(--glass-border)'
                }}>
                    <div className="chat-header" style={{
                        padding: '15px', background: 'rgba(0,0,0,0.2)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderBottom: '1px solid var(--glass-border)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Bot size={24} color="var(--accent-color)" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Cache Assistant</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <Settings size={20} />
                            </button>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {showSettings ? (
                        <div className="chat-settings" style={{ padding: '20px', flex: 1 }}>
                            <h4>Settings</h4>
                            <div style={{ marginTop: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Gemini API Key</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter API Key..."
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                    Key is stored locally for this session.
                                </p>
                            </div>
                            <button onClick={() => setShowSettings(false)} style={{ marginTop: '20px', padding: '8px 16px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                Save & Back
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="chat-messages" style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {messages.map(msg => (
                                    <div key={msg.id} style={{
                                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                        maxWidth: '80%',
                                        padding: '10px 14px',
                                        borderRadius: '12px',
                                        background: msg.sender === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                                        color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.4'
                                    }}>
                                        {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="chat-input" style={{ padding: '15px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask a question..."
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)',
                                        background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', outline: 'none'
                                    }}
                                />
                                <button onClick={handleSend} style={{
                                    background: 'var(--accent-color)', border: 'none', borderRadius: '8px',
                                    width: '40px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Send size={18} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
