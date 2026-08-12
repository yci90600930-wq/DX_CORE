const SOURCE_CATALOG = {
  dataGoKr: {
    name: "공공데이터포털",
    shortName: "공공데이터포털",
    url: "https://www.data.go.kr/data/15157820/openapi.do",
  },
};

const CATEGORY_CATALOG = {
  "smart-factory": "스마트공장",
  "ai-ax": "AI·AX",
  dx: "DX",
  rnd: "R&D",
  "policy-fund": "정책자금",
  export: "수출",
  other: "기타",
};

const REGION_CATALOG = new Set([
  "전국", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
]);

const REGION_FILTER_CATALOG = {
  all: "전체",
  nationwide: "전국",
  seoul: "서울",
  busan: "부산",
  daegu: "대구",
  incheon: "인천",
  gwangju: "광주",
  daejeon: "대전",
  ulsan: "울산",
  sejong: "세종",
  gyeonggi: "경기",
  gangwon: "강원",
  chungbuk: "충북",
  chungnam: "충남",
  jeonbuk: "전북",
  jeonnam: "전남",
  gyeongbuk: "경북",
  gyeongnam: "경남",
  jeju: "제주",
};

const minute = 60 * 1000;
const hour = 60 * minute;
const NOTICE_API_URL = window.location.protocol === "file:"
  ? "https://dx-core-support-notices.yci90600930.chatgpt.site/api/notices"
  : "/api/notices";

let notices = [];

const state = {
  savedKeywords: [],
  searchKeywords: [],
  currentUser: null,
  selectedCategory: null,
  selectedRegion: null,
  refreshMinutes: 30,
  nextRefreshAt: null,
  refreshTimer: null,
  toastTimer: null,
  fetchedAt: null,
  dataStatus: "loading",
  todayPagination: { pageSize: 10, currentPage: 1 },
  openPagination: { pageSize: 10, currentPage: 1 },
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
  categoryFilters: document.querySelector(".source-logos"),
  regionFilters: document.querySelector("#region-filters"),
  activeFilters: document.querySelector("#active-filters"),
  openActiveFilters: document.querySelector("#open-active-filters"),
  emptyState: document.querySelector("#empty-state"),
  emptyReset: document.querySelector("#empty-reset"),
  clearSearch: document.querySelector("#clear-search"),
  todayPageSize: document.querySelector("#today-page-size"),
  todayPrev: document.querySelector("#today-prev"),
  todayPageStatus: document.querySelector("#today-page-status"),
  todayNext: document.querySelector("#today-next"),
  openPageSize: document.querySelector("#open-page-size"),
  openPrev: document.querySelector("#open-prev"),
  openPageStatus: document.querySelector("#open-page-status"),
  openNext: document.querySelector("#open-next"),
  toast: document.querySelector("#toast"),
  authOpenButton: document.querySelector("#auth-open-button"),
  accountStatus: document.querySelector("#account-status"),
  accountEmail: document.querySelector("#account-email"),
  signoutButton: document.querySelector("#signout-button"),
  keywordStorageBadge: document.querySelector("#keyword-storage-badge"),
  dataStatus: document.querySelector("#data-status"),
};

function normalizeText(value) {
  return String(value ?? "").toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
}

function parseKeywords(value) {
  return [...new Set(value.split(/[,，]/).map((item) => item.trim()).filter(Boolean))];
}

function deduplicateNotices(items) {
  const map = new Map();

  items.forEach((notice) => {
    const existing = map.get(notice.id);
    const noticeUpdatedAt = new Date(notice.updatedAt || notice.registeredAt).getTime();
    const existingUpdatedAt = existing
      ? new Date(existing.updatedAt || existing.registeredAt).getTime()
      : Number.NEGATIVE_INFINITY;

    if (!existing || noticeUpdatedAt > existingUpdatedAt) {
      map.set(notice.id, { ...notice, sources: [...notice.sources], mergedIds: [notice.id] });
    }
  });

  return [...map.values()].sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
}

