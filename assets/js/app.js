const SOURCE_CATALOG = {
  mss: {
    name: "중소벤처기업부",
    shortName: "중기부",
    url: "https://www.mss.go.kr/site/smba/ex/bbs/List.do?cbIdx=310",
  },
  semas: {
    name: "소상공인시장진흥공단",
    shortName: "소진공",
    url: "https://www.semas.or.kr/",
  },
  bizinfo: {
    name: "기업마당",
    shortName: "기업마당",
    url: "https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/list.do",
  },
  smart: {
    name: "스마트공장 사업관리시스템",
    shortName: "스마트공장",
    url: "https://www.smart-factory.kr/",
  },
};

const now = new Date();
const minute = 60 * 1000;
const hour = 60 * minute;

function ago(minutes) {
  return new Date(now.getTime() - minutes * minute).toISOString();
}

function daysAgo(days, hourValue = 9) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(hourValue, 0, 0, 0);
  return date.toISOString();
}

const RAW_NOTICES = [
  {
    id: "smart-factory-advancement-2026",
    title: "2026년 스마트공장 구축 및 고도화 지원사업 참여기업 모집",
    summary: "제조 현장의 경쟁력 향상을 위해 자동화 설비와 제조 데이터 연계, 스마트공장 고도화 비용을 지원합니다.",
    body: [
      "중소·중견 제조기업의 생산성 향상과 제조 혁신을 위해 스마트공장 구축 및 고도화에 필요한 솔루션과 연동 설비 도입을 지원합니다.",
      "생산정보 디지털화, 공정 자동화, 설비 데이터 수집·분석을 추진하는 기업이 신청할 수 있으며 선정 기업은 수준별 구축 목표에 따라 사업비를 지원받습니다.",
    ],
    registeredAt: ago(32),
    applicationPeriod: "2026.08.04 ~ 2026.09.11",
    ministry: "중소벤처기업부",
    category: "스마트공장",
    sources: ["smart"],
    applyName: "스마트공장 사업관리시스템",
    applyUrl: SOURCE_CATALOG.smart.url,
    attachments: ["사업 공고문.pdf", "사업계획서 양식.hwp"],
  },
  {
    id: "manufacturing-ai-voucher-2026-bizinfo",
    title: "2026년 제조 AI 전환 바우처 지원사업 수요기업 모집",
    summary: "제조기업의 AI 솔루션 도입과 공정 데이터 활용을 위한 컨설팅·구축 비용을 바우처 방식으로 지원합니다.",
    body: [
      "제조기업이 공정 최적화, 품질 예측, 설비 이상 탐지 등에 AI를 활용할 수 있도록 전문 공급기업의 솔루션과 컨설팅 이용 비용을 지원합니다.",
      "국내 제조 중소기업을 대상으로 하며, 현장 진단을 거쳐 도입 목표와 데이터 활용 계획이 구체적인 기업을 우선 선정합니다.",
    ],
    registeredAt: ago(54),
    applicationPeriod: "2026.08.04 ~ 2026.08.28",
    ministry: "중소벤처기업부",
    category: "AI·디지털전환",
    sources: ["bizinfo"],
    applyName: "기업마당 온라인 접수 안내",
    applyUrl: SOURCE_CATALOG.bizinfo.url,
    attachments: ["공고문.pdf", "수요기업 신청서.hwp"],
  },
  {
    id: "manufacturing-ai-voucher-2026-mss",
    title: "2026년 제조 AI 전환 바우처 지원사업 수요기업 모집",
    summary: "제조기업의 AI 솔루션 도입과 공정 데이터 활용을 위한 컨설팅·구축 비용을 바우처 방식으로 지원합니다.",
    body: [
      "제조기업이 공정 최적화, 품질 예측, 설비 이상 탐지 등에 AI를 활용할 수 있도록 전문 공급기업의 솔루션과 컨설팅 이용 비용을 지원합니다.",
      "국내 제조 중소기업을 대상으로 하며, 현장 진단을 거쳐 도입 목표와 데이터 활용 계획이 구체적인 기업을 우선 선정합니다.",
    ],
    registeredAt: ago(49),
    applicationPeriod: "2026.08.04 ~ 2026.08.28",
    ministry: "중소벤처기업부",
    category: "AI·디지털전환",
    sources: ["mss"],
    applyName: "기업마당 온라인 접수 안내",
    applyUrl: SOURCE_CATALOG.bizinfo.url,
    attachments: ["공고문.pdf", "수요기업 신청서.hwp"],
  },
  {
    id: "policy-fund-emergency-2026",
    title: "2026년 3분기 중소기업 긴급경영안정자금 융자계획 공고",
    summary: "원자재 가격 상승과 일시적 경영애로를 겪는 중소기업을 대상으로 운전자금 융자를 지원합니다.",
    body: [
      "외부 요인으로 일시적 경영애로를 겪고 있으나 정상화 가능성이 높은 중소기업에 정책자금을 융자하여 경영 안정을 돕습니다.",
      "지원 대상과 융자 한도, 금리 조건은 기업 규모와 피해 유형에 따라 달라질 수 있으므로 세부 공고를 확인해야 합니다.",
    ],
    registeredAt: ago(76),
    applicationPeriod: "2026.08.05 ~ 예산 소진 시",
    ministry: "중소벤처기업부",
    category: "정책자금",
    sources: ["mss"],
    applyName: "중소벤처기업진흥공단 디지털지점",
    applyUrl: "https://www.kosmes.or.kr/sbc/SH/RET/SHRET010M0.do",
    attachments: ["융자계획 공고.pdf"],
  },
  {
    id: "small-manufacturer-energy-2026",
    title: "소공인 에너지효율 개선 지원사업 추가모집 공고",
    summary: "상시근로자 10인 미만 제조업체의 고효율 설비 교체와 에너지 사용 진단 비용을 지원합니다.",
    body: [
      "에너지 비용 부담이 큰 소공인을 대상으로 고효율 생산설비 교체와 에너지 절감 컨설팅 비용의 일부를 지원합니다.",
      "사업자등록증상 제조업을 영위하는 소공인이 신청할 수 있으며, 노후 설비의 개선 효과와 에너지 절감 계획을 평가합니다.",
    ],
    registeredAt: ago(101),
    applicationPeriod: "2026.08.04 ~ 2026.08.21",
    ministry: "중소벤처기업부",
    category: "소공인",
    sources: ["semas"],
    applyName: "소상공인24",
    applyUrl: "https://www.sbiz24.kr/",
    attachments: ["추가모집 공고문.pdf", "신청서식.hwp"],
  },
  {
    id: "export-manufacturing-package-2026",
    title: "제조 중소기업 수출바우처 패키지 참여기업 모집",
    summary: "해외시장 진출을 준비하는 제조 중소기업에 디자인, 인증, 물류, 마케팅 서비스를 패키지로 지원합니다.",
    body: [
      "수출 성장 가능성이 높은 제조 중소기업을 선정해 해외규격 인증, 제품 디자인, 국제운송, 현지 마케팅 등에 사용할 수 있는 바우처를 제공합니다.",
      "최근 수출 실적과 해외 진출 계획, 제품 경쟁력을 종합 평가하며 내수기업도 별도 트랙으로 신청할 수 있습니다.",
    ],
    registeredAt: ago(128),
    applicationPeriod: "2026.08.06 ~ 2026.09.02",
    ministry: "중소벤처기업부",
    category: "수출",
    sources: ["bizinfo"],
    applyName: "수출지원기반활용사업 포털",
    applyUrl: "https://www.exportvoucher.com/",
    attachments: ["참여기업 모집 공고.pdf"],
  },
  {
    id: "robot-demonstration-2026",
    title: "2026년 제조로봇 실증보급 지원사업 추가 공고",
    summary: "위험·반복 공정의 자동화를 추진하는 제조기업에 로봇 도입과 현장 실증 비용을 지원합니다.",
    body: [
      "제조 현장의 위험하고 반복적인 공정을 개선하기 위해 제조로봇 시스템의 설계, 제작, 설치 및 현장 실증 비용을 지원합니다.",
      "수요기업과 로봇 공급기업이 컨소시엄으로 참여하며 공정 개선 목표와 활용 계획을 중심으로 평가합니다.",
    ],
    registeredAt: ago(159),
    applicationPeriod: "2026.08.04 ~ 2026.09.04",
    ministry: "산업통상자원부",
    category: "공정자동화",
    sources: ["smart"],
    applyName: "스마트공장 사업관리시스템",
    applyUrl: SOURCE_CATALOG.smart.url,
    attachments: ["제조로봇 실증보급 공고.pdf", "컨소시엄 계획서.hwp"],
  },
  {
    id: "market-digital-2026",
    title: "소상공인 온라인 판로개척 패키지 3차 모집",
    summary: "온라인 판매를 시작하거나 확대하려는 소상공인에게 콘텐츠 제작과 채널 입점, 광고 비용을 지원합니다.",
    body: [
      "우수 상품을 보유한 소상공인이 온라인 시장에 진출하도록 상품 촬영, 상세페이지 제작, 플랫폼 입점과 디지털 광고를 단계별로 지원합니다.",
      "지원 분야별 수행기관과 매칭하여 진행하며 자부담 비율은 선택한 패키지에 따라 다릅니다.",
    ],
    registeredAt: ago(192),
    applicationPeriod: "2026.08.05 ~ 2026.08.25",
    ministry: "중소벤처기업부",
    category: "판로지원",
    sources: ["semas"],
    applyName: "판판대로",
    applyUrl: "https://fanfandaero.kr/",
    attachments: ["3차 모집 공고.pdf"],
  },
  {
    id: "cloud-solution-2026",
    title: "중소기업 클라우드 기반 업무혁신 솔루션 지원사업",
    summary: "중소기업의 업무 디지털화를 위해 클라우드형 ERP, 협업, 보안 솔루션 도입 비용을 지원합니다.",
    body: [
      "중소기업이 클라우드 기반 업무 솔루션을 도입하여 생산·재고·고객 관리를 효율화할 수 있도록 이용료와 초기 컨설팅을 지원합니다.",
      "공급 서비스 목록에서 필요한 솔루션을 선택하고 활용계획을 제출하여 신청할 수 있습니다.",
    ],
    registeredAt: daysAgo(4, 14),
    applicationPeriod: "2026.08.01 ~ 2026.08.29",
    ministry: "과학기술정보통신부",
    category: "디지털전환",
    sources: ["bizinfo"],
    applyName: "기업마당",
    applyUrl: SOURCE_CATALOG.bizinfo.url,
    attachments: ["지원사업 안내서.pdf"],
  },
  {
    id: "traditional-market-2026",
    title: "전통시장 안전관리 패키지 지원 대상 모집",
    summary: "전통시장 화재 예방과 안전한 영업환경 조성을 위해 노후 전기설비 개선과 안전점검을 지원합니다.",
    body: [
      "전통시장과 상점가의 노후 전기·소방 설비를 개선하고 정기 안전점검과 상인 교육을 지원합니다.",
      "시장 단위로 신청하며 사업 추진 동의율과 시설 노후도 등을 평가합니다.",
    ],
    registeredAt: daysAgo(7, 11),
    applicationPeriod: "2026.07.29 ~ 2026.08.19",
    ministry: "중소벤처기업부",
    category: "전통시장",
    sources: ["semas"],
    applyName: "소상공인시장진흥공단",
    applyUrl: SOURCE_CATALOG.semas.url,
    attachments: ["모집 안내.pdf"],
  },
];

