const DATA_GO_API_URL = "https://apis.data.go.kr/1421000/bizinfo/pblancBsnsService";
const DATA_GO_SOURCE_PAGE = "https://www.data.go.kr/data/15157820/openapi.do";
const ALLOWED_STATIC_PATHS = new Set(["/index.html", "/login.html"]);
const CACHE_TTL_MS = 5 * 60 * 1000;
const PAGE_SIZE = 100;
const PAGE_CONCURRENCY = 4;

let noticeSnapshot = null;

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

function safeHttpUrl(value, fallback = DATA_GO_SOURCE_PAGE) {
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
  const normalized = text.replace(" ", "T");
  const withZone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized)
    ? `${normalized}+09:00`
    : normalized;
  const date = new Date(withZone);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function classifyCategory(item) {
  const field = cleanText(item.pldirSportRealmLclasCodeNm);
  const text = cleanText([
    item.pblancNm,
    item.bsnsSumryCn,
    item.hashtags,
    field,
  ].join(" "));

  if (/스마트\s*공장|스마트팩토리|스마트\s*제조|제조혁신|자율제조/i.test(text)) return "스마트공장";
  if (/\bAI\b|인공지능|\bAX\b|제조\s*AI/i.test(text)) return "AI·AX";
  if (/디지털\s*전환|\bDX\b/i.test(text)) return "DX";
  if (/R\s*[&＆]\s*D|연구개발|기술개발/i.test(text)) return "R&D";
  if (/정책\s*자금|융자|대출|보증|금융/i.test(text) || field === "금융") return "정책자금";
  if (/수출|해외|글로벌|무역/i.test(text) || field === "수출") return "수출";
  return "기타";
}

function getItems(body) {
  const items = body?.items;
  if (Array.isArray(items)) return items;
  if (Array.isArray(items?.item)) return items.item;
  if (items?.item && typeof items.item === "object") return [items.item];
  return items && typeof items === "object" ? [items] : [];
}

function normalizeNotice(item) {
  const id = cleanText(item.pblancId);
  const title = cleanText(item.pblancNm);
  const description = cleanText(item.bsnsSumryCn);
  const target = cleanText(item.trgetNm);
  const method = cleanText(item.reqstMthPapersCn);
  const contact = cleanText(item.refrncNm);
  const hashtags = cleanText(item.hashtags).split(",").map((tag) => tag.trim()).filter(Boolean);
  const originalUrl = safeHttpUrl(item.pblancUrl);
  const applyUrl = safeHttpUrl(item.rceptEngnHmpgUrl, originalUrl);
  const attachmentFiles = [
    { name: cleanText(item.fileNm), url: safeHttpUrl(item.flpthNm, "") },
    { name: cleanText(item.printFileNm), url: safeHttpUrl(item.printFlpthNm, "") },
  ].filter((file) => file.name && file.url);

  return {
    id: id || originalUrl,
    title,
    summary: description.slice(0, 180) || "공공데이터포털 원문 공고에서 사업 개요를 확인해 주세요.",
    body: [
      description,
      target && `지원대상: ${target}`,
      method && `신청방법: ${method}`,
      contact && `문의처: ${contact}`,
    ].filter(Boolean),
    registeredAt: toIsoDate(item.creatPnttm),
    updatedAt: toIsoDate(item.updtPnttm || item.creatPnttm),
    applicationPeriod: formatPeriod(item.reqstBeginEndDe),
    ministry: cleanText(item.jrsdInsttNm) || "소관기관 확인 필요",
    agency: cleanText(item.excInsttNm),
    category: classifyCategory(item),
    sources: ["dataGoKr"],
    applyName: cleanText(item.excInsttNm) || "기업마당 원문 공고",
    applyUrl,
    originalUrl,
    target,
    contact,
    hashtags,
    attachments: attachmentFiles.map((file) => file.name),
    attachmentFiles: attachmentFiles.filter((file, index, files) => files.findIndex((entry) => entry.url === file.url) === index),
  };
}

