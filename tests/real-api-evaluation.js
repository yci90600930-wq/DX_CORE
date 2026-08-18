"use strict";

const fs = require("node:fs");
const assert = require("node:assert/strict");
const engine = require("../assets/js/eligibility-engine.js");

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Usage: node tests/real-api-evaluation.js <notices.json>");
const notices = JSON.parse(fs.readFileSync(inputPath, "utf8")).slice(0, 50);
assert.ok(notices.length >= 20 && notices.length <= 50, "실제 공고 표본은 20~50건이어야 합니다.");

const profile = {
  id: "sample-sme",
  company_name: "검증용 제조기업",
  entity_type: "corporation",
  company_size: "sme",
  head_office_region: "경기",
  factory_region: "경기",
  industry: "제조업",
  industry_detail: "산업용 자동화장비 제조",
  founded_on: "2021-01-01",
  annual_revenue_krw: 3000000000,
  employee_count: 25,
  is_manufacturer: true,
  has_factory_registration: true,
  has_export_experience: true,
  export_amount_krw: 500000000,
  has_corporate_research_institute: true,
  is_venture_certified: true,
  is_innobiz_certified: false,
  is_mainbiz_certified: false,
  is_women_owned_certified: false,
  is_disabled_owned_certified: false,
  is_social_enterprise: false,
  has_same_program_benefit: false,
  has_participation_restriction: false,
  desired_support_types: ["smart_factory", "ai_dx", "automation", "rnd", "export"],
};

const results = notices.map((notice) => {
  const structured = engine.extractRules(notice);
  const evaluation = engine.matchEligibility(profile, notice, structured, { evaluationAt: new Date().toISOString() });
  assert.ok(["ELIGIBLE", "CHECK_REQUIRED", "NOT_ELIGIBLE"].includes(evaluation.status));
  assert.ok(Number.isInteger(evaluation.totalScore) && evaluation.totalScore >= 0 && evaluation.totalScore <= 100);
  assert.equal(evaluation.breakdown.reduce((sum, item) => sum + item.score, 0), evaluation.totalScore);
  if (evaluation.status === "NOT_ELIGIBLE") {
    assert.ok(evaluation.unmatched.length > 0 || evaluation.reasons.some((reason) => /신청기간/.test(reason)), "탈락 판정에는 명시 근거가 필요합니다.");
  }
  return { notice, structured, evaluation };
});

const counts = Object.fromEntries(["ELIGIBLE", "CHECK_REQUIRED", "NOT_ELIGIBLE"].map((status) => [
  status,
  results.filter(({ evaluation }) => evaluation.status === status).length,
]));
const extractedRuleCount = results.reduce((sum, { structured }) => sum + structured.rules.length, 0);
const manualReviewCount = results.filter(({ evaluation }) => evaluation.status === "CHECK_REQUIRED").length;

console.log(JSON.stringify({
  sampleSize: results.length,
  counts,
  extractedRuleCount,
  manualReviewCount,
  invariantFalsePositiveCandidates: 0,
  note: "자연어 자격의 의미 정확도는 사람의 원문 표본 검토가 추가로 필요합니다.",
}, null, 2));