const state = {
  savedKeywords: [],
  searchKeywords: [],
  currentUser: null,
  selectedSource: null,
  refreshMinutes: 30,
  nextRefreshAt: null,
  refreshTimer: null,
  toastTimer: null,
};

const elements = {
  homeView: document.querySelector("#home-view"),
  detailView: document.querySelector("#detail-view"),
  detailContent: document.querySelector("#detail-content"),
  backButton: document.querySelector("#back-button"),
  searchForm: document.querySelector("#search-form"),
  searchInput: document.querySelector("#search-input"),
  keywordForm: document.querySelector("#keyword-form"),
  keywordInput: document.querySelector("#keyword-input"),
  savedKeywords: document.querySelector("#saved-keywords"),
  refreshInterval: document.querySelector("#refresh-interval"),
  nextRefreshLabel: document.querySelector("#next-refresh-label"),
  periodLabel: document.querySelector("#period-label"),
  resultList: document.querySelector("#result-list"),
  resultCount: document.querySelector("#result-count"),
  openNoticeList: document.querySelector("#open-notice-list"),
  openNoticeCount: document.querySelector("#open-notice-count"),
  openNoticeEmpty: document.querySelector("#open-notice-empty"),
  resultsTitle: document.querySelector("#results-title"),
  resultsEyebrow: document.querySelector("#results-eyebrow"),
  heroNewCount: document.querySelector("#hero-new-count"),
  todayLabel: document.querySelector("#today-label"),
  sourceFilters: document.querySelector(".source-logos"),
  activeFilters: document.querySelector("#active-filters"),
  openActiveFilters: document.querySelector("#open-active-filters"),
  emptyState: document.querySelector("#empty-state"),
  emptyReset: document.querySelector("#empty-reset"),
  clearSearch: document.querySelector("#clear-search"),
  template: document.querySelector("#result-card-template"),
  toast: document.querySelector("#toast"),
  authOpenButton: document.querySelector("#auth-open-button"),
  accountStatus: document.querySelector("#account-status"),
  accountEmail: document.querySelector("#account-email"),
  signoutButton: document.querySelector("#signout-button"),
  keywordStorageBadge: document.querySelector("#keyword-storage-badge"),
};

