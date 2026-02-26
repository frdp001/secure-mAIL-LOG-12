
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { isBotLikely, obfuscateText } from '../SecurityUtils';
import { useTranslation } from './LanguageProvider';

interface SecurityContextType {
  isVerified: boolean;
  score: number;
  reportViolation: (type: string) => void;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) throw new Error('useSecurity must be used within SecurityProvider');
  return context;
};

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBot, setIsBot] = useState(false);
  const [violation, setViolation] = useState<string | null>(null);
  const { t } = useTranslation();
  const mouseMoved = useRef(false);

  useEffect(() => {
    if (isBotLikely()) {
      setIsBot(true);
      setViolation('Automated environment detected');
    }

    const handleMouse = () => { mouseMoved.current = true; };
    window.addEventListener('mousemove', handleMouse, { once: true });

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && Array.from(mutation.removedNodes).some(n => (n as HTMLElement).id === 'root')) {
          setViolation('DOM Integrity Violation');
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', handleMouse);
      observer.disconnect();
    };
  }, []);

  const reportViolation = (type: string) => {
    console.error('Security Violation:', type);
    setViolation(type);
  };

  if (violation || isBot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 max-w-md">
          <div className="text-blue-500 text-6xl mb-6">⚙️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">System Maintenance</h1>
          <p className="text-gray-600 mb-8">
            We are currently performing scheduled maintenance to improve our secure login environment. 
            Please check back in a few minutes.
          </p>
          <div className="text-xs text-gray-400 font-mono">
            Error Code: ERR_SYS_MAINT_0x{Math.floor(Math.random() * 1000000).toString(16).toUpperCase()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <SecurityContext.Provider value={{ isVerified: !isBot, score: 1, reportViolation }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const ObfuscatedText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const parts = obfuscateText(text);
  
  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (typeof part === 'string') {
          return <span key={idx}>{part}</span>;
        } else {
          return (
            <span key={idx} className="sr-only" aria-hidden="true">
              {part.noise}
            </span>
          );
        }
      })}
    </span>
  );
};
