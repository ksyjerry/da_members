'use client';

import { useState, useEffect } from 'react';
import { supabaseApi, Member, testConnection } from '@/lib/supabase';

export default function Home() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    grade: 'Manager',
    gender: 'male'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 연결 테스트 먼저 실행
    testConnection().then(() => {
      fetchMembers();
    });
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabaseApi.getMembers();
      
      if (error) {
        throw new Error(error);
      }

      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      console.error('Supabase 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshMembers = () => {
    fetchMembers();
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const { error } = await supabaseApi.addMember(formData);
      
      if (error) {
        throw new Error(error);
      }

      alert(`${formData.name}님이 성공적으로 추가되었습니다!`);
      
      // 폼 초기화 및 닫기
      setFormData({ name: '', grade: 'Manager', gender: 'male' });
      setShowAddForm(false);
      
      // 목록 새로고침
      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : '멤버 추가 중 오류가 발생했습니다');
      console.error('멤버 추가 오류:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">DA 멤버 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={refreshMembers}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            다시 시도
          </button>
          <div className="mt-4 text-sm text-gray-500">
            Flask API 서버(localhost:5000)가 실행 중인지 확인해주세요.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🚀 DA 멤버 명단</h1>
              <p className="text-gray-600 mt-1">총 {members.length}명의 멤버가 있습니다</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                멤버 추가
              </button>
              <button
                onClick={refreshMembers}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                새로고침
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 멤버 리스트 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {members.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">멤버가 없습니다</h3>
            <p className="text-gray-500">DA 멤버 데이터가 아직 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {members.map((member, index) => (
              <div
                key={member.id || index}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100"
              >
                <div className="p-6">
                  {/* 멤버 아바타 */}
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mb-4">
                    <span className="text-white text-xl font-bold">
                      {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>

                  {/* 멤버 정보 */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {member.name || `멤버 #${member.id}`}
                    </h3>
                    
                    {/* 동적으로 모든 필드 표시 */}
                    <div className="space-y-1 text-sm text-gray-600">
                      {Object.entries(member).map(([key, value]) => {
                        if (key === 'id' || key === 'name' || key === 'username') return null;
                        if (value === null || value === undefined || value === '') return null;
                        
                        return (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium capitalize">{key}:</span>
                            <span className="text-gray-800">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* 멤버 ID */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        ID: {member.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 멤버 추가 모달 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              {/* 모달 헤더 */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">새 멤버 추가</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 폼 */}
              <form onSubmit={handleAddMember} className="space-y-4">
                {/* 이름 입력 */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    이름 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="멤버 이름을 입력하세요"
                    required
                  />
                </div>

                {/* 직급 선택 */}
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                    직급
                  </label>
                  <select
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Partner">Partner</option>
                    <option value="SM">SM</option>
                    <option value="Associate">Associate</option>
                    <option value="Analyst">Analyst</option>
                  </select>
                </div>

                {/* 성별 선택 */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    성별
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>

                {/* 버튼들 */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        추가 중...
                      </>
                    ) : (
                      '추가하기'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 푸터 */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>🔗 Supabase 직접 연결: <code className="bg-gray-100 px-2 py-1 rounded">da_members 테이블</code></p>
            <p className="mt-1">Next.js에서 Supabase JavaScript 클라이언트를 통해 실시간 연동</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