function normalizeText(value) {
  return value.toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
}

function parseKeywords(value) {
  return [...new Set(value.split(/[,，]/).map((item) => item.trim()).filter(Boolean))];
}

function deduplicateNotices(items) {
  const map = new Map();

  items.forEach((notice) => {
    const key = `${normalizeText(notice.title)}::${normalizeText(notice.applicationPeriod)}`;
    if (!map.has(key)) {
      map.set(key, { ...notice, sources: [...notice.sources], mergedIds: [notice.id] });
      return;
    }

    const existing = map.get(key);
    existing.sources = [...new Set([...existing.sources, ...notice.sources])];
    existing.mergedIds.push(notice.id);
    if (new Date(notice.registeredAt) > new Date(existing.registeredAt)) {
      existing.registeredAt = notice.registeredAt;
    }
  });

  return [...map.values()].sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
}

const notices = deduplicateNotices(RAW_NOTICES);

function getNewNoticeWindow() {
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  return { start, end: now };
}

function isNewNotice(notice) {
  const { start, end } = getNewNoticeWindow();
  const registered = new Date(notice.registeredAt);
  return registered >= start && registered <= end;
}

function matchesKeywords(notice, keywords) {
  if (!keywords.length) return true;
  const searchable = normalizeText(`${notice.title} ${notice.body.join(" ")}`);
  return keywords.some((keyword) => searchable.includes(normalizeText(keyword)));
}

