const BIZINFO_API_URL = "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do";
const MSS_LIST_URL = "https://www.mss.go.kr/site/smba/ex/bbs/List.do?cbIdx=310";
const SEMAS_LIST_URL = "https://www.semas.or.kr/web/board/webBoardList.kmdc?bCd=2001&pNm=BOA0121";
const SMART_LIST_URL = "https://www.smart-factory.kr/usr/bg/ba/ma/bsnsPbanc/selectBsnsPbancPage.do";
const ALLOWED_STATIC_PATHS = new Set(["/index.html", "/login.html"]);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  headers.set("x-frame-options", "DENY");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/\s+/g, " ")
    .trim();
}

function safeHttpUrl(value, fallback = "https://www.bizinfo.go.kr/") {
  try {
    const url = new URL(String(value ?? ""));
    return ["http:", "https:"].includes(url.protocol) ? url.href : fallback;
  } catch {
    return fallback;
  }
}

function formatPeriod(value) {
  const text = cleanText(value);
  if (!text) return "접수기간 확인 필요";
  return text.replace(/(\d{4})[.-]?(\d{2})[.-]?(\d{2})/g, "$1.$2.$3");
}

function getPeriodEndKey(period) {
  if (/상시|예산\s*소진/.test(period)) return "99999999";
  const matches = [...period.matchAll(/(\d{4})\.(\d{2})\.(\d{2})/g)];
  if (!matches.length) return null;
  const last = matches.at(-1);
  return `${last[1]}${last[2]}${last[3]}`;
}

function todayInSeoul() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}`;
}

function toIsoDate(value) {
  const text = cleanText(value);
  if (!text) return new Date(0).toISOString();
  const compactMatch = text.match(/^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?$/);
  if (compactMatch) {
    const [, year, month, day, hours = "00", minutes = "00", seconds = "00"] = compactMatch;
    return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}+09:00`).toISOString();
  }
  const normalized = text
    .replace(/^(\d{4})[.]?(\d{2})[.]?(\d{2})$/, "$1-$2-$3")
    .replace(" ", "T");
  const withZone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized)
    ? `${normalized}+09:00`
    : normalized;
  const date = new Date(withZone);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function getApiItems(payload) {
  if (Array.isArray(payload)) return payload;
  const jsonArray = payload?.jsonArray ?? payload;
  if (Array.isArray(jsonArray)) return jsonArray;
  const items = jsonArray?.item;
  if (Array.isArray(items)) return items;
  return items && typeof items === "object" ? [items] : [];
}

function normalizeBizinfoNotice(item) {
  const id = cleanText(item.pblancId || item.seq);
  const title = cleanText(item.title || item.pblancNm);
  const description = cleanText(item.description || item.bsnsSumryCn);
  const target = cleanText(item.trgetNm);
  const method = cleanText(item.reqstMthPapersCn);
  const applicationPeriod = formatPeriod(item.reqstDt || item.reqstBeginEndDe);
  const originalUrl = safeHttpUrl(item.link || item.pblancUrl);
  const applyUrl = safeHttpUrl(item.rceptEngnHmpgUrl, originalUrl);
  const attachmentFiles = [
    { name: cleanText(item.fileNm), url: safeHttpUrl(item.flpthNm, "") },
    { name: cleanText(item.printFileNm), url: safeHttpUrl(item.printFlpthNm, "") },
  ].filter((file) => file.name && file.url);
  const attachments = [cleanText(item.fileNm), cleanText(item.printFileNm)].filter(Boolean);

  return {
    id: id || originalUrl,
    title,
    summary: description.slice(0, 180) || "기업마당 원문 공고에서 사업 개요를 확인해 주세요.",
    body: [description, target && `지원대상: ${target}`, method && `신청방법: ${method}`].filter(Boolean),
    registeredAt: toIsoDate(item.pubDate || item.creatPnttm),
    applicationPeriod,
    ministry: cleanText(item.author || item.jrsdInsttNm) || "소관기관 확인 필요",
    category: cleanText(item.lcategory || item.pldirSportRealmLclasCodeNm) || "기타",
    sources: ["bizinfo"],
    applyName: cleanText(item.excInsttNm) || "기업마당 원문 공고",
    applyUrl,
    originalUrl,
    attachments: [...new Set(attachments)],
    attachmentFiles: attachmentFiles.filter((file, index, files) => files.findIndex((item) => item.url === file.url) === index),
  };
}

