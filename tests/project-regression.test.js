"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const engine = require("../assets/js/eligibility-engine.js");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const indexHtml = read("index.html");
const companyHtml = read("company.html");
const serverJs = read("server/index.js");
const appJs = read("assets/js/app.js");
const authJs = read("assets/js/auth.js");
const schemaSql = read("supabase/schema.sql");

assert.match(serverJs, /https:\/\/apis\.data\.go\.kr\/1421000\/bizinfo\/pblancBsnsService/);
assert.doesNotMatch(serverJs, /bizinfoApi\.do|BIZINFO_API_KEY/);
assert.match(serverJs, /env\.DATA_GO_KR_API_KEY/);
assert.match(serverJs, /"\/company\.html"/);
assert.match(indexHtml, /id="general-search-mode-button"/);
assert.match(indexHtml, /id="company-search-mode-button"/);
assert.match(indexHtml, /id="company-search-results"/);
assert.match(indexHtml, /assets\/js\/eligibility-engine\.js/);
assert.match(companyHtml, /id="company-basic-step"/);
assert.match(companyHtml, /id="company-detail-step"/);
assert.equal((companyHtml.match(/name="supportInterests"/g) || []).length, 13);
assert.equal((companyHtml.match(/value="unknown"/g) || []).length, 13);
assert.match(authJs, /loadCompanyProfiles/);
assert.match(authJs, /saveCompanyProfile/);
assert.match(authJs, /deleteCompanyProfile/);
assert.match(schemaSql, /create table if not exists public\.company_profiles/);
assert.match(schemaSql, /enable row level security/);
assert.match(appJs, /DXEligibilityEngine\.matchEligibility/);
assert.deepEqual(engine.SCORE_ITEMS.map(({ weight }) => weight), [25, 15, 15, 10, 10, 15, 5, 5]);
assert.equal(engine.SCORE_ITEMS.reduce((sum, item) => sum + item.weight, 0), 100);

const ids = [...indexHtml.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, "index.html에 중복 ID가 없어야 합니다.");
const companyIds = [...companyHtml.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(companyIds).size, companyIds.length, "company.html에 중복 ID가 없어야 합니다.");

console.log("project regression checks passed");