function getNewNoticeWindow() {
  const end = state.fetchedAt ? new Date(state.fetchedAt) : new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function isNewNotice(notice) {
  const { start, end } = getNewNoticeWindow();
  const registered = new Date(notice.registeredAt);
  return registered >= start && registered <= end;
}

function matchesKeywords(notice, keywords) {
  if (!keywords.length) return true;
  const searchable = normalizeText(`${notice.title} ${(notice.body ?? []).join(" ")}`);
  return keywords.some((keyword) => searchable.includes(normalizeText(keyword)));
}

function getCategoryKey(notice) {
  return Object.entries(CATEGORY_CATALOG).find(([, label]) => label === notice.category)?.[0] ?? "other";
}

function matchesSelectedCategory(notice) {
  return !state.selectedCategory || getCategoryKey(notice) === state.selectedCategory;
}

function matchesSelectedRegion(notice) {
  if (!state.selectedRegion) return true;
  if (state.selectedRegion === "nationwide") {
    return notice.regions.length === 1 && notice.regions[0] === "전국";
  }
  return notice.regions.includes(REGION_FILTER_CATALOG[state.selectedRegion]);
}

function getVisibleNotices() {
  return notices.filter(
    (notice) => isNewNotice(notice)
      && matchesSelectedCategory(notice)
      && matchesSelectedRegion(notice)
      && matchesKeywords(notice, state.savedKeywords),
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
  const today = state.fetchedAt ? new Date(state.fetchedAt) : new Date();
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() <= 1970) return "등록일 확인 필요";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatTableDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() <= 1970) return "확인 필요";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
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
    resetPagination();
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
    resetPagination();
    renderSavedKeywords();
    renderResults();
    renderOpenNotices();
    await loadAccountKeywords();
    if (event !== "INITIAL_SESSION") showToast("로그인했습니다. 계정의 관심 키워드를 불러왔어요.");
  } else if (!nextUserId && previousUserId) {
    state.savedKeywords = [];
    resetPagination();
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

function resetPagination(target = "both") {
  if (target === "both" || target === "today") state.todayPagination.currentPage = 1;
  if (target === "both" || target === "open") state.openPagination.currentPage = 1;
}

function getPage(items, pagination) {
  const totalPages = items.length ? Math.ceil(items.length / pagination.pageSize) : 0;
  pagination.currentPage = totalPages
    ? Math.min(Math.max(pagination.currentPage, 1), totalPages)
    : 1;
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
  return {
    items: items.slice(startIndex, startIndex + pagination.pageSize),
    startIndex,
    totalPages,
  };
}

function renderPagination(pagination, totalItems, controls) {
  const totalPages = totalItems ? Math.ceil(totalItems / pagination.pageSize) : 0;
  if (controls.pageSize) controls.pageSize.value = String(pagination.pageSize);
  if (controls.status) {
    controls.status.textContent = totalPages
      ? `${pagination.currentPage} / ${totalPages} 페이지`
      : "0 / 0 페이지";
  }
  if (controls.prev) controls.prev.disabled = totalPages === 0 || pagination.currentPage <= 1;
  if (controls.next) controls.next.disabled = totalPages === 0 || pagination.currentPage >= totalPages;
}

function createTableRow(notice, rowNumber) {
  const row = document.createElement("tr");
  const appendCell = (label, content, className = "") => {
    const cell = document.createElement("td");
    cell.dataset.label = label;
    if (className) cell.className = className;
    if (content instanceof Node) cell.append(content);
    else cell.textContent = content;
    row.append(cell);
  };

  appendCell("번호", String(rowNumber), "notice-number-cell");
  appendCell("지원분야", notice.category, "notice-category-cell");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "notice-title-button";
  button.dataset.noticeId = notice.id;
  button.setAttribute("aria-label", `${notice.title} 상세 보기`);
  button.textContent = notice.title;
  appendCell("지원사업명", button, "notice-title-cell");
  appendCell("신청기간", notice.applicationPeriod, "notice-period-cell");

  const ministry = document.createElement("span");
  ministry.className = "notice-ministry-name";
  ministry.textContent = notice.ministry;
  const regions = document.createElement("span");
  regions.className = "notice-table-regions";
  regions.textContent = notice.regions.join(", ");
  const ministryRegion = document.createElement("span");
  ministryRegion.className = "notice-ministry-region";
  ministryRegion.append(ministry, document.createElement("br"), regions);
  appendCell("소관부처·지역", ministryRegion, "notice-ministry-cell");
  appendCell("사업수행기관", notice.agency || notice.applyName, "notice-agency-cell");
  appendCell("등록일", formatTableDate(notice.registeredAt), "notice-date-cell");
  appendCell("조회수", notice.viewCount.toLocaleString("ko-KR"), "notice-views-cell");

  return row;
}

function renderResults() {
  const visible = getVisibleNotices();
  const page = getPage(visible, state.todayPagination);
  elements.resultList.replaceChildren();
  elements.resultCount.textContent = visible.length;
  elements.emptyState.hidden = visible.length > 0;
  elements.resultList.hidden = visible.length === 0;
  const resultTable = elements.resultList.closest(".table-scroll-wrapper");
  if (resultTable) resultTable.hidden = visible.length === 0;

  if (state.savedKeywords.length) {
    elements.resultsEyebrow.textContent = "관심 키워드 신규 공고";
    elements.resultsTitle.textContent = "나를 위한 오늘의 공고";
  } else {
    elements.resultsEyebrow.textContent = "당일 정부지원사업 공고";
    elements.resultsTitle.textContent = "오늘의 신규 공고";
  }

  const hasFilters = state.savedKeywords.length > 0 || state.selectedCategory || state.selectedRegion;
  elements.activeFilters.hidden = !hasFilters;
  if (hasFilters) {
    const categoryFilter = state.selectedCategory
      ? `<span>분류: ${escapeHtml(CATEGORY_CATALOG[state.selectedCategory])}</span>`
      : "";
    const regionFilter = state.selectedRegion
      ? `<span>지역: ${escapeHtml(REGION_FILTER_CATALOG[state.selectedRegion])}</span>`
      : "";
    const filterNote = state.savedKeywords.length ? "제목·본문 중 하나 이상 포함" : "선택 조건 공고만 표시";
    elements.activeFilters.innerHTML = `<strong>적용 조건</strong>${categoryFilter}${regionFilter}${state.savedKeywords
      .map((keyword) => `<span># ${escapeHtml(keyword)}</span>`)
      .join("")}<small>${filterNote}</small>`;
  } else {
    elements.activeFilters.replaceChildren();
  }

  page.items.forEach((notice, index) => {
    elements.resultList.append(createTableRow(notice, visible.length - page.startIndex - index));
  });
  renderPagination(state.todayPagination, visible.length, {
    pageSize: elements.todayPageSize,
    prev: elements.todayPrev,
    status: elements.todayPageStatus,
    next: elements.todayNext,
  });
}

function renderOpenNotices() {
  const combinedKeywords = [...new Set([...state.savedKeywords, ...state.searchKeywords])];
  const availableNotices = getOpenNotices().filter(
    ({ notice }) => matchesSelectedCategory(notice)
      && matchesSelectedRegion(notice)
      && matchesKeywords(notice, combinedKeywords),
  );
  const page = getPage(availableNotices, state.openPagination);
  elements.openNoticeList.replaceChildren();
  elements.openNoticeCount.textContent = availableNotices.length;
  elements.openNoticeEmpty.hidden = availableNotices.length > 0;
  elements.openNoticeList.hidden = availableNotices.length === 0;
  const openNoticeTable = elements.openNoticeList.closest(".table-scroll-wrapper");
  if (openNoticeTable) openNoticeTable.hidden = availableNotices.length === 0;
  elements.clearSearch.hidden = state.searchKeywords.length === 0;

  const hasFilters = combinedKeywords.length > 0 || state.selectedCategory || state.selectedRegion;
  elements.openActiveFilters.hidden = !hasFilters;
  if (hasFilters) {
    const categoryFilter = state.selectedCategory
      ? `<span>분류: ${escapeHtml(CATEGORY_CATALOG[state.selectedCategory])}</span>`
      : "";
    const regionFilter = state.selectedRegion
      ? `<span>지역: ${escapeHtml(REGION_FILTER_CATALOG[state.selectedRegion])}</span>`
      : "";
    const filterNote = combinedKeywords.length ? "제목·본문 중 하나 이상 포함" : "선택 조건 공고만 표시";
    elements.openActiveFilters.innerHTML = `<strong>적용 조건</strong>${categoryFilter}${regionFilter}${combinedKeywords
      .map((keyword) => `<span># ${escapeHtml(keyword)}</span>`)
      .join("")}<small>${filterNote}</small>`;
  } else {
    elements.openActiveFilters.replaceChildren();
  }

  page.items.forEach(({ notice }, index) => {
    elements.openNoticeList.append(createTableRow(notice, availableNotices.length - page.startIndex - index));
  });
  renderPagination(state.openPagination, availableNotices.length, {
    pageSize: elements.openPageSize,
    prev: elements.openPrev,
    status: elements.openPageStatus,
    next: elements.openNext,
  });
}

function renderPeriod() {
  const { start, end } = getNewNoticeWindow();
  elements.periodLabel.textContent = `조회 ${formatDateTime(start)} ~ ${formatDateTime(end)}`;
  elements.todayLabel.textContent = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(end);
  elements.heroNewCount.textContent = notices.filter(
    (notice) => isNewNotice(notice) && matchesSelectedCategory(notice) && matchesSelectedRegion(notice),
  ).length;
  renderCategoryCounts();
  renderRegionCounts();
}

function setDataStatus(status, message) {
  state.dataStatus = status;
  elements.dataStatus.textContent = message;
}

function isNoticePayload(value) {
  return value
    && typeof value.id === "string"
    && typeof value.title === "string"
    && typeof value.summary === "string"
    && typeof value.registeredAt === "string"
    && typeof value.applicationPeriod === "string"
    && typeof value.ministry === "string"
    && typeof value.category === "string"
    && Number.isInteger(value.viewCount) && value.viewCount >= 0
    && Array.isArray(value.regions) && value.regions.length > 0
    && value.regions.every((region) => typeof region === "string" && REGION_CATALOG.has(region))
    && new Set(value.regions).size === value.regions.length
    && (!value.regions.includes("전국") || value.regions.length === 1)
    && typeof value.applyName === "string"
    && typeof value.applyUrl === "string"
    && typeof value.originalUrl === "string"
    && Array.isArray(value.body) && value.body.every((item) => typeof item === "string")
    && Array.isArray(value.sources) && value.sources.length === 1 && value.sources[0] === "dataGoKr"
    && Array.isArray(value.attachments) && value.attachments.every((item) => typeof item === "string")
    && Array.isArray(value.attachmentFiles)
    && value.attachmentFiles.every((file) => typeof file?.name === "string" && typeof file?.url === "string");
}

async function collectNotices({ announce = false, force = false } = {}) {
  setDataStatus("loading", "공식 공고를 확인하고 있습니다");

  try {
    const response = await fetch(force ? `${NOTICE_API_URL}?refresh=1` : NOTICE_API_URL, {
      headers: { Accept: "application/json" },
      cache: force ? "no-store" : "default",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "공식 공고를 불러오지 못했습니다.");

    const nextNotices = Array.isArray(payload.notices) ? payload.notices.filter(isNoticePayload) : [];
    notices = deduplicateNotices(nextNotices);
    state.fetchedAt = payload.fetchedAt || new Date().toISOString();
    resetPagination();
    setDataStatus("ready", `공공데이터포털 공식 공고 ${notices.length}건 확인`);
    renderResults();
    renderOpenNotices();
    renderPeriod();
    showDetailFromHash();
    if (announce) showToast(`공식 공고 ${notices.length}건을 다시 확인했어요.`);
  } catch (error) {
    const hasPreviousNotices = notices.length > 0;
    state.fetchedAt = new Date().toISOString();
    setDataStatus(
      "error",
      hasPreviousNotices
        ? "공식 API 연결이 지연되어 마지막 확인 결과를 표시합니다"
        : error.message || "공식 공고 연결을 확인해 주세요",
    );
    renderResults();
    renderOpenNotices();
    renderPeriod();
    if (announce) showToast("공식 공고를 다시 확인하지 못했습니다.");
  }
}

function renderCategoryFilters() {
  elements.categoryFilters.querySelectorAll("[data-category]").forEach((button) => {
    const category = button.dataset.category;
    const isAll = category === "all" || category === "";
    button.setAttribute("aria-pressed", String(isAll ? !state.selectedCategory : category === state.selectedCategory));
  });
}

function renderCategoryCounts() {
  const counts = Object.fromEntries(Object.keys(CATEGORY_CATALOG).map((categoryKey) => [categoryKey, 0]));
  counts.all = 0;

  getOpenNotices().forEach(({ notice, status }) => {
    if (status.className === "upcoming") return;
    counts.all += 1;
    counts[getCategoryKey(notice)] += 1;
  });

  elements.categoryFilters.querySelectorAll("[data-category-count]").forEach((countElement) => {
    const category = countElement.dataset.categoryCount || "all";
    countElement.textContent = counts[category] ?? 0;
  });
}

function renderRegionFilters() {
  if (!elements.regionFilters) return;
  elements.regionFilters.querySelectorAll("[data-region]").forEach((button) => {
    const region = button.dataset.region;
    const isAll = region === "all" || region === "";
    button.setAttribute("aria-pressed", String(isAll ? !state.selectedRegion : region === state.selectedRegion));
  });
}

function renderRegionCounts() {
  if (!elements.regionFilters) return;
  const counts = Object.fromEntries(Object.keys(REGION_FILTER_CATALOG).map((regionKey) => [regionKey, 0]));

  getOpenNotices().forEach(({ notice, status }) => {
    if (status.className === "upcoming" || !matchesSelectedCategory(notice)) return;
    counts.all += 1;
    if (notice.regions.length === 1 && notice.regions[0] === "전국") counts.nationwide += 1;
    Object.entries(REGION_FILTER_CATALOG).forEach(([regionKey, label]) => {
      if (regionKey !== "all" && regionKey !== "nationwide" && notice.regions.includes(label)) {
        counts[regionKey] += 1;
      }
    });
  });

  elements.regionFilters.querySelectorAll("[data-region-count]").forEach((countElement) => {
    const region = countElement.dataset.regionCount || "all";
    countElement.textContent = counts[region] ?? 0;
  });
}

function renderDetail(notice) {
  const originalLabel = "공공데이터포털 제공 원문 공고";
  const sourceLinks = `<li><a href="${escapeHtml(notice.originalUrl)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(originalLabel)}</span><span aria-hidden="true">↗</span></a></li>`;
  const attachmentContent = notice.attachmentFiles?.length
    ? `<ul class="source-link-list">${notice.attachmentFiles.map((file) => `<li><a href="${escapeHtml(file.url)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(file.name)}</span><span aria-hidden="true">↗</span></a></li>`).join("")}</ul>`
    : `<div class="attachment-note"><span aria-hidden="true">i</span><span><strong>${notice.attachments.map(escapeHtml).join(", ") || "첨부파일은 원문 공고에서 확인"}</strong><br />첨부파일의 내용은 키워드 검색 대상에 포함하지 않습니다.</span></div>`;

  elements.detailContent.innerHTML = `
    <article class="detail-card">
      <div class="detail-badges">
        <span class="notice-badge">${escapeHtml(notice.category)}</span>
        ${isNewNotice(notice) ? '<span class="notice-badge new">신규 공고</span>' : ""}
      </div>
      <div class="detail-heading-row">
        <h1 id="detail-title">${escapeHtml(notice.title)}</h1>
        <span class="detail-registered">등록 ${escapeHtml(formatRegisteredDate(notice.registeredAt))}</span>
      </div>
      <p class="detail-lead">${escapeHtml(notice.summary)}</p>

      <dl class="detail-info-grid">
        <div><dt>최종 관리 부처</dt><dd>${escapeHtml(notice.ministry)}</dd></div>
        <div><dt>지원 지역</dt><dd>${notice.regions.map(escapeHtml).join(", ")}</dd></div>
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
        ${attachmentContent}
      </section>

      <section class="detail-section">
        <h2>원문 공고 출처</h2>
        <ul class="source-link-list">${sourceLinks}</ul>
      </section>

      <div class="detail-actions">
        <a href="${escapeHtml(notice.originalUrl)}" target="_blank" rel="noopener noreferrer">원문 공고 페이지 보기 <span aria-hidden="true">↗</span></a>
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
  resetPagination();
  renderSavedKeywords();
  renderResults();
  renderOpenNotices();
  const storageLabel = state.currentUser ? "계정에 저장했어요." : "현재 페이지에 임시 저장했어요.";
  showToast(`${storedKeywords.map((keyword) => `#${keyword}`).join(", ")} ${storageLabel}`);
}

function clearSearch() {
  state.searchKeywords = [];
  resetPagination("open");
  elements.searchInput.value = "";
  renderOpenNotices();
}

function scheduleRefresh(showMessage = false) {
  if (state.refreshTimer) window.clearTimeout(state.refreshTimer);
  state.nextRefreshAt = new Date(Date.now() + state.refreshMinutes * minute);
  updateNextRefreshLabel();
  state.refreshTimer = window.setTimeout(async () => {
    await collectNotices({ announce: true });
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
  resetPagination("open");
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

elements.categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  const category = button.dataset.category;
  const nextCategory = category === "all" || category === "" ? null : category;
  state.selectedCategory = state.selectedCategory === nextCategory ? null : nextCategory;
  resetPagination();
  renderCategoryFilters();
  renderResults();
  renderOpenNotices();
  renderPeriod();
  const label = state.selectedCategory ? `${CATEGORY_CATALOG[state.selectedCategory]} 분류 공고만 표시합니다.` : "전체 분류 공고를 표시합니다.";
  showToast(label);
  document.querySelector(".results-section").scrollIntoView({ behavior: "smooth", block: "start" });
});

elements.categoryFilters.addEventListener("keydown", (event) => {
  const buttons = [...elements.categoryFilters.querySelectorAll("[data-category]")];
  const currentIndex = buttons.indexOf(event.target.closest("[data-category]"));
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

elements.regionFilters?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-region]");
  if (!button) return;
  const region = button.dataset.region;
  if (region !== "all" && region !== "" && !REGION_FILTER_CATALOG[region]) return;
  const nextRegion = region === "all" || region === "" ? null : region;
  state.selectedRegion = state.selectedRegion === nextRegion ? null : nextRegion;
  resetPagination();
  renderRegionFilters();
  renderResults();
  renderOpenNotices();
  renderPeriod();
  const label = state.selectedRegion
    ? `${REGION_FILTER_CATALOG[state.selectedRegion]} 지역 공고만 표시합니다.`
    : "전체 지역 공고를 표시합니다.";
  showToast(label);
  document.querySelector(".results-section").scrollIntoView({ behavior: "smooth", block: "start" });
});

elements.regionFilters?.addEventListener("keydown", (event) => {
  const buttons = [...elements.regionFilters.querySelectorAll("[data-region]")];
  const currentIndex = buttons.indexOf(event.target.closest("[data-region]"));
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
  resetPagination();
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

elements.todayPageSize?.addEventListener("change", () => {
  const pageSize = Number(elements.todayPageSize.value);
  if (![10, 20, 50, 100].includes(pageSize)) return;
  state.todayPagination.pageSize = pageSize;
  resetPagination("today");
  renderResults();
});

elements.todayPrev?.addEventListener("click", () => {
  state.todayPagination.currentPage -= 1;
  renderResults();
});

elements.todayNext?.addEventListener("click", () => {
  state.todayPagination.currentPage += 1;
  renderResults();
});

elements.openPageSize?.addEventListener("change", () => {
  const pageSize = Number(elements.openPageSize.value);
  if (![10, 20, 50, 100].includes(pageSize)) return;
  state.openPagination.pageSize = pageSize;
  resetPagination("open");
  renderOpenNotices();
});

elements.openPrev?.addEventListener("click", () => {
  state.openPagination.currentPage -= 1;
  renderOpenNotices();
});

elements.openNext?.addEventListener("click", () => {
  state.openPagination.currentPage += 1;
  renderOpenNotices();
});

elements.clearSearch.addEventListener("click", clearSearch);
elements.emptyReset.addEventListener("click", () => {
  if (state.selectedCategory) {
    state.selectedCategory = null;
    resetPagination();
    renderCategoryFilters();
    renderResults();
    renderOpenNotices();
    renderPeriod();
    showToast("전체 분류 공고를 표시합니다.");
    return;
  }
  if (state.selectedRegion) {
    state.selectedRegion = null;
    resetPagination();
    renderRegionFilters();
    renderResults();
    renderOpenNotices();
    renderPeriod();
    showToast("전체 지역 공고를 표시합니다.");
    return;
  }
  if (state.currentUser) {
    document.querySelector(".search-workspace").scrollIntoView({ behavior: "smooth", block: "start" });
    elements.keywordInput.focus();
    return;
  }
  state.savedKeywords = [];
  resetPagination();
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
renderCategoryFilters();
renderRegionFilters();
renderSavedKeywords();
renderResults();
renderOpenNotices();
renderAccountState();
scheduleRefresh();
showDetailFromHash();
const navigationEntry = performance.getEntriesByType?.("navigation")?.[0];
collectNotices({ force: navigationEntry?.type === "reload" });

window.DXAuth.initialize(handleAuthChange).catch((error) => {
  renderAccountState();
  showToast(`로그인 기능 초기화 실패: ${translateAuthError(error)}`);
});

window.addEventListener("beforeunload", () => window.DXAuth.destroy());
