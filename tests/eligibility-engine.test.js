"use strict";

const assert = require("node:assert/strict");
const engine = require("../assets/js/eligibility-engine.js");

const evaluationAt = "2026-08-12T00:00:00.000Z";
const baseProfile = {
  entity_type: "corporation",
  head_office_region: "서울",
  factory_region: "경기",
  industry: "제조업",
  company_size: "sme",
  founded_on: "2022-08-12",
  desired_support_types: ["smart_factory"],
  is_manufacturer: true,
  is_venture_certified: true,
  has_same_program_benefit: false,
  has_participation_restriction: false,
};

const baseNotice = {
  id: "notice-1",
  title: "스마트공장 지원사업",
  summary: "중소 제조기업의 스마트공장 구축을 지원합니다.",
  target: "서울 또는 경기 소재 업력 7년 이내 중소 제조기업",
  supportField: "스마트공장",
  method: "온라인 신청",
  hashtags: [],
  applicationStart: "2026-08-01",
  applicationEnd: "2026-08-31",
  applicationPeriod: "2026.08.01 ~ 2026.08.31",
};

function rule(id, dimension, level, operator, value) {
  return { id, dimension, level, operator, value, evidence: id, confidence: 1 };
}

const allRules = [
  rule("target", "target", "required", "eq", { field: "is_manufacturer", value: true }),
  rule("region", "region", "required", "in", ["서울", "경기"]),
  rule("industry", "industry", "required", "contains", "제조"),
  rule("size", "company_size", "required", "in", ["sme"]),
  rule("age", "business_age_months", "required", "lte", 84),
  rule("purpose", "support_type", "required", "includes", "smart_factory"),
  rule("cert", "certification", "preferred", "includes", "venture"),
];