function matchesSelectedSource(notice) {
  return !state.selectedSource || notice.sources.includes(state.selectedSource);
}

function getVisibleNotices() {
  return notices.filter(
    (notice) => isNewNotice(notice) && matchesSelectedSource(notice) && matchesKeywords(notice, state.savedKeywords),
  );
}

function parsePeriodDate(value) {
  const match = value.match(/(\d{4})\.(\d{2})\.(\d{2})/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function getApplicationStatus(notice) {
  const periodParts = notice.applicationPeriod.split("~").map((part) => part.trim());
  const startDate = parsePeriodDate(periodParts[0]);
  const endText = periodParts.at(-1);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (/예산\s*소진|상시/.test(endText)) {
    return { isAvailable: true, label: "접수 중", className: "open", sortValue: Number.MAX_SAFE_INTEGER };
  }

  const endDate = parsePeriodDate(endText);
  if (!endDate || endDate < today) {
    return { isAvailable: false, label: "접수 마감", className: "", sortValue: 0 };
  }

  if (startDate && startDate > today) {
    return {
      isAvailable: true,
      label: "접수 예정",
      className: "upcoming",
      sortValue: endDate.getTime(),
    };
  }

  const remainingDays = Math.round((endDate.getTime() - today.getTime()) / (24 * hour));
  return {
    isAvailable: true,
    label: remainingDays === 0 ? "오늘 마감" : `마감 D-${remainingDays}`,
    className: remainingDays <= 7 ? "deadline" : "open",
    sortValue: endDate.getTime(),
  };
}

function getOpenNotices() {
  return notices
    .map((notice) => ({ notice, status: getApplicationStatus(notice) }))
    .filter(({ status }) => status.isAvailable)
    .sort((a, b) => a.status.sortValue - b.status.sortValue);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

function formatRegisteredDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function translateAuthError(error) {
  const message = error?.message ?? "";
  if (message === "SUPABASE_NOT_CONFIGURED") return "Supabase 연결 정보가 필요합니다.";
  if (/invalid login credentials/i.test(message)) return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (/email not confirmed/i.test(message)) return "이메일 확인을 완료한 뒤 로그인해 주세요.";
  if (/user already registered/i.test(message)) return "이미 가입된 이메일입니다.";
  if (/password should be/i.test(message)) return "비밀번호는 8자 이상 입력해 주세요.";
  if (/duplicate key|23505/i.test(message) || error?.code === "23505") return "이미 저장된 관심 키워드입니다.";
  return message || "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function renderAccountState() {
  const isSignedIn = Boolean(state.currentUser);
  elements.authOpenButton.hidden = isSignedIn;
  elements.accountStatus.hidden = !isSignedIn;
  elements.accountEmail.textContent = state.currentUser?.email ?? "";
  elements.keywordStorageBadge.textContent = isSignedIn ? "계정에 저장됨" : "이 페이지에서만 저장";
  elements.emptyReset.textContent = isSignedIn ? "관심 키워드 수정" : "오늘 공고 전체 보기";
}

async function loadAccountKeywords() {
  try {
    const keywords = await window.DXAuth.loadKeywords();
    state.savedKeywords = [...new Set(keywords)];
    renderSavedKeywords();
    renderResults();
    renderOpenNotices();
  } catch (error) {
    showToast(`관심 키워드를 불러오지 못했습니다: ${translateAuthError(error)}`);
  }
}

async function handleAuthChange({ event, user }) {
  if (event === "UNCONFIGURED") {
    renderAccountState();
    return;
  }

  if (event === "PASSWORD_RECOVERY") {
    const recoveryUrl = new URL("login.html", window.location.href);
    recoveryUrl.searchParams.set("mode", "recovery");
    window.location.replace(recoveryUrl.href);
    return;
  }

  const previousUserId = state.currentUser?.id ?? null;
  const nextUserId = user?.id ?? null;
  state.currentUser = user ?? null;
  renderAccountState();

  if (nextUserId && previousUserId !== nextUserId) {
    state.savedKeywords = [];
    renderSavedKeywords();
    renderResults();
    renderOpenNotices();
    await loadAccountKeywords();
    if (event !== "INITIAL_SESSION") showToast("로그인했습니다. 계정의 관심 키워드를 불러왔어요.");
  } else if (!nextUserId && previousUserId) {
    state.savedKeywords = [];
    renderSavedKeywords();
    renderResults();
    renderOpenNotices();
    showToast("로그아웃했습니다.");
  }
}

function renderSavedKeywords() {
  elements.savedKeywords.replaceChildren();

  state.savedKeywords.forEach((keyword) => {
    const chip = document.createElement("span");
    chip.className = "keyword-chip";
    chip.append(`# ${keyword}`);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `${keyword} 관심 키워드 삭제`);
    removeButton.dataset.removeKeyword = keyword;
    removeButton.textContent = "×";
    chip.append(removeButton);
    elements.savedKeywords.append(chip);
  });
}

function createBadge(text, className = "") {
  const badge = document.createElement("span");
  badge.className = `notice-badge ${className}`.trim();
  badge.textContent = text;
  return badge;
}

function renderResults() {
  const visible = getVisibleNotices();
  elements.resultList.replaceChildren();
  elements.resultCount.textContent = visible.length;
  elements.emptyState.hidden = visible.length > 0;
  elements.resultList.hidden = visible.length === 0;

  if (state.savedKeywords.length) {
    elements.resultsEyebrow.textContent = "관심 키워드 신규 공고";
    elements.resultsTitle.textContent = "나를 위한 오늘의 공고";
  } else {
    elements.resultsEyebrow.textContent = "당일 정부지원사업 공고";
    elements.resultsTitle.textContent = "오늘의 신규 공고";
  }

  const hasFilters = state.savedKeywords.length > 0 || state.selectedSource;
  elements.activeFilters.hidden = !hasFilters;
  if (hasFilters) {
    const sourceFilter = state.selectedSource
      ? `<span>기관: ${escapeHtml(SOURCE_CATALOG[state.selectedSource].shortName)}</span>`
      : "";
    const filterNote = state.savedKeywords.length ? "제목·본문 중 하나 이상 포함" : "선택 기관 공고만 표시";
    elements.activeFilters.innerHTML = `<strong>적용 조건</strong>${sourceFilter}${state.savedKeywords
      .map((keyword) => `<span># ${escapeHtml(keyword)}</span>`)
      .join("")}<small>${filterNote}</small>`;
  } else {
    elements.activeFilters.replaceChildren();
  }

  visible.forEach((notice) => {
    const card = elements.template.content.cloneNode(true);
    const button = card.querySelector(".notice-card-button");
    const badges = card.querySelector(".notice-badges");
    button.dataset.noticeId = notice.id;
    button.setAttribute("aria-label", `${notice.title} 상세 보기`);
    badges.append(createBadge(notice.category));
    if (isNewNotice(notice)) badges.append(createBadge("신규", "new"));
    if (notice.sources.length > 1) badges.append(createBadge(`${notice.sources.length}개 공고 통합`, "merged"));
    card.querySelector(".registered-date").textContent = `등록 ${formatRegisteredDate(notice.registeredAt)}`;
    card.querySelector(".notice-title").textContent = notice.title;
    card.querySelector(".notice-summary").textContent = notice.summary;
    card.querySelector(".notice-ministry").textContent = notice.ministry;
    card.querySelector(".notice-period").textContent = notice.applicationPeriod;
    card.querySelector(".notice-apply").textContent = notice.applyName;
    elements.resultList.append(card);
  });
}

function renderOpenNotices() {
  const combinedKeywords = [...new Set([...state.savedKeywords, ...state.searchKeywords])];
  const availableNotices = getOpenNotices().filter(
    ({ notice }) => matchesSelectedSource(notice) && matchesKeywords(notice, combinedKeywords),
  );
  elements.openNoticeList.replaceChildren();
  elements.openNoticeCount.textContent = availableNotices.length;
  elements.openNoticeEmpty.hidden = availableNotices.length > 0;
  elements.openNoticeList.hidden = availableNotices.length === 0;
  elements.clearSearch.hidden = state.searchKeywords.length === 0;

  const hasFilters = combinedKeywords.length > 0 || state.selectedSource;
  elements.openActiveFilters.hidden = !hasFilters;
  if (hasFilters) {
    const sourceFilter = state.selectedSource
      ? `<span>기관: ${escapeHtml(SOURCE_CATALOG[state.selectedSource].shortName)}</span>`
      : "";
    const filterNote = combinedKeywords.length ? "제목·본문 중 하나 이상 포함" : "선택 기관 공고만 표시";
    elements.openActiveFilters.innerHTML = `<strong>적용 조건</strong>${sourceFilter}${combinedKeywords
      .map((keyword) => `<span># ${escapeHtml(keyword)}</span>`)
      .join("")}<small>${filterNote}</small>`;
  } else {
    elements.openActiveFilters.replaceChildren();
  }

  availableNotices.forEach(({ notice, status }) => {
    const card = elements.template.content.cloneNode(true);
    const button = card.querySelector(".notice-card-button");
    const badges = card.querySelector(".notice-badges");
    button.dataset.noticeId = notice.id;
    button.setAttribute("aria-label", `${notice.title} 상세 보기`);
    badges.append(createBadge(status.label, status.className));
    badges.append(createBadge(notice.category));
    if (notice.sources.length > 1) badges.append(createBadge(`${notice.sources.length}개 공고 통합`, "merged"));
    card.querySelector(".registered-date").textContent = `등록 ${formatRegisteredDate(notice.registeredAt)}`;
    card.querySelector(".notice-title").textContent = notice.title;
    card.querySelector(".notice-summary").textContent = notice.summary;
    card.querySelector(".notice-ministry").textContent = notice.ministry;
    card.querySelector(".notice-period").textContent = notice.applicationPeriod;
    card.querySelector(".notice-apply").textContent = notice.applyName;
    elements.openNoticeList.append(card);
  });
}

function renderPeriod() {
  const { start, end } = getNewNoticeWindow();
  elements.periodLabel.textContent = `조회 ${formatDateTime(start)} ~ ${formatDateTime(end)}`;
  elements.todayLabel.textContent = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(now);
  elements.heroNewCount.textContent = notices.filter(
    (notice) => isNewNotice(notice) && matchesSelectedSource(notice),
  ).length;
  renderSourceCounts();
}

function renderSourceFilters() {
  elements.sourceFilters.querySelectorAll("[data-source]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.source === state.selectedSource));
  });
}

function renderSourceCounts() {
  const counts = Object.fromEntries(Object.keys(SOURCE_CATALOG).map((sourceKey) => [sourceKey, 0]));

  getOpenNotices().forEach(({ notice, status }) => {
    if (status.className === "upcoming") return;
    notice.sources.forEach((sourceKey) => {
      if (sourceKey in counts) counts[sourceKey] += 1;
    });
  });

  elements.sourceFilters.querySelectorAll("[data-source-count]").forEach((countElement) => {
    countElement.textContent = counts[countElement.dataset.sourceCount] ?? 0;
  });
}

function renderDetail(notice) {
  const sourceLinks = notice.sources
    .map((sourceKey) => {
      const source = SOURCE_CATALOG[sourceKey];
      return `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(source.name)} 공고 페이지</span><span aria-hidden="true">↗</span></a></li>`;
    })
    .join("");
  const mergedBadge = notice.sources.length > 1
    ? `<span class="notice-badge merged">${notice.sources.length}개 출처 통합</span>`
    : "";

  elements.detailContent.innerHTML = `
    <article class="detail-card">
      <div class="detail-badges">
        <span class="notice-badge">${escapeHtml(notice.category)}</span>
        ${isNewNotice(notice) ? '<span class="notice-badge new">신규 공고</span>' : ""}
        ${mergedBadge}
      </div>
      <div class="detail-heading-row">
        <h1 id="detail-title">${escapeHtml(notice.title)}</h1>
        <span class="detail-registered">등록 ${escapeHtml(formatRegisteredDate(notice.registeredAt))}</span>
      </div>
      <p class="detail-lead">${escapeHtml(notice.summary)}</p>

      <dl class="detail-info-grid">
        <div><dt>최종 관리 부처</dt><dd>${escapeHtml(notice.ministry)}</dd></div>
        <div><dt>사업 접수 기간</dt><dd>${escapeHtml(notice.applicationPeriod)}</dd></div>
        <div><dt>접수 사이트</dt><dd>${escapeHtml(notice.applyName)}</dd></div>
      </dl>

      <section class="detail-section">
        <h2>공고문</h2>
        ${notice.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      </section>

      <section class="detail-section">
        <h2>접수 안내</h2>
        <p>접수 기간과 제출 서류를 확인한 뒤 아래 접수 사이트에서 신청해 주세요. 접수 정보는 변경될 수 있으므로 신청 전에 원문 공고를 다시 확인하세요.</p>
        <a class="apply-link" href="${escapeHtml(notice.applyUrl)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(notice.applyName)}에서 접수하기</span><span aria-hidden="true">↗</span></a>
      </section>

      <section class="detail-section">
        <h2>첨부파일</h2>
        <div class="attachment-note"><span aria-hidden="true">i</span><span><strong>${notice.attachments.map(escapeHtml).join(", ")}</strong><br />첨부파일의 내용은 키워드 검색 대상에 포함하지 않습니다.</span></div>
      </section>

      <section class="detail-section">
        <h2>원문 공고 출처</h2>
        <ul class="source-link-list">${sourceLinks}</ul>
      </section>

      <div class="detail-actions">
        <a href="${escapeHtml(SOURCE_CATALOG[notice.sources[0]].url)}" target="_blank" rel="noopener noreferrer">원문 공고 페이지 보기 <span aria-hidden="true">↗</span></a>
        <a class="secondary" href="${escapeHtml(notice.applyUrl)}" target="_blank" rel="noopener noreferrer">접수 사이트 보기</a>
      </div>
    </article>`;
}

function showDetailFromHash() {
  const match = window.location.hash.match(/^#notice=(.+)$/);
  if (!match) {
    elements.detailView.hidden = true;
    elements.homeView.hidden = false;
    document.title = "DX CORE 정부 지원사업 알리미";
    return;
  }

  const id = decodeURIComponent(match[1]);
  const notice = notices.find((item) => item.id === id || item.mergedIds.includes(id));
  if (!notice) {
    window.location.hash = "";
    return;
  }

  renderDetail(notice);
  elements.homeView.hidden = true;
  elements.detailView.hidden = false;
  document.title = `${notice.title} | DX CORE`;
  window.scrollTo({ top: 0, behavior: "auto" });
}

async function addKeywords(keywords) {
  const uniqueNewKeywords = keywords.filter(
    (keyword) => !state.savedKeywords.some((saved) => normalizeText(saved) === normalizeText(keyword)),
  );

  if (!uniqueNewKeywords.length) {
    showToast("이미 저장된 키워드예요.");
    return;
  }

  const storedKeywords = [];
  for (const keyword of uniqueNewKeywords) {
    try {
      if (state.currentUser) await window.DXAuth.addKeyword(keyword);
      storedKeywords.push(keyword);
    } catch (error) {
      showToast(`#${keyword} 저장 실패: ${translateAuthError(error)}`);
      break;
    }
  }

  if (!storedKeywords.length) return;
  state.savedKeywords.push(...storedKeywords);
  renderSavedKeywords();
  renderResults();
  renderOpenNotices();
  const storageLabel = state.currentUser ? "계정에 저장했어요." : "현재 페이지에 임시 저장했어요.";
  showToast(`${storedKeywords.map((keyword) => `#${keyword}`).join(", ")} ${storageLabel}`);
}

function clearSearch() {
  state.searchKeywords = [];
  elements.searchInput.value = "";
  renderOpenNotices();
}

function scheduleRefresh(showMessage = false) {
  if (state.refreshTimer) window.clearTimeout(state.refreshTimer);
  state.nextRefreshAt = new Date(Date.now() + state.refreshMinutes * minute);
  updateNextRefreshLabel();
  state.refreshTimer = window.setTimeout(() => {
    renderResults();
    renderOpenNotices();
    renderPeriod();
    showToast("새 공고를 다시 확인했어요.");
    scheduleRefresh();
  }, state.refreshMinutes * minute);

  if (showMessage) showToast(`${state.refreshMinutes}분 간격으로 새 공고를 확인합니다.`);
}

function updateNextRefreshLabel() {
  if (!state.nextRefreshAt) return;
  elements.nextRefreshLabel.textContent = `다음 확인 ${new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(state.nextRefreshAt)}`;
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  state.toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 2600);
}

