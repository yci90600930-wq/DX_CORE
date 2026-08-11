# Supabase 연결 설정

이 프로젝트는 Supabase의 이메일·비밀번호 인증과 Postgres 데이터베이스를 사용하도록 준비되어 있습니다.

## 1. Supabase 프로젝트 생성

1. Supabase에서 새 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase/schema.sql` 전체를 실행합니다.
3. Authentication의 Email provider가 활성화되어 있는지 확인합니다.
4. 이메일 확인 기능은 운영 환경에서 활성화합니다.

## 2. 접속 주소 설정

- Authentication URL Configuration의 Site URL에 실제 배포 주소를 등록합니다.
- Redirect URLs에는 배포된 로그인 페이지 주소(예: `https://실제-배포-주소/login.html`)를 등록합니다.
- 현재 `file://` 주소는 이메일 확인과 비밀번호 재설정의 운영용 Redirect URL로 사용하지 않습니다.
- 실제 배포 주소는 [확인 필요]입니다.

## 3. 공개 연결 정보 입력

Supabase Dashboard의 API 설정에서 Project URL과 Publishable key를 복사해 `assets/js/supabase-config.js`에 입력합니다.

```js
window.DX_SUPABASE_CONFIG = Object.freeze({
  url: "https://프로젝트-ID.supabase.co",
  publishableKey: "sb_publishable_공개키",
  redirectUrl: "https://실제-배포-주소/login.html",
});
```

브라우저 코드에는 Publishable key만 사용합니다. Secret key와 service_role key는 절대 입력하지 않습니다.

## 4. 운영 전 확인

- 회원가입 이메일 확인
- 로그인과 로그아웃
- 비밀번호 재설정
- 사용자별 관심 키워드 분리
- RLS 정책 적용
- 운영용 SMTP 연결