function match(profile = baseProfile, notice = baseNotice, rules = allRules) {
  return engine.matchEligibility(profile, notice, { rules }, { evaluationAt });
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

test("모든 조건을 충족하면 100점 ELIGIBLE", () => {
  const result = match();
  assert.equal(result.status, "ELIGIBLE");
  assert.equal(result.totalScore, 100);
  assert.equal(result.grade, "적극 추천");
});

test("지역 필수조건 불일치는 NOT_ELIGIBLE", () => {
  const result = match({ ...baseProfile, head_office_region: "부산", factory_region: null });
  assert.equal(result.status, "NOT_ELIGIBLE");
  assert.ok(result.unmatched.some((item) => item.id === "region"));
});

test("업종 필수조건 불일치는 NOT_ELIGIBLE", () => {
  const result = match({ ...baseProfile, industry: "건설업" });
  assert.equal(result.status, "NOT_ELIGIBLE");
  assert.equal(result.breakdown.find((item) => item.key === "industry").score, 0);
});

test("업력 필수조건 불일치는 NOT_ELIGIBLE", () => {
  const result = match({ ...baseProfile, founded_on: "2010-01-01" });
  assert.equal(result.status, "NOT_ELIGIBLE");
  assert.ok(result.unmatched.some((item) => item.id === "age"));
});

test("기업규모 필수조건 불일치는 NOT_ELIGIBLE", () => {
  const result = match({ ...baseProfile, company_size: "mid_sized" });
  assert.equal(result.status, "NOT_ELIGIBLE");
  assert.ok(result.unmatched.some((item) => item.id === "size"));
});

test("기업정보 일부 누락은 CHECK_REQUIRED이고 해당 점수는 0", () => {
  const profile = { ...baseProfile, head_office_region: null, factory_region: null };
  const result = match(profile);
  assert.equal(result.status, "CHECK_REQUIRED");
  assert.equal(result.breakdown.find((item) => item.key === "region").score, 0);
  assert.ok(result.unknown.some((item) => item.id === "region"));
});

test("우대조건만 불충족하면 ELIGIBLE을 유지", () => {
  const result = match({ ...baseProfile, is_venture_certified: false });
  assert.equal(result.status, "ELIGIBLE");
  assert.equal(result.breakdown.find((item) => item.key === "features").score, 0);
  assert.ok(result.preferred.unmatched.some((item) => item.id === "cert"));
});

test("제외조건에 해당하면 점수와 무관하게 NOT_ELIGIBLE", () => {
  const excluded = rule("excluded", "government_restriction", "excluded", "eq", { field: "has_same_program_benefit", value: true });
  const result = match({ ...baseProfile, has_same_program_benefit: true }, baseNotice, [...allRules, excluded]);
  assert.equal(result.status, "NOT_ELIGIBLE");
  assert.ok(result.totalScore > 0);
  assert.ok(result.unmatched.some((item) => item.id === "excluded"));
});

test("신청기간 종료는 NOT_ELIGIBLE", () => {
  const result = match(baseProfile, { ...baseNotice, applicationEnd: "2026-08-11" });
  assert.equal(result.status, "NOT_ELIGIBLE");
  assert.equal(result.breakdown.find((item) => item.key === "application_period").score, 0);
});

test("신청기간 시작 전은 NOT_ELIGIBLE", () => {
  const result = match(baseProfile, { ...baseNotice, applicationStart: "2026-08-13" });
  assert.equal(result.status, "NOT_ELIGIBLE");
});

test("모호한 자연어 조건은 unknown과 CHECK_REQUIRED", () => {
  const notice = { ...baseNotice, target: "서울 기업을 지원합니다", summary: "성장 가능성이 높은 기업" };
  const structured = engine.extractRules(notice);
  assert.ok(structured.rules.some((item) => item.dimension === "region" && item.level === "unknown"));
  const result = engine.matchEligibility(baseProfile, notice, structured, { evaluationAt });
  assert.equal(result.status, "CHECK_REQUIRED");
});

test("추출 조건이 없는 공고는 CHECK_REQUIRED", () => {
  const notice = { ...baseNotice, title: "지원사업 공고", target: "", summary: "", supportField: "", hashtags: [] };
  const structured = engine.extractRules(notice);
  assert.equal(structured.rules.length, 0);
  assert.equal(engine.matchEligibility(baseProfile, notice, structured, { evaluationAt }).status, "CHECK_REQUIRED");
});

test("미만과 초과는 경계값을 포함하지 않음", () => {
  const lessThan = rule("lt", "annual_revenue_krw", "required", "lt", 100000000);
  const greaterThan = rule("gt", "annual_revenue_krw", "required", "gt", 100000000);
  const boundaryProfile = { ...baseProfile, annual_revenue_krw: 100000000 };
  assert.equal(engine.matchEligibility(boundaryProfile, baseNotice, { rules: [lessThan] }, { evaluationAt }).status, "NOT_ELIGIBLE");
  assert.equal(engine.matchEligibility(boundaryProfile, baseNotice, { rules: [greaterThan] }, { evaluationAt }).status, "NOT_ELIGIBLE");
  const extractedLess = engine.extractRules({ ...baseNotice, target: "매출액 1억원 미만 기업에 한함" }).rules;
  const extractedGreater = engine.extractRules({ ...baseNotice, target: "매출액 1억원 초과 기업에 한함" }).rules;
  assert.ok(extractedLess.some((item) => item.operator === "lt"));
  assert.ok(extractedGreater.some((item) => item.operator === "gt"));
});

test("제한 없음과 수혜 여부 확인은 제외조건으로 만들지 않음", () => {
  const notice = { ...baseNotice, target: "참여 제한 없음. 동일사업 수혜 여부 확인." };
  const rules = engine.extractRules(notice).rules;
  assert.ok(!rules.some((item) => item.dimension === "government_restriction"));
});

test("자연어에서 매출·종업원·공장·인증·정부제한 조건을 추출", () => {
  const notice = {
    ...baseNotice,
    target: "매출액 10억원 이하, 상시근로자 50명 이하이며 공장등록을 한 벤처기업에 한함. 동일사업 수혜기업은 제외.",
  };
  const dimensions = engine.extractRules(notice).rules.map((item) => item.dimension);
  ["annual_revenue_krw", "employee_count", "factory_registration", "certification", "government_restriction"].forEach((dimension) => {
    assert.ok(dimensions.includes(dimension), `${dimension} 추출 누락`);
  });
});

test("AND/OR 3값 논리가 결정적으로 동작", () => {
  const trueRule = rule("t", "company_size", "required", "in", ["sme"]);
  const falseRule = rule("f", "company_size", "required", "in", ["mid_sized"]);
  const unknownRule = rule("u", "employee_count", "required", "lte", 10);
  assert.equal(engine.evaluateNode({ operator: "AND", rules: [trueRule, unknownRule] }, baseProfile, evaluationAt).result, engine.UNKNOWN);
  assert.equal(engine.evaluateNode({ operator: "AND", rules: [falseRule, unknownRule] }, baseProfile, evaluationAt).result, engine.FALSE);
  assert.equal(engine.evaluateNode({ operator: "OR", rules: [trueRule, unknownRule] }, baseProfile, evaluationAt).result, engine.TRUE);
});

test("OR 그룹의 한 조건이 충족되면 다른 필수 leaf 불일치로 탈락하지 않음", () => {
  const regionOr = {
    operator: "OR",
    rules: [
      rule("seoul", "region", "required", "in", ["서울"]),
      rule("busan", "region", "required", "in", ["부산"]),
    ],
  };
  const result = engine.matchEligibility(baseProfile, baseNotice, { groups: [regionOr] }, { evaluationAt });
  assert.equal(result.status, "ELIGIBLE");
});

test("추천 등급 경계가 정확함", () => {
  assert.equal(engine.getGrade(100), "적극 추천");
  assert.equal(engine.getGrade(90), "적극 추천");
  assert.equal(engine.getGrade(89), "지원 가능성 높음");
  assert.equal(engine.getGrade(75), "지원 가능성 높음");
  assert.equal(engine.getGrade(74), "조건 확인 필요");
  assert.equal(engine.getGrade(60), "조건 확인 필요");
  assert.equal(engine.getGrade(59), "지원 가능성 낮음");
  assert.equal(engine.getGrade(40), "지원 가능성 낮음");
  assert.equal(engine.getGrade(39), "추천 제외");
});

test("동일 입력은 완전히 동일한 결과를 반환", () => {
  assert.deepEqual(match(), match());
});

let passed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    passed += 1;
    process.stdout.write(`✓ ${name}\n`);
  } catch (error) {
    process.stderr.write(`✗ ${name}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}

process.stdout.write(`${passed}/${tests.length} tests passed\n`);
