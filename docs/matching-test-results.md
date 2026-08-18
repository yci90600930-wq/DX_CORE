# 기업정보 맞춤검색 테스트 결과

검증 일시: 2026-08-12 KST

## 고정 시나리오

| 유형 | 예상 판정 | 실제 판정 | 적합도 확인 | 판정 이유 확인 |
| --- | --- | --- | --- | --- |
| 모든 조건 충족 | ELIGIBLE | ELIGIBLE | 100점 | 모든 필수·우대·기간 일치 |
| 지역 불일치 | NOT_ELIGIBLE | NOT_ELIGIBLE | 지역 0점 | 필수 지역 불일치 |
| 업종 불일치 | NOT_ELIGIBLE | NOT_ELIGIBLE | 업종 0점 | 필수 업종 불일치 |
| 업력 초과 | NOT_ELIGIBLE | NOT_ELIGIBLE | 업력 0점 | 최대 업력 위반 |
| 기업규모 불일치 | NOT_ELIGIBLE | NOT_ELIGIBLE | 기업규모 0점 | 필수 기업규모 불일치 |
| 기업정보 일부 없음 | CHECK_REQUIRED | CHECK_REQUIRED | 미입력 항목 0점 | 기업정보 추가 입력 필요 |
| 우대조건만 불충족 | ELIGIBLE | ELIGIBLE | 우대 항목만 0점 | 우대는 자격 판정을 막지 않음 |
| 제외조건 해당 | NOT_ELIGIBLE | NOT_ELIGIBLE | 점수와 무관 | 명시 제외조건 해당 |
| 신청기간 종료 | NOT_ELIGIBLE | NOT_ELIGIBLE | 신청기간 0점 | 신청기간 종료 |
| 자연어 조건 모호 | CHECK_REQUIRED | CHECK_REQUIRED | 모호 항목 0점 | 원문 확인 필요 |

추가로 신청 시작 전, AND·OR 3값 논리, 빈 조건, 미만·초과 경계, 제한 없음 문구, 추천 등급 경계와 동일 입력 결정성을 포함해 총 19개 자동 검사를 통과했습니다.

## 실제 API 공고 표본

- 대상: 현재 운영 `/api/notices`의 공공데이터포털 공고 1,452건 중 최근 50건
- 표본 결과: ELIGIBLE 0건, CHECK_REQUIRED 44건, NOT_ELIGIBLE 6건
- 추출 조건: 총 367개
- 무근거 NOT_ELIGIBLE 후보: 0건
- 확인 필요: 자연어 의미의 실제 정확도와 첨부파일에만 있는 자격조건은 사람이 원문과 대조해야 합니다.

## 기존 기능 회귀

- 기존 API 주소와 `DATA_GO_KR_API_KEY` 환경변수 방식 유지
- 일반 키워드 검색, 분류·지역 필터, 두 공고 표, 페이지네이션과 상세 hash 흐름 유지
- 상세보기, 원문보기와 신청 링크 유지
- index/company HTML 중복 ID 없음
- 원본과 `dist`, `dist/client` 핵심 파일 해시 일치
- 전체 JavaScript 구문 검사와 변경 형식 검사 통과
- 380px 화면에서 index/company 수평 넘침 없음, 브라우저 오류 로그 없음
