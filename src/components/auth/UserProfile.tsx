'use client';

import { supabaseApi, User } from '@/lib/supabase';

interface UserProfileProps {
  user: User;
  onLogout: () => void;
}

export default function UserProfile({ user, onLogout }: UserProfileProps) {
  const handleLogout = async () => {
    const { error } = await supabaseApi.signOut();
    
    if (error) {
      alert(`로그아웃 중 오류가 발생했습니다: ${error}`);
      return;
    }
    
    onLogout();
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
          {user.user_metadata?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-gray-700">
            {user.user_metadata?.name || '사용자'}
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </div>
      
      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
} 