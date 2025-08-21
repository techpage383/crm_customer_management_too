import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Target, Settings, BarChart3, Users } from 'lucide-react';

export function Navigation() {
  const location = useLocation();

  const navigation = [
    { name: 'タスク管理', href: '/', icon: Target },
    { name: 'フロー設計', href: '/flow-designer', icon: Settings },
    { name: '統計・分析', href: '/analytics', icon: BarChart3 },
    { name: 'チーム管理', href: '/team', icon: Users },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                営業タスク管理 V2
              </span>
            </div>
            
            <div className="hidden md:flex space-x-6">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-sm text-gray-500">
              革新的カスタムフロー対応
            </div>
            <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">U</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* モバイルナビゲーション */}
      <div className="md:hidden border-t border-gray-200">
        <div className="flex overflow-x-auto px-4 py-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? 'text-primary-700'
                    : 'text-gray-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}