-- da_members 테이블에 새로운 Manager급 멤버들 추가
-- created_at은 현재 시간으로 자동 설정, id는 auto increment

INSERT INTO da_members (name, grade, gender, created_at) VALUES
('정형근', 'Manager', 'male', NOW()),
('이범승', 'Manager', 'male', NOW()),
('조하늘', 'Manager', 'male', NOW()),
('양성수', 'Manager', 'male', NOW());

-- 추가된 데이터 확인
SELECT * FROM da_members ORDER BY created_at DESC; 