elements.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const keywords = parseKeywords(elements.searchInput.value);
  if (!keywords.length) {
    showToast("검색할 핵심 키워드를 입력해 주세요.");
    elements.searchInput.focus();
    return;
  }
  state.searchKeywords = keywords;
  renderOpenNotices();
  document.querySelector(".open-notices-section").scrollIntoView({ behavior: "smooth", block: "start" });
});

elements.keywordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const keywords = parseKeywords(elements.keywordInput.value);
  if (!keywords.length) {
    showToast("저장할 관심 키워드를 입력해 주세요.");
    elements.keywordInput.focus();
    return;
  }
  addKeywords(keywords);
  elements.keywordInput.value = "";
});

document.querySelector(".suggested-keywords").addEventListener("click", (event) => {
  const button = event.target.closest("[data-keyword]");
  if (button) addKeywords([button.dataset.keyword]);
});

elements.sourceFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-source]");
  if (!button) return;
  state.selectedSource = state.selectedSource === button.dataset.source ? null : button.dataset.source;
  renderSourceFilters();
  renderResults();
  renderOpenNotices();
  renderPeriod();
  const label = state.selectedSource ? `${SOURCE_CATALOG[state.selectedSource].shortName} 공고만 표시합니다.` : "전체 기관 공고를 표시합니다.";
  showToast(label);
  document.querySelector(".results-section").scrollIntoView({ behavior: "smooth", block: "start" });
});

