import psycopg2
import pandas as pd
from typing import List, Dict, Any, Optional
from flask import Flask, jsonify, request
from flask_cors import CORS

# Flask 앱 초기화
app = Flask(__name__)
CORS(app)  # CORS 허용

# Supabase PostgreSQL 연결 정보
# 패스워드의 특수문자들을 URL 인코딩: ! = %21, @ = %40, # = %23
DATABASE_URL = "postgresql://postgres:3edc1qaz%21%21%40%40%23%23@db.njopxuzaishmnyvwzhlk.supabase.co:5432/postgres"

def get_connection():
    """Supabase PostgreSQL 데이터베이스에 연결"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"데이터베이스 연결 오류: {e}")
        return None

def get_da_members() -> List[Dict[str, Any]]:
    """da_members 테이블에서 모든 데이터를 가져옵니다"""
    conn = get_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor()
        
        # da_members 테이블에서 모든 데이터 조회
        query = "SELECT * FROM da_members"
        cursor.execute(query)
        
        # 컬럼 이름 가져오기
        columns = [desc[0] for desc in cursor.description]
        
        # 데이터 가져오기
        rows = cursor.fetchall()
        
        # 딕셔너리 형태로 변환
        result = []
        for row in rows:
            result.append(dict(zip(columns, row)))
        
        return result
        
    except Exception as e:
        print(f"데이터 조회 오류: {e}")
        return []
    
    finally:
        if conn:
            conn.close()

def get_member_by_id(member_id: int) -> Optional[Dict[str, Any]]:
    """특정 ID의 멤버 데이터를 가져옵니다"""
    conn = get_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        
        query = "SELECT * FROM da_members WHERE id = %s"
        cursor.execute(query, (member_id,))
        
        columns = [desc[0] for desc in cursor.description]
        row = cursor.fetchone()
        
        if row:
            return dict(zip(columns, row))
        return None
        
    except Exception as e:
        print(f"멤버 조회 오류: {e}")
        return None
    
    finally:
        if conn:
            conn.close()

def create_member(member_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """새로운 멤버를 생성합니다"""
    conn = get_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        
        # 동적으로 INSERT 쿼리 생성
        columns = list(member_data.keys())
        placeholders = ["%s"] * len(columns)
        values = list(member_data.values())
        
        query = f"INSERT INTO da_members ({', '.join(columns)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        cursor.execute(query, values)
        
        conn.commit()
        
        # 생성된 레코드 반환
        columns = [desc[0] for desc in cursor.description]
        row = cursor.fetchone()
        
        if row:
            return dict(zip(columns, row))
        return None
        
    except Exception as e:
        print(f"멤버 생성 오류: {e}")
        return None
    
    finally:
        if conn:
            conn.close()

# REST API 엔드포인트들

@app.route('/members', methods=['GET'])
def get_members():
    """모든 멤버 데이터를 가져옵니다"""
    try:
        members = get_da_members()
        return jsonify({
            'success': True,
            'data': members,
            'count': len(members)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/members/<int:member_id>', methods=['GET'])
def get_member(member_id):
    """특정 ID의 멤버 데이터를 가져옵니다"""
    try:
        member = get_member_by_id(member_id)
        if member:
            return jsonify({
                'success': True,
                'data': member
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Member not found'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/members', methods=['POST'])
def create_new_member():
    """새로운 멤버를 생성합니다"""
    try:
        if not request.json:
            return jsonify({
                'success': False,
                'error': 'JSON data required'
            }), 400
        
        member = create_member(request.json)
        if member:
            return jsonify({
                'success': True,
                'data': member
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to create member'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/members/bulk', methods=['POST'])
def bulk_insert_members():
    """여러 멤버를 한번에 추가합니다"""
    try:
        # 새로운 Manager급 멤버들 추가
        new_members = [
            {'name': '정형근', 'grade': 'Manager', 'gender': 'male'},
            {'name': '이범승', 'grade': 'Manager', 'gender': 'male'},
            {'name': '조하늘', 'grade': 'Manager', 'gender': 'male'},
            {'name': '양성수', 'grade': 'Manager', 'gender': 'male'}
        ]
        
        conn = get_connection()
        if not conn:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        cursor = conn.cursor()
        
        # 일괄 삽입
        insert_query = """
            INSERT INTO da_members (name, grade, gender, created_at) 
            VALUES (%(name)s, %(grade)s, %(gender)s, NOW())
        """
        
        cursor.executemany(insert_query, new_members)
        conn.commit()
        
        # 추가된 멤버들 확인
        cursor.execute("SELECT * FROM da_members ORDER BY created_at DESC LIMIT 4")
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        
        result = []
        for row in rows:
            result.append(dict(zip(columns, row)))
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'{len(new_members)}명의 새로운 멤버가 추가되었습니다',
            'data': result
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """API 상태 확인"""
    return jsonify({
        'success': True,
        'message': 'API is running',
        'database_connected': get_connection() is not None
    }), 200

if __name__ == "__main__":
    print("=== Flask REST API 서버 시작 ===")
    print("사용 가능한 엔드포인트:")
    print("GET    /members           - 모든 멤버 조회")
    print("GET    /members/<id>      - 특정 멤버 조회")
    print("POST   /members           - 새 멤버 생성")
    print("GET    /health            - 서버 상태 확인")
    print("\n서버가 http://localhost:5000 에서 실행됩니다...")
    
    app.run(debug=True, host='0.0.0.0', port=5000)