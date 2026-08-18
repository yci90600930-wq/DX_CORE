(function initializeEligibilityEngine(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DXEligibilityEngine = Object.freeze(api);
})(typeof globalThis !== "undefined" ? globalThis : this, function eligibilityEngineFactory() {
  "use strict";

  const ENGINE_VERSION = "1.0.0";
  const TRUE = "TRUE";
  const FALSE = "FALSE";
  const UNKNOWN = "UNKNOWN";

  const SCORE_ITEMS = Object.freeze([
    { key: "target", label: "지원대상", weight: 25, dimensions: ["target"] },
    { key: "region", label: "지역", weight: 15, dimensions: ["region"] },
    { key: "industry", label: "업종", weight: 15, dimensions: ["industry", "industry_detail"] },
    { key: "company_size", label: "기업규모", weight: 10, dimensions: ["company_size"] },
    { key: "business_age", label: "업력", weight: 10, dimensions: ["business_age_months"] },
    { key: "support_purpose", label: "지원목적", weight: 15, dimensions: ["support_type"] },
    {
      key: "features",
      label: "인증 및 기업특성",
      weight: 5,
      dimensions: ["certification", "export_status", "export_amount_krw", "factory_registration", "government_restriction"],
    },
    { key: "application_period", label: "신청기간", weight: 5, dimensions: ["application_period"] },
  ]);

  const REGIONS = [
    "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기",
    "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
  ];

  const SUPPORT_PATTERNS = [
    ["policy_fund", /정책\s*자금|융자|대출|보증/],
    ["rnd", /R\s*[&＆]\s*D|연구개발|기술개발/i],
    ["smart_factory", /스마트\s*공장|스마트팩토리|제조혁신/],
    ["ai_dx", /인공지능|\bAI\b|디지털\s*전환|\bDX\b/i],
    ["automation", /자동화|자율제조/],
    ["export", /수출|해외진출|무역/],
    ["sales_channel", /판로|마케팅|유통/],
    ["workforce", /인력|고용|채용/],
    ["facility_equipment", /시설|설비|장비/],
    ["certification", /인증/],
    ["consulting", /컨설팅|상담/],
    ["esg_carbon_neutrality", /ESG|탄소\s*중립|에너지\s*효율/i],
    ["startup", /창업|예비창업/],
  ];

  const CERTIFICATION_PATTERNS = [
    ["venture", /벤처(?:기업)?/],
    ["innobiz", /이노비즈|INNO-?BIZ/i],
    ["mainbiz", /메인비즈|MAIN-?BIZ/i],
    ["women_owned", /여성기업/],
    ["disabled_owned", /장애인기업/],
    ["social_enterprise", /사회적기업/],
    ["corporate_research_institute", /기업부설연구소|기업\s*연구소/],
  ];

  function normalizeText(value) {
    return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  function normalizeKey(value) {
    return normalizeText(value).toLocaleLowerCase("ko-KR").replace(/[\s_-]+/g, "");
  }

  function splitSentences(text) {
    return normalizeText(text).split(/(?<=[.!?。])\s+|[;,，\n•·]+/).map(normalizeText).filter(Boolean);
  }

  function inferLevel(sentence) {
    if (/제외|불가|제한|지원할\s*수\s*없|신청할\s*수\s*없|해당하지\s*않/.test(sentence)) return "excluded";
    if (/우대|가점|우선\s*(?:지원|선정|대상)|평가\s*우선/.test(sentence)) return "preferred";
    if (/지원\s*대상|신청\s*대상|필수|한함|이어야|기업으로서|소재한|이내|이상|이하|미만|초과/.test(sentence)) return "required";
    return "unknown";
  }

  function confidenceFor(level, direct) {
    if (level === "unknown") return direct ? 0.45 : 0.3;
    return direct ? 0.9 : 0.72;
  }

  function parseKrw(numberText, unit) {
    const value = Number(String(numberText).replaceAll(",", ""));
    if (!Number.isFinite(value)) return null;
    if (unit === "억원" || unit === "억") return Math.round(value * 100000000);
    if (unit === "만원" || unit === "만") return Math.round(value * 10000);
    return Math.round(value);
  }

  function uniqueRules(rules) {
    const seen = new Set();
    return rules.filter((rule) => {
      const key = JSON.stringify([rule.dimension, rule.level, rule.operator, rule.value, rule.evidence]);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((rule, index) => ({ ...rule, id: `rule-${String(index + 1).padStart(3, "0")}` }));
  }

  function extractRules(notice) {
    const sources = [
      ["target", notice.target],
      ["summary", notice.summary],
      ["method", notice.method],
      ["title", notice.title],
      ["supportField", notice.supportField],
      ["hashtags", Array.isArray(notice.hashtags) ? notice.hashtags.join(" ") : notice.hashtags],
    ];
    const rules = [];

    function add(dimension, level, operator, value, evidence, sourceField, direct = true) {
      rules.push({
        dimension,
        level,
        operator,
        value,
        evidence,
        sourceField,
        confidence: confidenceFor(level, direct),
        extractionVersion: ENGINE_VERSION,
      });
    }

    sources.forEach(([sourceField, sourceText]) => {
      splitSentences(sourceText).forEach((sentence) => {
        const level = inferLevel(sentence);

        const foundRegions = REGIONS.filter((region) => new RegExp(`${region}(?:특별자치도|특별자치시|광역시|특별시|도|시)?`).test(sentence));
        if (foundRegions.length > 0 && foundRegions.length <= 3) {
          add("region", level, "in", foundRegions, sentence, sourceField);
        }

        const sizes = [];
        if (/소상공인/.test(sentence)) sizes.push("micro_business");
        if (/(?:^|[^중])소기업/.test(sentence)) sizes.push("small_enterprise");
        if (/중소기업/.test(sentence)) sizes.push("sme");
        if (/중견기업/.test(sentence)) sizes.push("mid_sized");
        if (sizes.length) add("company_size", level, "in", sizes, sentence, sourceField);

        const ageMatch = sentence.match(/(?:업력|창업|설립)\s*(\d+(?:\.\d+)?)\s*년\s*(이내|미만|이상|초과)/);
        if (ageMatch) {
          const months = Math.round(Number(ageMatch[1]) * 12);
          const operator = { 이내: "lte", 미만: "lt", 이상: "gte", 초과: "gt" }[ageMatch[2]];
          add("business_age_months", level, operator, months, sentence, sourceField);
        }

        const revenueMatch = sentence.match(/(?:매출액|매출)\s*(?:이\s*)?(\d[\d,.]*)\s*(억원|억|만원|만|원)\s*(이하|미만|이상|초과)/);
        if (revenueMatch) {
          const operator = { 이하: "lte", 미만: "lt", 이상: "gte", 초과: "gt" }[revenueMatch[3]];
          add("annual_revenue_krw", level, operator, parseKrw(revenueMatch[1], revenueMatch[2]), sentence, sourceField);
        }

        const employeeMatch = sentence.match(/(?:종업원|근로자|상시근로자)\s*(?:수)?\s*(\d[\d,]*)\s*명\s*(이하|미만|이상|초과)/);
        if (employeeMatch) {
          const operator = { 이하: "lte", 미만: "lt", 이상: "gte", 초과: "gt" }[employeeMatch[2]];
          add("employee_count", level, operator, Number(employeeMatch[1].replaceAll(",", "")), sentence, sourceField);
        }

        if (/제조업|제조기업/.test(sentence)) add("industry", level, "contains", "제조", sentence, sourceField);
        if (/정보통신업|소프트웨어업|건설업|도소매업|서비스업/.test(sentence)) {
          const industry = sentence.match(/정보통신업|소프트웨어업|건설업|도소매업|서비스업/)?.[0];
          if (industry) add("industry", level, "contains", industry.replace(/업$/, ""), sentence, sourceField);
        }

        if (/제조기업|제조업/.test(sentence)) add("target", level, "eq", { field: "is_manufacturer", value: true }, sentence, sourceField);
        if (/법인사업자|법인기업/.test(sentence)) add("target", level, "eq", { field: "entity_type", value: "corporation" }, sentence, sourceField);
        if (/개인사업자/.test(sentence)) add("target", level, "eq", { field: "entity_type", value: "sole_proprietor" }, sentence, sourceField);

        if (/수출기업|수출실적|수출\s*경험/.test(sentence)) add("export_status", level, "eq", true, sentence, sourceField);
        if (/공장등록/.test(sentence)) add("factory_registration", level, "eq", true, sentence, sourceField);

        CERTIFICATION_PATTERNS.forEach(([certification, pattern]) => {
          if (pattern.test(sentence)) add("certification", level, "includes", certification, sentence, sourceField);
        });

        if (/동일\s*사업\s*(?:수혜|참여)/.test(sentence) && level === "excluded" && !/제한\s*없|해당\s*없|제외하지\s*않/.test(sentence)) {
          add("government_restriction", "excluded", "eq", { field: "has_same_program_benefit", value: true }, sentence, sourceField);
        }
        if (/참여\s*제한/.test(sentence) && level === "excluded" && !/제한\s*(?:이\s*)?없|제한되지\s*않|해당\s*없/.test(sentence)) {
          add("government_restriction", "excluded", "eq", { field: "has_participation_restriction", value: true }, sentence, sourceField);
        }
      });
    });

    const purposeText = normalizeText([notice.title, notice.summary, notice.supportField, notice.category].join(" "));
    SUPPORT_PATTERNS.forEach(([supportType, pattern]) => {
      if (pattern.test(purposeText)) add("support_type", "preferred", "includes", supportType, purposeText.slice(0, 240), "combined", false);
    });

    return {
      version: ENGINE_VERSION,
      rules: uniqueRules(rules),
      complete: rules.every((rule) => rule.level !== "unknown"),
    };
  }

  function getProfileValue(profile, dimension, ruleValue, asOf) {
    const value = (...keys) => keys.map((key) => profile[key]).find((item) => item !== undefined);
    if (dimension === "region") {
      const regions = [value("head_office_region", "headOfficeRegion", "region"), value("factory_region", "factoryRegion")].filter(Boolean);
      return regions.length ? regions : undefined;
    }
    if (dimension === "industry") return value("industry");
    if (dimension === "industry_detail") return value("industry_detail", "industryDetail");
    if (dimension === "company_size") return value("company_size", "companySize");
    if (dimension === "annual_revenue_krw") return value("annual_revenue_krw", "annualRevenueKrw");
    if (dimension === "employee_count") return value("employee_count", "employeeCount");
    if (dimension === "export_status") return value("has_export_experience", "hasExportExperience");
    if (dimension === "factory_registration") return value("has_factory_registration", "hasFactoryRegistration");
    if (dimension === "support_type") return value("desired_support_types", "desiredSupportTypes") ?? [];
    if (dimension === "certification") {
      const certMap = {
        venture: ["is_venture_certified", "isVentureCertified"],
        innobiz: ["is_innobiz_certified", "isInnobizCertified"],
        mainbiz: ["is_mainbiz_certified", "isMainbizCertified"],
        women_owned: ["is_women_owned_certified", "isWomenOwnedCertified"],
        disabled_owned: ["is_disabled_owned_certified", "isDisabledOwnedCertified"],
        social_enterprise: ["is_social_enterprise", "isSocialEnterprise"],
        corporate_research_institute: ["has_corporate_research_institute", "hasCorporateResearchInstitute"],
      };
      return certMap[ruleValue] ? value(...certMap[ruleValue]) : undefined;
    }
    if (dimension === "target" || dimension === "government_restriction") return value(ruleValue?.field);
    if (dimension === "business_age_months") {
      const founded = value("founded_on", "foundedOn");
      if (!founded) return undefined;
      const from = new Date(`${String(founded).slice(0, 10)}T00:00:00Z`);
      const to = new Date(asOf);
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return undefined;
      let months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + to.getUTCMonth() - from.getUTCMonth();
      if (to.getUTCDate() < from.getUTCDate()) months -= 1;
      return Math.max(0, months);
    }
    return undefined;
  }

  function compare(actual, operator, expected) {
    if (actual === undefined || actual === null || expected === undefined || expected === null) return UNKNOWN;
    if (operator === "eq") return actual === expected ? TRUE : FALSE;
    if (operator === "in") {
      const actualValues = Array.isArray(actual) ? actual : [actual];
      return actualValues.some((item) => expected.includes(item)) ? TRUE : FALSE;
    }
    if (operator === "includes") return Array.isArray(actual)
      ? (actual.includes(expected) ? TRUE : FALSE)
      : (actual === true && expected ? TRUE : actual === false ? FALSE : UNKNOWN);
    if (operator === "contains") return normalizeKey(actual).includes(normalizeKey(expected)) ? TRUE : FALSE;
    if (operator === "lte") return Number(actual) <= Number(expected) ? TRUE : FALSE;
    if (operator === "gte") return Number(actual) >= Number(expected) ? TRUE : FALSE;
    if (operator === "lt") return Number(actual) < Number(expected) ? TRUE : FALSE;
    if (operator === "gt") return Number(actual) > Number(expected) ? TRUE : FALSE;
    return UNKNOWN;
  }

  function evaluateRule(rule, profile, asOf) {
    const expected = rule.value?.field ? rule.value.value : rule.value;
    const actual = getProfileValue(profile, rule.dimension, rule.value, asOf);
    const result = compare(actual, rule.operator, expected);
    return {
      ...rule,
      result,
      actual: actual === undefined ? null : actual,
      reason: result === TRUE
        ? `${rule.dimension} 조건을 충족합니다.`
        : result === FALSE
          ? `${rule.dimension} 조건과 일치하지 않습니다.`
          : `${rule.dimension} 조건은 기업정보 또는 공고 표현을 확인해야 합니다.`,
    };
  }

  function evaluateNode(node, profile, asOf) {
    if (!node) return { result: UNKNOWN, evaluations: [] };
    if (node.rules && Array.isArray(node.rules)) {
      const children = node.rules.map((child) => evaluateNode(child, profile, asOf));
      const values = children.map((child) => child.result);
      const operator = String(node.operator || "AND").toUpperCase();
      const result = operator === "OR"
        ? (values.includes(TRUE) ? TRUE : values.every((value) => value === FALSE) ? FALSE : UNKNOWN)
        : (values.includes(FALSE) ? FALSE : values.length && values.every((value) => value === TRUE) ? TRUE : UNKNOWN);
      return { result, evaluations: children.flatMap((child) => child.evaluations) };
    }
    const evaluation = evaluateRule(node, profile, asOf);
    return { result: evaluation.result, evaluations: [evaluation] };
  }

  function getNodeLevel(node) {
    if (!node?.rules) return node?.level || "unknown";
    const levels = [...new Set(node.rules.map(getNodeLevel))];
    return levels.length === 1 ? levels[0] : "unknown";
  }

  function evaluatePeriod(notice, evaluationAt) {
    const day = String(evaluationAt).slice(0, 10);
    if (notice.applicationStart && day < notice.applicationStart) return { result: FALSE, reason: "신청기간이 시작되지 않았습니다." };
    if (notice.applicationEnd && day > notice.applicationEnd) return { result: FALSE, reason: "신청기간이 종료되었습니다." };
    if (!notice.applicationStart && !notice.applicationEnd && !/상시|예산\s*소진/.test(notice.applicationPeriod || "")) {
      return { result: UNKNOWN, reason: "신청기간을 확인해야 합니다." };
    }
    return { result: TRUE, reason: "현재 신청기간에 포함됩니다." };
  }

  function getGrade(score) {
    if (score >= 90) return "적극 추천";
    if (score >= 75) return "지원 가능성 높음";
    if (score >= 60) return "조건 확인 필요";
    if (score >= 40) return "지원 가능성 낮음";
    return "추천 제외";
  }

  function calculateBreakdown(evaluations, period) {
    return SCORE_ITEMS.map((item) => {
      if (item.key === "application_period") {
        return { ...item, score: period.result === TRUE ? item.weight : 0, result: period.result, reason: period.reason };
      }
      const relevant = evaluations.filter((evaluation) => item.dimensions.includes(evaluation.dimension));
      if (!relevant.length) return { ...item, score: 0, result: UNKNOWN, reason: `${item.label} 조건을 확인할 수 없습니다.` };
      const blockingFalse = relevant.some((evaluation) =>
        (evaluation.level === "required" && evaluation.result === FALSE)
        || (evaluation.level === "excluded" && evaluation.result === TRUE)
        || (evaluation.level === "preferred" && evaluation.result === FALSE));
      const hasUnknown = relevant.some((evaluation) => evaluation.result === UNKNOWN || evaluation.level === "unknown");
      const result = blockingFalse ? FALSE : hasUnknown ? UNKNOWN : TRUE;
      return {
        ...item,
        score: result === TRUE ? item.weight : 0,
        result,
        reason: result === TRUE ? `${item.label} 조건이 일치합니다.` : result === FALSE ? `${item.label} 조건이 일치하지 않습니다.` : `${item.label} 조건을 확인해야 합니다.`,
      };
    });
  }

  function matchEligibility(profile, notice, structured, options = {}) {
    const evaluationAt = options.evaluationAt || new Date().toISOString();
    const rules = structured?.rules || extractRules(notice).rules;
    const nodes = structured?.groups || rules;
    const nodeResults = nodes.map((node) => evaluateNode(node, profile, evaluationAt));
    const rootResults = nodeResults.map((result, index) => ({ ...result, level: getNodeLevel(nodes[index]) }));
    const evaluations = nodeResults.flatMap((node) => node.evaluations);
    const period = evaluatePeriod(notice, evaluationAt);

    const hasRequiredFalse = rootResults.some((item) => item.level === "required" && item.result === FALSE);
    const hasExcludedTrue = rootResults.some((item) => item.level === "excluded" && item.result === TRUE);
    const hasUnknown = rules.length === 0
      || rootResults.some((item) => item.level === "unknown" || (["required", "excluded"].includes(item.level) && item.result === UNKNOWN));
    const periodClosed = period.result === FALSE;
    const status = periodClosed || hasRequiredFalse || hasExcludedTrue
      ? "NOT_ELIGIBLE"
      : hasUnknown || period.result === UNKNOWN
        ? "CHECK_REQUIRED"
        : "ELIGIBLE";

    const breakdown = calculateBreakdown(evaluations, period);
    const totalScore = breakdown.reduce((sum, item) => sum + item.score, 0);
    const matched = evaluations.filter((item) =>
      (item.level === "required" && item.result === TRUE) || (item.level === "excluded" && item.result === FALSE));
    const unmatched = evaluations.filter((item) =>
      (item.level === "required" && item.result === FALSE) || (item.level === "excluded" && item.result === TRUE));
    const unknown = evaluations.filter((item) => item.level === "unknown" || item.result === UNKNOWN);
    const preferred = {
      matched: evaluations.filter((item) => item.level === "preferred" && item.result === TRUE),
      unmatched: evaluations.filter((item) => item.level === "preferred" && item.result === FALSE),
      unknown: evaluations.filter((item) => item.level === "preferred" && item.result === UNKNOWN),
    };
    const reasons = [period.reason, ...unmatched.map((item) => item.reason), ...unknown.map((item) => item.reason), ...matched.map((item) => item.reason)];

    return {
      status,
      totalScore,
      grade: getGrade(totalScore),
      breakdown,
      matched,
      unmatched,
      unknown,
      preferred,
      reasons,
      engineVersion: ENGINE_VERSION,
      evaluatedAt: evaluationAt,
    };
  }

  return {
    ENGINE_VERSION,
    SCORE_ITEMS,
    TRUE,
    FALSE,
    UNKNOWN,
    extractRules,
    evaluateNode,
    getGrade,
    matchEligibility,
  };
});