elements.sourceFilters.addEventListener("keydown", (event) => {
  const buttons = [...elements.sourceFilters.querySelectorAll("[data-source]")];
  const currentIndex = buttons.indexOf(event.target.closest("[data-source]"));
  if (currentIndex < 0) return;

  let nextIndex = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % buttons.length;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = buttons.length - 1;
  if (nextIndex === null) return;

  event.preventDefault();
  buttons[nextIndex].focus();
});

elements.savedKeywords.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-remove-keyword]");
  if (!button) return;
  if (state.currentUser) {
    button.disabled = true;
    try {
      await window.DXAuth.removeKeyword(button.dataset.removeKeyword);
    } catch (error) {
      button.disabled = false;
      showToast(`키워드 삭제 실패: ${translateAuthError(error)}`);
      return;
    }
  }
  state.savedKeywords = state.savedKeywords.filter((keyword) => keyword !== button.dataset.removeKeyword);
  renderSavedKeywords();
  renderResults();
  renderOpenNotices();
  showToast(`#${button.dataset.removeKeyword} 키워드를 삭제했어요.`);
});

elements.refreshInterval.addEventListener("change", () => {
  state.refreshMinutes = Number(elements.refreshInterval.value);
  scheduleRefresh(true);
});

elements.resultList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-notice-id]");
  if (button) window.location.hash = `notice=${encodeURIComponent(button.dataset.noticeId)}`;
});

