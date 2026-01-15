import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import DetailPlanner from './components/DetailPlanner';
import ThumbnailGenerator from './components/ThumbnailGenerator';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'thumbnail' | 'detail'>('detail');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);
  
  // Session key to force re-render (reset) of components
  const [sessionKey, setSessionKey] = useState<number>(0);

  // Manual API Key State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [inputKey, setInputKey] = useState('');

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = () => {
    const localKey = localStorage.getItem('gemini_api_key');
    // Safe access to process.env
    const envKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';

    if (localKey || envKey) {
       setHasApiKey(true);
    } else {
       setHasApiKey(false);
    }
    setCheckingKey(false);
  };

  const handleSaveKey = () => {
    if (!inputKey.trim()) {
        alert("API Key를 입력해주세요.");
        return;
    }
    localStorage.setItem('gemini_api_key', inputKey.trim());
    setHasApiKey(true);
    setShowKeyModal(false);
    setInputKey('');
  };

  const handleOpenKeyModal = () => {
      const current = localStorage.getItem('gemini_api_key') || '';
      setInputKey(current);
      setShowKeyModal(true);
  };

  const handleLogoClick = () => {
    // Switch to default tab and increment key to reset state
    setCurrentTab('detail');
    setSessionKey(prev => prev + 1);
  };

  const ApiKeyModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
            <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">API Key 설정</h3>
                <p className="text-sm text-slate-500 mt-1">Google AI Studio에서 발급받은 키를 입력하세요.</p>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                <input 
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>

            <div className="flex gap-3">
                {hasApiKey && (
                    <button 
                        onClick={() => setShowKeyModal(false)}
                        className="flex-1 py-3 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                    >
                        취소
                    </button>
                )}
                <button 
                    onClick={handleSaveKey}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all hover:scale-[1.02]"
                >
                    저장하기
                </button>
            </div>
            
             <p className="text-xs text-center text-slate-400">
                키는 브라우저(LocalStorage)에만 저장됩니다.
            </p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans relative">
      <Header 
        currentTab={currentTab} 
        onTabChange={setCurrentTab} 
        onChangeKey={handleOpenKeyModal}
        onLogoClick={handleLogoClick}
      />
      
      {showKeyModal && <ApiKeyModal />}

      <main className="flex-grow">
        {checkingKey ? (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        ) : !hasApiKey ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">API Key가 필요합니다</h1>
                    <p className="text-slate-600">
                        AI싱크클럽 빌더를 사용하기 위해서는<br/>Google Gemini API Key가 필요합니다.
                    </p>
                    
                    <div className="space-y-4 pt-2">
                        <input 
                            type="password"
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            placeholder="여기에 API Key 입력"
                            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                            onClick={handleSaveKey}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg"
                        >
                            시작하기
                        </button>
                    </div>

                    <p className="text-xs text-slate-400 mt-4">
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-blue-500">
                        API Key 발급받기 (Google AI Studio)
                        </a>
                    </p>
                </div>
            </div>
        ) : (
            currentTab === 'detail' 
            ? <DetailPlanner key={`detail-${sessionKey}`} /> 
            : <ThumbnailGenerator key={`thumb-${sessionKey}`} />
        )}
      </main>
    </div>
  );
};

export default App;