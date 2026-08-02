import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { Send, Mic, Sparkles, BrainCircuit, User } from 'lucide-react';

const MobileChat = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: t('chat.welcomeMsg')
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const quickPrompts = t('chat.prompts') || [
    "How to minimize tax under 80C?",
    "Why was my last transaction flagged?",
    "Show my 10-year wealth projection",
    "Compare FD vs Mutual Fund returns"
  ];

  const handleSend = (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      let replyText = "Based on your current portfolio and WPRS security evaluation, maintaining a balanced 60/40 Equity to Fixed Income ratio ensures optimal capital growth with minimal risk.";
      
      if (query.toLowerCase().includes('tax') || query.toLowerCase().includes('80c')) {
        replyText = "You have ₹45,000 unutilized headroom in Section 80C. Investing in PSB ELSS Tax Saver will save you ₹14,040 in tax while earning ~14% returns!";
      } else if (query.toLowerCase().includes('flag') || query.toLowerCase().includes('security') || query.toLowerCase().includes('wprs')) {
        replyText = "Your WPRS rating is currently 12 (SAFE). Transactions over ₹1,00,000 from unrecognized locations automatically require biometric Step-Up OTP verification.";
      } else if (query.toLowerCase().includes('projection')) {
        replyText = "With your current ₹15,000/month SIP contribution, your expected net worth in 10 years (P50 model) is ₹34.8 Lakhs.";
      }

      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: replyText }]);
      setIsTyping(false);
    }, 1000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="mobile-page-content mobile-chat-container">
      {/* Messages Scroll Area */}
      <div className="chat-messages-area">
        {messages.map((msg) => (
          <motion.div 
            key={msg.id}
            className={`chat-bubble-row ${msg.sender}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {msg.sender === 'bot' && (
              <div className="bot-avatar-icon">
                <BrainCircuit size={16} />
              </div>
            )}
            <div className="chat-bubble">
              <p>{msg.text}</p>
            </div>
            {msg.sender === 'user' && (
              <div className="user-avatar-icon">
                <User size={16} />
              </div>
            )}
          </motion.div>
        ))}

        {isTyping && (
          <div className="chat-bubble-row bot">
            <div className="bot-avatar-icon">
              <BrainCircuit size={16} />
            </div>
            <div className="chat-bubble typing">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="quick-prompts-scroll">
        {Array.isArray(quickPrompts) && quickPrompts.map((prompt, idx) => (
          <button key={idx} className="prompt-pill" onClick={() => handleSend(prompt)}>
            <Sparkles size={12} /> {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="chat-input-bar">
        <input 
          type="text"
          placeholder={t('chat.placeholder')}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="chat-mic-btn">
          <Mic size={18} />
        </button>
        <button className="chat-send-btn" onClick={() => handleSend()}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default MobileChat;
