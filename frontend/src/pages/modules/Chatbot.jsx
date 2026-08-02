import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Send, 
  Bot, 
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import './Chatbot.css';

const Chatbot = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: t('chat.welcomeMsg') }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Update initial message when language changes if only 1 message exists
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([{ role: 'assistant', content: t('chat.welcomeMsg') }]);
    }
  }, [t]);

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
      setMessages(prev => [...prev, { role: 'assistant', content: res.response || t('common.offline') }]);
    } catch (err) {
      console.error('Failed to communicate with chat service', err);
      setMessages(prev => [...prev, { role: 'assistant', content: t('common.offline') }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (promptText) => {
    handleSendMessage(promptText);
  };

  const prompts = t('chat.prompts') || [];

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
          {prompts.map((pText, idx) => (
            <button 
              key={idx} 
              className="btn-quick-prompt"
              onClick={() => handleQuickPrompt(pText)}
              disabled={loading}
            >
              <Sparkles size={14} />
              <span>{pText}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="chatbot-input-bar">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder={t('chat.placeholder')}
            disabled={loading}
          />
          <button type="submit" className="btn-send" disabled={loading || !input.trim()}>
            <Send size={18} />
          </button>
        </form>
        
        <div className="chatbot-disclaimer-bar">
          <p>{t('chat.disclaimer')}</p>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