function normalizeServiceKey(value) {
  const key = String(value ?? "").trim();
  if (!key) throw new Error("DATA_GO_KR_API_KEY_MISSING");
  if (!/%[0-9A-Fa-f]{2}/.test(key)) return key;
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
}

async function fetchPage(apiKey, pageNo) {
  const url = new URL(DATA_GO_API_URL);
  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("dataType", "json");
  url.searchParams.set("pageNo", String(pageNo));
  url.searchParams.set("numOfRows", String(PAGE_SIZE));

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.response) throw new Error("DATA_GO_UPSTREAM_ERROR");
  if (String(payload.response.header?.resultCode ?? "") !== "00") throw new Error("DATA_GO_API_ERROR");
  return payload.response.body ?? {};
}

async function fetchAllNotices(env) {
  const apiKey = normalizeServiceKey(env.DATA_GO_KR_API_KEY);
  const firstBody = await fetchPage(apiKey, 1);
  const totalCount = Math.max(0, Number(firstBody.totalCount) || 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const items = [...getItems(firstBody)];

  for (let start = 2; start <= totalPages; start += PAGE_CONCURRENCY) {
    const pageNumbers = Array.from(
      { length: Math.min(PAGE_CONCURRENCY, totalPages - start + 1) },
      (_, index) => start + index,
    );
    const bodies = await Promise.all(pageNumbers.map((pageNo) => fetchPage(apiKey, pageNo)));
    bodies.forEach((body) => items.push(...getItems(body)));
  }

  const todayKey = todayInSeoul();
  const byId = new Map();
  items.map(normalizeNotice).forEach((notice) => {
    const endKey = getPeriodEndKey(notice.applicationPeriod);
    if (!notice.title || endKey === null || endKey < todayKey) return;
    const existing = byId.get(notice.id);
    if (!existing || new Date(notice.updatedAt) > new Date(existing.updatedAt)) byId.set(notice.id, notice);
  });
  return [...byId.values()].sort((left, right) => new Date(right.registeredAt) - new Date(left.registeredAt));
}

async function getNoticePayload(env, force) {
  if (!force && noticeSnapshot?.expiresAt > Date.now()) return noticeSnapshot.payload;

  try {
    const notices = await fetchAllNotices(env);
    const payload = {
      notices,
      fetchedAt: new Date().toISOString(),
      provider: "data-go-kr",
      stale: false,
      sources: [{ source: "dataGoKr", ok: true, count: notices.length, code: null }],
    };
    noticeSnapshot = { expiresAt: Date.now() + CACHE_TTL_MS, payload };
    return payload;
  } catch (error) {
    if (noticeSnapshot?.payload) {
      return {
        ...noticeSnapshot.payload,
        stale: true,
        sources: [{ source: "dataGoKr", ok: false, count: noticeSnapshot.payload.notices.length, code: cleanText(error?.message) }],
      };
    }
    throw error;
  }
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
      try {
        return jsonResponse(await getNoticePayload(env, url.searchParams.get("refresh") === "1"));
      } catch {
        return jsonResponse({
          code: "DATA_GO_SERVICE_UNAVAILABLE",
          message: "공공데이터포털 공고 연결을 확인해 주세요.",
          sources: [{ source: "dataGoKr", ok: false, count: 0, code: "DATA_GO_SERVICE_UNAVAILABLE" }],
        }, 502);
      }
    }
    if (url.pathname === "/assets/js/supabase-config.js") return runtimeConfig(request, env);

    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    if (!ALLOWED_STATIC_PATHS.has(pathname) && !pathname.startsWith("/assets/")) {
      return new Response("Not Found", { status: 404 });
    }
    if (!env.ASSETS?.fetch) return new Response("Static asset binding is unavailable", { status: 503 });
    return withSecurityHeaders(await env.ASSETS.fetch(new Request(new URL(pathname, request.url), request)));
  },
};
