// 게시글 타입 정의
export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  views: number;
}

// 더미 게시글 데이터
export const dummyPosts: Post[] = [
  {
    id: 1,
    title: '첫 번째 게시글입니다',
    content: `안녕하세요! 첫 번째 게시글을 작성합니다.

이곳은 DA 팀 게시판입니다. 다양한 정보를 공유하고 소통할 수 있는 공간으로 활용해보세요.

앞으로 많은 유용한 정보들이 공유되기를 기대합니다!`,
    author: '정형근',
    created_at: '2024-01-15T10:30:00Z',
    views: 42
  },
  {
    id: 2,
    title: 'DA 팀 회의 안내',
    content: `내일 오후 2시에 회의실에서 팀 회의가 있습니다.

회의 안건:
1. Q1 프로젝트 진행 상황 점검
2. 새로운 멤버 온보딩 계획
3. 팀 워크샵 일정 조율
4. 기타 안건

참석 가능 여부를 회신해주세요.`,
    author: '이범승',
    created_at: '2024-01-14T15:20:00Z',
    views: 28
  },
  {
    id: 3,
    title: '프로젝트 진행 상황 공유',
    content: `현재 진행 중인 프로젝트의 상황을 공유드립니다.

📊 진행률: 65% 완료
🎯 목표 완료일: 2024년 2월 29일
👥 투입 인원: 5명

주요 성과:
- 데이터 분석 모델 구축 완료
- 대시보드 UI/UX 디자인 완료
- API 개발 80% 진행

향후 계획:
- 테스트 및 버그 수정
- 성능 최적화
- 사용자 피드백 수집

궁금한 점이 있으시면 언제든 문의해주세요!`,
    author: '조하늘',
    created_at: '2024-01-13T09:15:00Z',
    views: 65
  },
  {
    id: 4,
    title: '신입 멤버 환영합니다! 🎉',
    content: `안녕하세요! 새롭게 DA 팀에 합류하신 양성수님을 환영합니다.

양성수님은 데이터 엔지니어링 분야에서 풍부한 경험을 가지고 계시며, 
우리 팀의 데이터 파이프라인 구축에 큰 도움이 될 것으로 기대합니다.

앞으로 함께 성장해 나가면서 좋은 성과를 만들어가길 바랍니다!

다시 한 번 환영합니다! 👏`,
    author: '정형근',
    created_at: '2024-01-12T14:45:00Z',
    views: 33
  },
  {
    id: 5,
    title: '2024년 1분기 목표 설정',
    content: `새해를 맞아 1분기 목표를 설정해보았습니다.

🎯 주요 목표:
1. 고객 데이터 분석 플랫폼 구축
2. 실시간 대시보드 시스템 개발  
3. ML 모델 정확도 10% 향상
4. 팀 역량 강화 교육 프로그램 운영

📈 성과 지표:
- 프로젝트 완료율: 95% 이상
- 고객 만족도: 4.5/5.0 이상
- 팀원 개발 역량 평가: 평균 85점 이상

모든 팀원이 함께 노력해서 목표를 달성해봅시다!`,
    author: '이범승',
    created_at: '2024-01-10T16:30:00Z',
    views: 78
  }
];

// 새로운 게시글 ID 생성 함수
export const getNextPostId = (posts: Post[]): number => {
  return Math.max(...posts.map(post => post.id)) + 1;
};

// 날짜 포맷팅 함수
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}; 