function parseMssRows(html) {
  const notices = [];
  const rowPattern = /<tr\b[^>]*onclick=["']doBbsFView\(["']310["'],["']([^"']+)["'][^>]*title=["']([^"']+)["'][^>]*>([\s\S]*?)<\/tr>/gi;
  for (const match of html.matchAll(rowPattern)) {
    const bcIdx = match[1];
    const title = cleanText(match[2]);
    const rowText = cleanText(match[3]);
    const periodMatch = rowText.match(/신청기간\s*(\d{4}[.-]\d{2}[.-]\d{2}\s*~\s*\d{4}[.-]\d{2}[.-]\d{2}|상시|예산\s*소진[^\s]*)/);
    const applicationPeriod = formatPeriod(periodMatch?.[1] ?? "");
    const endKey = getPeriodEndKey(applicationPeriod);
    if (!title || endKey === null || endKey < todayInSeoul()) continue;
    const dateMatches = [...rowText.matchAll(/\b(\d{4}[.]\d{2}[.]\d{2})\b/g)];
    const registeredAt = toIsoDate(dateMatches.at(-1)?.[1] ?? "");
    const originalUrl = `https://www.mss.go.kr/site/smba/ex/bbs/View.do?cbIdx=310&bcIdx=${encodeURIComponent(bcIdx)}`;
    notices.push({
      id: `mss-${bcIdx}`,
      title,
      summary: "중소벤처기업부 원문 공고에서 세부 지원내용을 확인해 주세요.",
      body: ["중소벤처기업부 공식 사업공고 목록에서 확인한 접수 가능 공고입니다."],
      registeredAt,
      applicationPeriod,
      ministry: "중소벤처기업부",
      category: "사업공고",
      sources: ["mss"],
      applyName: "중소벤처기업부 원문 공고",
      applyUrl: originalUrl,
      originalUrl,
      attachments: [],
      attachmentFiles: [],
    });
  }
  return notices;
}

