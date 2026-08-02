import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useSpeech } from '../../hooks/useSpeech';
import { 
  Send, 
  Bot, 
  User as UserIcon,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertCircle,
  Square
} from 'lucide-react';
import './Chatbot.css';

const Chatbot = () => {
  const { t, currentLanguageObj } = useLanguage();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: t('chat.welcomeMsg') }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const {
    isListening,
    isSpeaking,
    activeSpeakingId,
    transcript,
    speechError,
    autoReadAloud,
    isSTTSupported,
    toggleListening,
    stopListening,
    speakText,
    stopSpeaking,
    toggleAutoReadAloud
  } = useSpeech();

  // Populate input when speech transcript updates
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

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
  }, [messages, loading, isListening]);

  const handleSendMessage = async (text) => {
    const msgText = text || input;
    if (!msgText.trim()) return;

    if (isListening) {
      stopListening();
    }

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

      const replyContent = res.response || t('common.offline');

      // Add assistant response
      setMessages(prev => [...prev, { role: 'assistant', content: replyContent }]);

      // Trigger Auto Read-Aloud if enabled
      if (autoReadAloud) {
        setTimeout(() => {
          speakText(replyContent, newMessages.length);
        }, 300);
      }
    } catch (err) {
      console.error('Failed to communicate with chat service', err);
      const offlineMsg = t('common.offline');
      setMessages(prev => [...prev, { role: 'assistant', content: offlineMsg }]);
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
          
          <div className="header-controls">
            <button 
              className={`btn-auto-read ${autoReadAloud ? 'active' : ''}`}
              onClick={toggleAutoReadAloud}
              title={t('chat.autoRead')}
            >
              {autoReadAloud ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span>{t('chat.autoRead')}</span>
            </button>
            
            <span className="chatbot-motto">
              <Sparkles size={14} /> Ollama Hybrid Engine
            </span>
          </div>
        </div>

        {/* Message Panel */}
        <div className="chat-messages-container">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const isMsgSpeaking = isSpeaking && activeSpeakingId === idx;

            return (
              <div key={idx} className={`chat-message-row ${isUser ? 'user' : 'assistant'}`}>
                <div className={`chat-avatar ${isUser ? 'user' : 'assistant'}`}>
                  {isUser ? <UserIcon size={14} /> : <Bot size={14} />}
                </div>
                
                <div className={`chat-bubble ${isUser ? 'user' : 'assistant'}`}>
                  <p>{msg.content}</p>
                  
                  {!isUser && (
                    <button 
                      className={`btn-speak-bubble ${isMsgSpeaking ? 'speaking' : ''}`}
                      onClick={() => isMsgSpeaking ? stopSpeaking() : speakText(msg.content, idx)}
                      title={isMsgSpeaking ? t('chat.stopSpeaking') : t('chat.speakMessage')}
                    >
                      {isMsgSpeaking ? <Square size={12} /> : <Volume2 size={14} />}
                    </button>
                  )}
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

        {/* Voice Listening / Error Banner Status */}
        {isListening && (
          <div className="voice-status-banner listening">
            <span className="pulsing-red-dot"></span>
            <span>{t('chat.micListen', { lang: currentLanguageObj.label })}</span>
          </div>
        )}

        {speechError && (
          <div className="voice-status-banner error">
            <AlertCircle size={14} />
            <span>
              {speechError === 'permission-denied' ? t('chat.micBlocked') : t('chat.voiceError')}
            </span>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="chatbot-input-bar">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder={t('chat.placeholder')}
            disabled={loading}
          />

          {isSTTSupported && (
            <button 
              type="button" 
              className={`btn-mic ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}

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
