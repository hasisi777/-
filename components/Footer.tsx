import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-slate-400 text-sm mb-1">이 앱은 AI싱크클럽의 지침으로 만들어졌습니다.</p>
            <p className="font-medium">유튜브와 쓰레드 팔로우 부탁드려요!</p>
          </div>
          <div className="flex gap-4 text-sm">
            <a 
              href="https://youtube.com/@aisyncclub" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
              유튜브 (6K)
            </a>
            <a 
              href="https://www.threads.com/@ai_sync_club" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors font-medium flex items-center gap-2"
            >
              <span>@</span> 쓰레드 (3.7K)
            </a>
            <a 
              href="https://litt.ly/aisyncclub" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors font-medium"
            >
              리틀리
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;