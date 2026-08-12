# 배포 준비 점검

점검 기준 시각: 2026-08-12 10:36:30 KST

## 현재 판정

현재 운영판은 기존 4개 기관 수집 방식입니다. 새 공공데이터포털 단일 API 버전은 실제 데이터 검증과 배포 패키징을 마쳤으며 공개 배포 전 승인 단계입니다. 로그인 기능까지 포함한 전체 운영 판정은 아직 `NO-GO`입니다.

## 배포 차단 항목

1. Supabase `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`가 없어 회원가입·로그인·계정별 관심 키워드 저장이 동작하지 않습니다.
2. Supabase RLS 적용과 운영 `/login.html` Redirect URL 등록이 확인되지 않았습니다.
3. 새 공공데이터포털 단일 API 버전은 아직 운영 URL에 공개 배포되지 않았습니다.

## 이번 단계에서 준비한 항목

- 데모 공고 배열 제거, `/api/notices`에서 받은 공식 공고만 표시
- 화면 새로고침과 30분 단위 자동 갱신 시 공식 API 재호출
- 접수 종료일이 지나지 않은 공고만 서버에서 전달
- 공공데이터포털 응답의 개별 원문과 실제 첨부파일 URL 연결
- `server/index.js`에 순수 JavaScript Cloudflare Worker 호환 라우팅 추가
- 공공데이터포털 인증키는 서버 환경 변수 `DATA_GO_KR_API_KEY`로만 사용
- Supabase 공개 연결값은 운영 시 서버가 브라우저 설정 파일로 생성
- Sites 프로젝트 생성 및 `.openai/hosting.json`에 실제 프로젝트 ID 저장
- `dist/`에 공개 허용 파일과 Worker만 스테이징
- 기존 4개 기관 수집기 제거 및 공공데이터포털 단일 수집기로 교체
- 실제 공식 응답 전체 페이지 검사 통과: 접수 진행 공고 1,404건, 고유 `pblancId` 1,404개
- 7개 화면 분류와 전체 버튼의 진행 공고 수 집계 연결
- Sites Secret `DATA_GO_KR_API_KEY` 등록 완료

## 보안 점검 결과

- Secret key, service_role key, GitHub 토큰과 개인키 없음
- 실사용 개인 이메일, 전화번호와 사설 IP 없음
- 공공데이터포털 인증키는 Sites Secret에만 저장되며 코드·문서·Git에는 포함되지 않음
- Supabase 공개 연결 정보는 현재 빈 값
- Supabase SQL에 RLS 활성화, 익명 권한 회수와 사용자 본인 데이터 정책이 정의됨. 실제 적용 여부는 확인 필요
- 사용자 키워드의 HTML 출력은 escape 처리됨
- 외부 새 창 링크에 `noopener noreferrer` 적용
- Supabase 브라우저 라이브러리를 `2.112.2`로 고정하고 SHA-384 무결성 검사를 추가함
- 두 HTML 문서에 CSP와 Referrer Policy를 추가함
- 모든 JavaScript 문법, HTML 중복 ID, 로컬 파일 경로와 CSS 중괄호 검사 통과

## 공개 배포물 최소 범위

- `index.html`
- `login.html`
- `assets/css/styles.css`
- `assets/js/app.js`
- `assets/js/auth.js`
- `assets/js/light-rays.js`
- `assets/js/login.js`
- `assets/js/supabase-config.js`
- `assets/js/text-loop.js`
- `server/index.js`
- `.openai/hosting.json`

다음 항목은 배포물에서 제외합니다.

- `.git/`
- `.codex/`
- `docs/`
- `supabase/`
- `AGENTS.md`
- `.gitignore`

## 운영 전 추가 확인

- 새 버전 공개 배포 후 운영 API, 분류 필터와 휴대폰 폭 화면 재검증
- Supabase 프로젝트, Email provider, 운영 SMTP와 RLS 적용
- 배포된 `/login.html` 주소의 Supabase Redirect URL 등록
- Sites의 정적 파일 바인딩에서 `dist/` 파일 경로 검증

## 진행하지 않은 작업

- Supabase 운영 환경 변수와 Redirect URL 등록