async function fetchMssNotices() {
  const notices = [];
  const seenFirstIds = new Set();
  let emptyActivePages = 0;
  for (let page = 1; page <= 20 && emptyActivePages < 3; page += 1) {
    const url = new URL(MSS_LIST_URL);
    url.searchParams.set("pageIndex", String(page));
    const response = await fetch(url, { headers: { Accept: "text/html" }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("MSS_UPSTREAM_ERROR");
    const pageNotices = parseMssRows(await response.text());
    const firstId = pageNotices[0]?.id;
    if (firstId && seenFirstIds.has(firstId)) break;
    if (firstId) seenFirstIds.add(firstId);
    notices.push(...pageNotices);
    emptyActivePages = pageNotices.length ? 0 : emptyActivePages + 1;
  }
  return notices;
}

function extractHtmlClass(block, className, tagName = "(?:div|li|span)") {
  const pattern = new RegExp(`<${tagName}[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/(?:div|li|span)>`, "i");
  return cleanText(block.match(pattern)?.[1] ?? "");
}

function parseSemasCards(html) {
  const cards = [];
  const cardPattern = /<a\b(?=[^>]*class=["'][^"']*\baconbox\b)[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(cardPattern)) {
    const originalUrl = safeHttpUrl(match[1], SEMAS_LIST_URL);
    const block = match[2];
    const title = extractHtmlClass(block, "cut_text1");
    const applicationPeriod = formatPeriod(extractHtmlClass(block, "date"));
    const endKey = getPeriodEndKey(applicationPeriod);
    if (!title || endKey === null || endKey < todayInSeoul()) continue;
    const id = originalUrl.match(/\/pbanc\/(\d+)/)?.[1] || originalUrl;
    const summaryMatch = block.match(/class=["'][^"']*\btext\b[^"']*\bcut_text2\b[^"']*["'][^>]*>([\s\S]*?)(?=<li\b|<div[^>]*class=["'][^"']*date_box)/i);
    const summary = cleanText(summaryMatch?.[1] ?? "");
    cards.push({
      id: `semas-${id}`,
      title,
      summary: summary || "소상공인시장진흥공단 원문에서 사업 개요를 확인해 주세요.",
      body: [summary || "소상공인시장진흥공단이 제공한 실제 진행 공고입니다."],
      registeredAt: new Date(0).toISOString(),
      applicationPeriod,
      ministry: "소상공인시장진흥공단",
      category: "소상공인",
      sources: ["semas"],
      applyName: "소상공인24 원문 공고",
      applyUrl: originalUrl,
      originalUrl,
      attachments: [],
      attachmentFiles: [],
    });
  }
  return cards;
}

async function fetchSemasNotices() {
  const notices = [];
  let emptyActivePages = 0;
  for (let page = 1; page <= 20 && emptyActivePages < 3; page += 1) {
    const url = new URL(SEMAS_LIST_URL);
    url.searchParams.set("page", String(page));
    const response = await fetch(url, {
      headers: { Accept: "text/html" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("SEMAS_UPSTREAM_ERROR");
    const pageNotices = parseSemasCards(await response.text());
    notices.push(...pageNotices);
    emptyActivePages = pageNotices.length ? 0 : emptyActivePages + 1;
  }
  return notices;
}

async function postSmartFactory(body) {
  const response = await fetch(SMART_LIST_URL, {
    method: "POST",
    headers: { "content-type": "application/json;charset=UTF-8", Accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("SMART_UPSTREAM_ERROR");
  return response.json();
}

function normalizeSmartNotice(item) {
  const pbancId = cleanText(item.pbancId);
  const pbancSn = cleanText(item.pbancSn);
  const originalUrl = safeHttpUrl(`https://www.smart-factory.kr/usr/bg/ba/ma/bsnsPbancDtl?pbancId=${encodeURIComponent(pbancId)}&pbancSn=${encodeURIComponent(pbancSn)}`);
  const title = cleanText(item.dtlPbancNm || item.pbancNm);
  const rawPeriod = cleanText(item.rcptYmdDa2001).includes("~")
    ? item.rcptYmdDa2001
    : `${item.rcptYmdDa2001 ?? ""} ~ ${item.rcptYmdDa2002 ?? ""}`;
  return {
    id: `smart-${pbancId}-${pbancSn}`,
    title,
    summary: "스마트공장 사업관리시스템 원문에서 세부 지원내용을 확인해 주세요.",
    body: ["스마트공장 사업관리시스템이 제공한 실제 접수 진행 공고입니다."],
    registeredAt: toIsoDate(item.pbancYmd),
    applicationPeriod: formatPeriod(rawPeriod),
    ministry: "중소벤처기업부",
    category: cleanText(item.bizClsfYrNm) || "스마트공장",
    sources: ["smart"],
    applyName: "스마트공장 사업관리시스템",
    applyUrl: originalUrl,
    originalUrl,
    attachments: [],
    attachmentFiles: [],
  };
}

async function fetchSmartNotices() {
  const requestBody = { key: "list", bizYr: "", bizClsfYrNm: "", dtlPbancNm: "", rcptStts: "ING", ordrSe: "REG", currentPage: 1 };
  const first = await postSmartFactory(requestBody);
  const totalPages = Math.max(1, Math.min(Number(first.paginationInfo?.totalPageCount) || 1, 20));
  const items = Array.isArray(first.pbancList) ? [...first.pbancList] : [];
  for (let page = 2; page <= totalPages; page += 1) {
    const payload = await postSmartFactory({ ...requestBody, currentPage: page });
    if (Array.isArray(payload.pbancList)) items.push(...payload.pbancList);
  }
  return items.map(normalizeSmartNotice).filter((notice) => {
    const endKey = getPeriodEndKey(notice.applicationPeriod);
    return notice.title && endKey !== null && endKey >= todayInSeoul();
  });
}

function mergeSourceNotices(sourceResults) {
  const getDedupeKey = (notice) => `${cleanText(notice.title).toLocaleLowerCase("ko-KR")}::${cleanText(notice.applicationPeriod)}`;
  const directByKey = new Map();
  sourceResults.filter((result) => result.source !== "bizinfo").forEach(({ notices }) => {
    notices.forEach((notice) => {
      const key = getDedupeKey(notice);
      if (!directByKey.has(key)) directByKey.set(key, []);
      directByKey.get(key).push(notice);
    });
  });

  const merged = [];
  const consumedDirectIds = new Set();
  sourceResults.forEach(({ source, notices }) => {
    notices.forEach((notice) => {
      if (source === "bizinfo") {
        const matches = directByKey.get(getDedupeKey(notice)) ?? [];
        matches.forEach((match) => {
          notice.sources = [...new Set([...notice.sources, ...match.sources])];
          consumedDirectIds.add(match.id);
          if (new Date(match.registeredAt) > new Date(notice.registeredAt)) notice.registeredAt = match.registeredAt;
        });
      }
      merged.push(notice);
    });
  });
  return merged.filter((notice) => !consumedDirectIds.has(notice.id));
}

async function fetchBizinfoNotices(env) {
  const apiKey = String(env.BIZINFO_API_KEY ?? "").trim();
  if (!apiKey) throw new Error("BIZINFO_API_KEY_MISSING");

  const upstreamUrl = new URL(BIZINFO_API_URL);
  upstreamUrl.searchParams.set("crtfcKey", apiKey);
  upstreamUrl.searchParams.set("dataType", "json");
  upstreamUrl.searchParams.set("searchCnt", "0");

  const upstream = await fetch(upstreamUrl, {
    headers: { Accept: "application/json", "User-Agent": "DX-CORE-Notice-Service/1.0" },
    signal: AbortSignal.timeout(20000),
  });
  if (!upstream.ok) throw new Error("BIZINFO_UPSTREAM_ERROR");
  const payload = await upstream.json();
  if (payload?.reqErr) throw new Error("BIZINFO_AUTH_ERROR");

  const todayKey = todayInSeoul();
  const notices = getApiItems(payload)
    .map(normalizeBizinfoNotice)
    .filter((notice) => {
      const endKey = getPeriodEndKey(notice.applicationPeriod);
      return notice.title && endKey !== null && endKey >= todayKey;
    })
    .sort((left, right) => new Date(right.registeredAt) - new Date(left.registeredAt));

  return notices;
}

async function fetchNotices(env) {
  const collectors = [
    { source: "mss", collect: () => fetchMssNotices() },
    { source: "semas", collect: () => fetchSemasNotices() },
    { source: "smart", collect: () => fetchSmartNotices() },
    { source: "bizinfo", collect: () => fetchBizinfoNotices(env) },
  ];
  const settled = await Promise.allSettled(collectors.map((collector) => collector.collect()));
  const sourceResults = settled.map((result, index) => ({
    source: collectors[index].source,
    ok: result.status === "fulfilled",
    notices: result.status === "fulfilled" ? result.value : [],
    code: result.status === "rejected" ? cleanText(result.reason?.message || "UPSTREAM_ERROR") : null,
  }));
  const notices = mergeSourceNotices(sourceResults)
    .sort((left, right) => new Date(right.registeredAt) - new Date(left.registeredAt));
  const successfulSources = sourceResults.filter((source) => source.ok);

  if (!successfulSources.length) {
    return jsonResponse({ code: "NOTICE_SOURCES_UNAVAILABLE", message: "정부기관 공식 공고 연결에 실패했습니다.", sources: sourceResults.map(({ notices: _, ...source }) => source) }, 502);
  }

  return jsonResponse({
    notices,
    fetchedAt: new Date().toISOString(),
    provider: "multi-source",
    sources: sourceResults.map(({ notices: items, ...source }) => ({ ...source, count: items.length })),
  });
}

function runtimeConfig(request, env) {
  const url = String(env.SUPABASE_URL ?? "").trim();
  const publishableKey = String(env.SUPABASE_PUBLISHABLE_KEY ?? "").trim();
  const redirectUrl = new URL("/login.html", request.url).href;
  const source = `window.DX_SUPABASE_CONFIG = Object.freeze(${JSON.stringify({ url, publishableKey, redirectUrl })});\n`;
  return new Response(source, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!["GET", "HEAD"].includes(request.method)) return new Response("Method Not Allowed", { status: 405 });
    if (url.pathname === "/api/notices") {
      if (request.method !== "GET") return new Response(null, { status: 405 });
      return fetchNotices(env);
    }
    if (url.pathname === "/assets/js/supabase-config.js") return runtimeConfig(request, env);

    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    if (!ALLOWED_STATIC_PATHS.has(pathname) && !pathname.startsWith("/assets/")) {
      return new Response("Not Found", { status: 404 });
    }
    if (!env.ASSETS?.fetch) return new Response("Static asset binding is unavailable", { status: 503 });

    const assetUrl = new URL(pathname, request.url);
    return withSecurityHeaders(await env.ASSETS.fetch(new Request(assetUrl, request)));
  },
};
