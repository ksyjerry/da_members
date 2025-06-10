'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseApi, Member, Post, User, testConnection, supabase } from '@/lib/supabase';
import { formatDate } from '@/data/posts';
import AuthModal from '@/components/auth/AuthModal';
import UserProfile from '@/components/auth/UserProfile';

export default function Home() {
  // 인증 상태
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'members' | 'board'>('members');
  
  // 멤버 관련 상태
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

  // 게시판 관련 상태
  const [posts, setPosts] = useState<Post[]>([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postFormData, setPostFormData] = useState({
    title: '',
    content: '',
    author: ''
  });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showMyPostsOnly, setShowMyPostsOnly] = useState(false);

  useEffect(() => {
    // 인증 상태 확인
    checkAuthStatus();
    
    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user as User);
        setAuthLoading(false);
      } else {
        setUser(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // 사용자가 로그인했을 때만 데이터 로드
    if (user) {
      loadData();
    }
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      const { data, error } = await supabaseApi.getCurrentUser();
      if (data && !error) {
        setUser(data);
      }
    } catch (err) {
      console.error('인증 상태 확인 오류:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchMembers = useCallback(async () => {
    try {
      setError(null);

      const { data, error } = await supabaseApi.getMembers();
      
      if (error) {
        throw new Error(error);
      }

      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      console.error('Supabase 조회 오류:', err);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setError(null);

      const { data, error } = await supabaseApi.getPosts();
      
      if (error) {
        throw new Error(error);
      }

      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글 로드 중 오류가 발생했습니다');
      console.error('게시글 조회 오류:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    console.log('🔄 데이터 로드 시작...');
    setLoading(true);
    try {
      // 연결 테스트 먼저 실행
      console.log('🔗 Supabase 연결 테스트...');
      await testConnection();
      console.log('📊 멤버 및 게시글 데이터 로드...');
      await Promise.all([fetchMembers(), fetchPosts()]);
      console.log('✅ 데이터 로드 완료!');
    } catch (err) {
      console.error('❌ 데이터 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchMembers, fetchPosts]);

  const handleAuthSuccess = () => {
    console.log('✅ 인증 성공!');
    setShowAuthModal(false);
    // 인증 성공 후 데이터 로드는 useEffect에서 처리됨
  };

  const handleLogout = () => {
    setUser(null);
    setMembers([]);
    setPosts([]);
    setLoading(true);
  };

  // 현재 사용자 이름 가져오기
  const getCurrentUserName = () => {
    if (!user) return '';
    return user.user_metadata?.name || user.email?.split('@')[0] || '';
  };

  // 필터링된 게시글 반환
  const getFilteredPosts = () => {
    if (!showMyPostsOnly) return posts;
    
    const currentUserName = getCurrentUserName();
    return posts.filter(post => post.author === currentUserName);
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

  // 게시판 관련 함수들
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postFormData.title.trim() || !postFormData.content.trim() || !postFormData.author.trim()) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      setError(null);

      const { error } = await supabaseApi.addPost({
        title: postFormData.title,
        content: postFormData.content,
        author: postFormData.author
      });
      
      if (error) {
        throw new Error(error);
      }

      alert('게시글이 성공적으로 작성되었습니다!');
      setPostFormData({ title: '', content: '', author: '' });
      setShowPostForm(false);
      
      // 게시글 목록 새로고침
      fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글 작성 중 오류가 발생했습니다');
      console.error('게시글 작성 오류:', err);
    }
  };

  const handlePostInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPostFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openPostDetail = async (post: Post) => {
    try {
      // Supabase에서 조회수 증가
      const { data, error } = await supabaseApi.incrementPostViews(post.id);
      
      if (error) {
        console.error('조회수 증가 오류:', error);
        // 오류가 있어도 모달은 열기
        setSelectedPost(post);
      } else if (data) {
        // 로컬 상태 업데이트
        setPosts(prev => prev.map(p => 
          p.id === post.id ? data : p
        ));
        setSelectedPost(data);
      }
    } catch (err) {
      console.error('조회수 증가 오류:', err);
      setSelectedPost(post);
    }
  };

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">인증 상태를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 사용자
  if (!user) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        {/* 인증되지 않은 사용자를 위한 헤더 */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🚀 DA 관리 시스템</h1>
                <p className="text-gray-600 mt-1">데이터 분석팀 멤버 및 게시판 관리</p>
              </div>
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                로그인
              </button>
            </div>
          </div>
        </header>

        {/* 인증되지 않은 사용자를 위한 메인 화면 */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-6xl mb-8">🔒</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
            <p className="text-lg text-gray-600 mb-8">
              DA 관리 시스템을 사용하려면 로그인하세요.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
              >
                로그인 / 회원가입
              </button>
              <div className="text-sm text-gray-500">
                DA팀 멤버만 접근 가능합니다
              </div>
            </div>
          </div>
        </main>

        {/* 인증 모달 */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

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
            onClick={loadData}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* 인증된 사용자를 위한 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🚀 DA 관리 시스템</h1>
              <p className="text-gray-600 mt-1">
                {activeTab === 'members' 
                  ? `총 ${members.length}명의 멤버가 있습니다`
                  : `${showMyPostsOnly ? '내 게시글' : '전체 게시글'} ${getFilteredPosts().length}개`
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* 기능 버튼들 */}
              <div className="flex gap-3">
                {activeTab === 'members' ? (
                  <>
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
                      onClick={loadData}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      새로고침
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowMyPostsOnly(!showMyPostsOnly)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        showMyPostsOnly
                          ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                          : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {showMyPostsOnly ? '👤 내 글만' : '🌐 전체 글'}
                    </button>
                    <button
                      onClick={() => {
                        setPostFormData(prev => ({
                          ...prev,
                          author: user?.user_metadata?.name || user?.email?.split('@')[0] || ''
                        }));
                        setShowPostForm(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      글 작성
                    </button>
                  </div>
                )}
              </div>
              
              {/* 사용자 프로필 */}
              <UserProfile user={user} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('members')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 멤버 명단
            </button>
            <button
              onClick={() => setActiveTab('board')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'board'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📝 게시판
            </button>
          </nav>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'members' ? (
          // 멤버 목록
          <>
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
          </>
        ) : (
          // 게시판
          <>
            {getFilteredPosts().length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {showMyPostsOnly ? '내가 작성한 게시글이 없습니다' : '게시글이 없습니다'}
                </h3>
                <p className="text-gray-500">
                  {showMyPostsOnly 
                    ? '첫 번째 게시글을 작성해보세요!' 
                    : '첫 번째 게시글을 작성해보세요!'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredPosts().map((post) => {
                  const isMyPost = post.author === getCurrentUserName();
                  return (
                    <div
                      key={post.id}
                      onClick={() => openPostDetail(post)}
                      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 cursor-pointer border ${
                        isMyPost 
                          ? 'border-purple-200 bg-purple-50' 
                          : 'border-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600">
                              {post.title}
                            </h3>
                            {isMyPost && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                👤 내 글
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {post.content.length > 100 
                              ? `${post.content.substring(0, 100)}...` 
                              : post.content}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {post.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDate(post.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {post.views}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
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

      {/* 게시글 작성 모달 */}
      {showPostForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* 모달 헤더 */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">새 게시글 작성</h2>
                <button
                  onClick={() => setShowPostForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 폼 */}
              <form onSubmit={handlePostSubmit} className="space-y-4">
                {/* 제목 입력 */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={postFormData.title}
                    onChange={handlePostInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="게시글 제목을 입력하세요"
                    required
                  />
                </div>

                {/* 작성자 입력 */}
                <div>
                  <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                    작성자 *
                  </label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    value={postFormData.author}
                    onChange={handlePostInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="작성자 이름을 입력하세요"
                    required
                  />
                </div>

                {/* 내용 입력 */}
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                    내용 *
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={postFormData.content}
                    onChange={handlePostInputChange}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="게시글 내용을 입력하세요"
                    required
                  />
                </div>

                {/* 버튼들 */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPostForm(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    작성하기
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 게시글 상세 보기 모달 */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* 모달 헤더 */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{selectedPost.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {selectedPost.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(selectedPost.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      조회수 {selectedPost.views}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 게시글 내용 */}
              <div className="border-t border-gray-200 pt-6">
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedPost.content}
                  </p>
                </div>
              </div>

              {/* 닫기 버튼 */}
              <div className="border-t border-gray-200 pt-6 mt-8">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 인증 모달 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* 푸터 */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>🔗 Supabase 직접 연결: <code className="bg-gray-100 px-2 py-1 rounded">da_members & posts 테이블</code></p>
            <p className="mt-1">Next.js에서 Supabase JavaScript 클라이언트를 통해 실시간 연동 + 인증</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
