# 배포 준비 점검

점검 기준 시각: 2026-08-11 15:03:39 KST

## 현재 판정

제한 운영판은 배포되었습니다. 중기부·소진공·스마트공장 공고 조회는 사용할 수 있지만, 전체 기능 운영은 아래 설정값이 필요해 아직 `NO-GO`입니다.

## 배포 차단 항목

1. 기업마당 `BIZINFO_API_KEY`가 없어 실제 API 응답으로 전체 흐름을 최종 확인하지 못했습니다.
2. Supabase `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`가 없어 회원가입·로그인·계정별 관심 키워드 저장이 동작하지 않습니다.
3. Sites 운영 URL은 첫 배포 전까지 확정되지 않아 Supabase Redirect URL을 아직 등록할 수 없습니다.

## 이번 단계에서 준비한 항목

- 데모 공고 배열 제거, `/api/notices`에서 받은 공식 공고만 표시
- 화면 새로고침과 30분 단위 자동 갱신 시 공식 API 재호출
- 접수 종료일이 지나지 않은 공고만 서버에서 전달
- 개별 기업마당 원문과 실제 첨부파일 URL 연결
- `server/index.js`에 순수 JavaScript Cloudflare Worker 호환 라우팅 추가
- 기업마당 인증키는 서버 환경 변수로만 사용
- Supabase 공개 연결값은 운영 시 서버가 브라우저 설정 파일로 생성
- Sites 프로젝트 생성 및 `.openai/hosting.json`에 실제 프로젝트 ID 저장
- `dist/`에 공개 허용 파일과 Worker만 스테이징
- 실제 공식 응답 검사 통과: 중기부 12건, 소진공 28건, 스마트공장 61건 수집

## 보안 점검 결과

- Secret key, service_role key, GitHub 토큰과 개인키 없음
- 실사용 개인 이메일, 전화번호와 사설 IP 없음
- Supabase 공개 연결 정보도 현재는 빈 값
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

- 기업마당 API 인증키를 Sites에서 Secret 환경 변수로 등록하고 실제 응답 검증
- Supabase 프로젝트, Email provider, 운영 SMTP와 RLS 적용
- 배포된 `/login.html` 주소의 Supabase Redirect URL 등록
- Sites의 정적 파일 바인딩에서 `dist/` 파일 경로 검증

## 진행하지 않은 작업

- 기업마당 API 환경 변수 등록
- Supabase 운영 환경 변수와 Redirect URL 등록