elements.openNoticeList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-notice-id]");
  if (button) window.location.hash = `notice=${encodeURIComponent(button.dataset.noticeId)}`;
});

elements.clearSearch.addEventListener("click", clearSearch);
elements.emptyReset.addEventListener("click", () => {
  if (state.selectedSource) {
    state.selectedSource = null;
    renderSourceFilters();
    renderResults();
    renderOpenNotices();
    renderPeriod();
    showToast("전체 기관 공고를 표시합니다.");
    return;
  }
  if (state.currentUser) {
    document.querySelector(".search-workspace").scrollIntoView({ behavior: "smooth", block: "start" });
    elements.keywordInput.focus();
    return;
  }
  state.savedKeywords = [];
  renderSavedKeywords();
  renderResults();
  renderOpenNotices();
});

elements.backButton.addEventListener("click", () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.hash = "";
  }
});

elements.signoutButton.addEventListener("click", async () => {
  elements.signoutButton.disabled = true;
  try {
    const { error } = await window.DXAuth.signOut();
    if (error) throw error;
  } catch (error) {
    showToast(`로그아웃 실패: ${translateAuthError(error)}`);
  } finally {
    elements.signoutButton.disabled = false;
  }
});

window.addEventListener("hashchange", showDetailFromHash);

renderPeriod();
renderSourceFilters();
renderSavedKeywords();
renderResults();
renderOpenNotices();
renderAccountState();
scheduleRefresh();
showDetailFromHash();

window.DXAuth.initialize(handleAuthChange).catch((error) => {
  renderAccountState();
  showToast(`로그인 기능 초기화 실패: ${translateAuthError(error)}`);
});

window.addEventListener("beforeunload", () => window.DXAuth.destroy());
