import type React from 'react';

interface TabNavigationProps {
  activeTab: 'magazines' | 'articles';
  setActiveTab: (tab: 'magazines' | 'articles') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className='flex space-x-4 mb-8'>
      <button
        onClick={() => setActiveTab('magazines')}
        className={`px-4 py-2 rounded-t-lg ${
          activeTab === 'magazines'
            ? 'bg-white text-gray-800 font-semibold'
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }`}>
        Magazines
      </button>
      <button
        onClick={() => setActiveTab('articles')}
        className={`px-4 py-2 rounded-t-lg ${
          activeTab === 'articles'
            ? 'bg-white text-gray-800 font-semibold'
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }`}>
        Articles
      </button>
    </div>
  );
};

export default TabNavigation;
