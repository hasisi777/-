import React from 'react';

interface HeaderProps {
  currentTab: 'thumbnail' | 'detail';
  onTabChange: (tab: 'thumbnail' | 'detail') => void;
  onChangeKey: () => void;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange, onChangeKey, onLogoClick }) => {
  // Safe environment check
  const hasEnvKey = typeof process !== 'undefined' && process.env && process.env.API_KEY;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button 
              onClick={onLogoClick}
              className="flex-shrink-0 flex items-center gap-2 hover:opacity-70 transition-opacity focus:outline-none"
              title="초기 화면으로 이동"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight hidden md:block">상세페이지 제작</span>
            </button>
            <nav className="ml-4 md:ml-10 flex space-x-4 md:space-x-8">
              <button
                onClick={() => onTabChange('thumbnail')}
                className={`${
                  currentTab === 'thumbnail'
                    ? 'border-blue-500 text-slate-900'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16 transition-colors`}
              >
                썸네일 제작
              </button>
              <button
                onClick={() => onTabChange('detail')}
                className={`${
                  currentTab === 'detail'
                    ? 'border-blue-500 text-slate-900'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16 transition-colors`}
              >
                상세페이지 제작
              </button>
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={onChangeKey}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors group border border-transparent hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="API Key 변경"
              >
                <div className={`w-2 h-2 rounded-full ${hasEnvKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">
                  {hasEnvKey ? 'API Key 변경' : 'API Key 설정'}
                </span>
                <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile nav */}
      <div className="md:hidden border-t border-slate-100 flex">
        <button
          onClick={() => onTabChange('thumbnail')}
          className={`flex-1 py-3 text-center text-sm font-medium ${
            currentTab === 'thumbnail' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'
          }`}
        >
          썸네일
        </button>
        <button
          onClick={() => onTabChange('detail')}
          className={`flex-1 py-3 text-center text-sm font-medium ${
            currentTab === 'detail' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'
          }`}
        >
          상세페이지
        </button>
      </div>
    </header>
  );
};

export default Header;