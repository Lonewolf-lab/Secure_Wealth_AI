import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Send, 
  Bot, 
  User as UserIcon,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  Calculator
} from 'lucide-react';
import './Chatbot.css';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your Punjab & Sind Bank AI Wealth Assistant. Ask me anything about tax saving, portfolio rebalancing, goals compounding, or transaction security.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text) => {
    const msgText = text || input;
    if (!msgText.trim()) return;

    // Add user message to state
    const newMessages = [...messages, { role: 'user', content: msgText }];
    setMessages(newMessages);
    if (!text) setInput('');
    setLoading(true);

    try {
      // Map history format: API expects role and content
      const history = newMessages.slice(1, -1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.post('/api/chat/message', {
        message: msgText,
        conversationHistory: history
      });

      // Add assistant response
      setMessages(prev => [...prev, { role: 'assistant', content: res.response || "I'm sorry, I encountered an issue compiling the response." }]);
    } catch (err) {
      console.error('Failed to communicate with chat service', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection offline. Verify if the local AI service is online.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    handleSendMessage(prompt);
  };

  const quickPrompts = [
    { text: 'How do I save tax under Section 80C?', icon: <Calculator size={14} /> },
    { text: 'Is my transaction history secure?', icon: <ShieldCheck size={14} /> },
    { text: 'How is my Wealth Score calculated?', icon: <Sparkles size={14} /> },
    { text: 'Explain Mean-Variance optimization.', icon: <TrendingUp size={14} /> }
  ];

  return (
    <div className="chatbot-content-wrapper">
      
      <div className="chatbot-main-card">
        {/* Header */}
        <div className="chatbot-header">
          <div className="bot-info-row">
            <div className="bot-avatar-glowing">
              <Bot size={20} />
              <span className="online-indicator"></span>
            </div>
            <div>
              <h3>SecureWealth AI Assistant</h3>
              <p>Punjab & Sind Bank Local Advisor</p>
            </div>
          </div>
          <span className="chatbot-motto"><Sparkles size={14} /> Ollama Hybrid Engine</span>
        </div>

        {/* Message Panel */}
        <div className="chat-messages-container">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={`chat-message-row ${isUser ? 'user' : 'assistant'}`}>
                <div className={`chat-avatar ${isUser ? 'user' : 'assistant'}`}>
                  {isUser ? <UserIcon size={14} /> : <Bot size={14} />}
                </div>
                
                <div className={`chat-bubble ${isUser ? 'user' : 'assistant'}`}>
                  <p>{msg.content}</p>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="chat-message-row assistant">
              <div className="chat-avatar assistant">
                <Bot size={14} />
              </div>
              <div className="chat-bubble assistant typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Prompts */}
        <div className="quick-prompts-bar">
          {quickPrompts.map((qp, idx) => (
            <button 
              key={idx} 
              className="btn-quick-prompt"
              onClick={() => handleQuickPrompt(qp.text)}
              disabled={loading}
            >
              {qp.icon}
              <span>{qp.text}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
          className="chatbot-input-bar"
        >
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Type your wealth advisory query..." 
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary btn-send" disabled={loading || !input.trim()}>
            <Send size={16} />
          </button>
        </form>

      </div>

    </div>
  );
};

export default Chatbot;
