import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User as UserIcon,
  Sparkles,
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (text) => {
    const msgText = text || input;
    if (!msgText.trim()) return;

    const newMessages = [...messages, { role: 'user', content: msgText }];
    setMessages(newMessages);
    if (!text) setInput('');
    setLoading(true);

    try {
      const history = newMessages.slice(1, -1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.post('/api/chat/message', {
        message: msgText,
        conversationHistory: history
      });

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
    <motion.div 
      className="chatbot-content-wrapper"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      
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
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <motion.div 
                  key={idx} 
                  className={`chat-message-row ${isUser ? 'user' : 'assistant'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className={`chat-avatar ${isUser ? 'user' : 'assistant'}`}>
                    {isUser ? <UserIcon size={14} /> : <Bot size={14} />}
                  </div>
                  
                  <div className={`chat-bubble ${isUser ? 'user' : 'assistant'}`}>
                    <p>{msg.content}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {loading && (
            <motion.div 
              className="chat-message-row assistant"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="chat-avatar assistant">
                <Bot size={14} />
              </div>
              <div className="chat-bubble assistant typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </motion.div>
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

    </motion.div>
  );
};

export default Chatbot;
