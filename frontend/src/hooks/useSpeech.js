import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Map app language code to Speech API BCP-47 locale
const speechLocaleMap = {
  en: 'en-IN',
  hi: 'hi-IN',
  pa: 'pa-IN',
  ur: 'ur-PK'
};

export const useSpeech = () => {
  const { lang, currentLanguageObj } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakingId, setActiveSpeakingId] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [hasMicPermission, setHasMicPermission] = useState(null);
  const [speechError, setSpeechError] = useState(null);
  
  const [autoReadAloud, setAutoReadAloud] = useState(() => {
    return localStorage.getItem('auto_read_aloud') === 'true';
  });

  const recognitionRef = useRef(null);

  // Sync auto-read-aloud setting to localStorage
  useEffect(() => {
    localStorage.setItem('auto_read_aloud', autoReadAloud);
  }, [autoReadAloud]);

  // Check browser support for SpeechRecognition
  const isSTTSupported = typeof window !== 'undefined' && 
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

  // Check browser support for SpeechSynthesis
  const isTTSSupported = typeof window !== 'undefined' && !!window.speechSynthesis;

  // Initialize SpeechRecognition instance
  useEffect(() => {
    if (!isSTTSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = speechLocaleMap[lang] || 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
      setHasMicPermission(true);
    };

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setHasMicPermission(false);
        setSpeechError('permission-denied');
      } else if (event.error === 'no-speech') {
        setSpeechError('no-speech');
      } else {
        setSpeechError(event.error || 'recognition-failed');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, isSTTSupported]);

  // Start Voice Listening
  const startListening = useCallback(() => {
    if (!isSTTSupported) {
      setSpeechError('not-supported');
      return;
    }

    setTranscript('');
    setSpeechError(null);

    try {
      if (recognitionRef.current) {
        recognitionRef.current.lang = speechLocaleMap[lang] || 'en-IN';
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  }, [lang, isSTTSupported]);

  // Stop Voice Listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Failed to stop speech recognition:', err);
      }
    }
    setIsListening(false);
  }, [isListening]);

  // Toggle Voice Listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Text-To-Speech: Speak Text
  const speakText = useCallback((text, messageId = null) => {
    if (!isTTSSupported || !text) return;

    // Cancel existing speech
    window.speechSynthesis.cancel();

    // Clean markdown or HTML formatting from text
    const cleanText = text
      .replace(/[*_~#`]/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const targetLocale = speechLocaleMap[lang] || 'en-IN';
    utterance.lang = targetLocale;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick matching browser voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(lang) || v.lang.replace('_', '-').includes(targetLocale));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setActiveSpeakingId(messageId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveSpeakingId(null);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
      setActiveSpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  }, [lang, isTTSSupported]);

  // Stop Text-To-Speech
  const stopSpeaking = useCallback(() => {
    if (isTTSSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setActiveSpeakingId(null);
  }, [isTTSSupported]);

  // Toggle Auto Read-Aloud
  const toggleAutoReadAloud = useCallback(() => {
    setAutoReadAloud(prev => !prev);
  }, []);

  return {
    isListening,
    isSpeaking,
    activeSpeakingId,
    transcript,
    hasMicPermission,
    speechError,
    autoReadAloud,
    isSTTSupported,
    isTTSSupported,
    startListening,
    stopListening,
    toggleListening,
    speakText,
    stopSpeaking,
    toggleAutoReadAloud,
    setTranscript
  };
};
