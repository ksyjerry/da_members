import { createClient } from '@supabase/supabase-js'

// Supabase 설정 (환경변수 또는 직접 설정)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://njopxuzaishmnyvwzhlk.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qb3B4dXphaXNobW55dnd6aGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MzU5MjEsImV4cCI6MjA2NTExMTkyMX0.FItE7M6LTTyRmFqUh7JnzKlTO-zzF2zydMovP0jokfI'

console.log('🔧 Supabase 설정 정보:')
console.log('URL:', supabaseUrl)
console.log('Key 설정됨:', !!supabaseAnonKey)

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
})

// 연결 테스트 함수
export const testConnection = async () => {
  console.log('🔗 Supabase 연결 테스트...')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseAnonKey ? 'Key가 설정됨' : 'Key가 없음')
  
  try {
    // 먼저 단순한 select 쿼리로 테스트
    const { data, error } = await supabase.from('da_members').select('*')
    
    console.log('📊 쿼리 결과:', { data, error })
    
    if (error) {
      console.error('❌ 연결 실패:', error)
      console.error('오류 세부사항:', error.message, error.details, error.hint)
      return false
    }
    
    console.log('✅ 연결 성공!')
    console.log(`📈 총 ${data?.length || 0}개의 레코드를 찾았습니다`)
    if (data && data.length > 0) {
      console.log('첫 번째 레코드:', data[0])
    }
    return true
  } catch (err) {
    console.error('❌ 연결 오류:', err)
    return false
  }
}

// 타입 정의
export interface Member {
  id: number
  created_at: string
  name: string
  grade: string
  gender: string
}

// Supabase 클라이언트를 사용한 API 함수들
export const supabaseApi = {
  // 모든 멤버 조회
  async getMembers(): Promise<{ data: Member[]; error: string | null }> {
    try {
      console.log('🔍 멤버 조회 시작...')
      
      const { data, error } = await supabase
        .from('da_members')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('📊 멤버 조회 결과:', { data, error })

      if (error) {
        console.error('❌ Supabase 오류:', error)
        console.error('오류 세부사항:', error.message, error.details, error.hint)
        return { data: [], error: error.message }
      }

      console.log(`✅ 성공적으로 ${data?.length || 0}개의 멤버를 가져왔습니다`)
      if (data && data.length > 0) {
        console.log('첫 번째 멤버:', data[0])
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ API 오류:', error)
      return { data: [], error: error instanceof Error ? error.message : '알 수 없는 오류' }
    }
  },

  // 새 멤버 추가
  async addMember(member: Omit<Member, 'id' | 'created_at'>): Promise<{ data: Member | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('da_members')
        .insert([member])
        .select()
        .single()

      if (error) {
        console.error('Supabase 삽입 오류:', error)
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      console.error('API 오류:', error)
      return { data: null, error: error instanceof Error ? error.message : '알 수 없는 오류' }
    }
  },

  // 여러 멤버 한번에 추가
  async addMultipleMembers(members: Omit<Member, 'id' | 'created_at'>[]): Promise<{ data: Member[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('da_members')
        .insert(members)
        .select()

      if (error) {
        console.error('Supabase 일괄 삽입 오류:', error)
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('API 오류:', error)
      return { data: [], error: error instanceof Error ? error.message : '알 수 없는 오류' }
    }
  }
} 