(function initializeCompanyProfilePage() {
  const REGION_LABELS = {
    seoul: "서울", busan: "부산", daegu: "대구", incheon: "인천", gwangju: "광주",
    daejeon: "대전", ulsan: "울산", sejong: "세종", gyeonggi: "경기", gangwon: "강원",
    chungbuk: "충북", chungnam: "충남", jeonbuk: "전북", jeonnam: "전남",
    gyeongbuk: "경북", gyeongnam: "경남", jeju: "제주",
  };
  const REGION_KEYS = Object.fromEntries(Object.entries(REGION_LABELS).map(([key, label]) => [label, key]));
  const ENTITY_TO_DB = { individual: "sole_proprietor", corporation: "corporation" };
  const ENTITY_TO_FORM = { sole_proprietor: "individual", corporation: "corporation" };
  const SIZE_TO_DB = {
    "micro-business": "micro_business", "small-enterprise": "small_enterprise",
    sme: "sme", "mid-sized": "mid_sized",
  };
  const SIZE_TO_FORM = Object.fromEntries(Object.entries(SIZE_TO_DB).map(([form, db]) => [db, form]));
  const SIZE_LABELS = {
    micro_business: "소상공인", small_enterprise: "소기업", sme: "중소기업", mid_sized: "중견기업",
  };
  const SUPPORT_TO_DB = {
    "policy-fund": "policy_fund", rnd: "rnd", "smart-factory": "smart_factory", "ai-dx": "ai_dx",
    automation: "automation", export: "export", market: "sales_channel", workforce: "workforce",
    facility: "facility_equipment", certification: "certification", consulting: "consulting",
    "esg-carbon": "esg_carbon_neutrality", startup: "startup",
  };
  const SUPPORT_TO_FORM = Object.fromEntries(Object.entries(SUPPORT_TO_DB).map(([form, db]) => [db, form]));
  const BOOLEAN_FIELDS = {
    isManufacturer: "is_manufacturer",
    hasFactoryRegistration: "has_factory_registration",
    isExporter: "has_export_experience",
    hasResearchInstitute: "has_corporate_research_institute",
    isVenture: "is_venture_certified",
    isInnobiz: "is_innobiz_certified",
    isMainbiz: "is_mainbiz_certified",
    isWomenOwned: "is_women_owned_certified",
    isDisabledOwned: "is_disabled_owned_certified",
    isSocialEnterprise: "is_social_enterprise",
  };

  const state = { profiles: [], currentUser: null, editingId: null, deleteId: null, step: 1, busy: false };
  const byId = (id) => document.getElementById(id);
  const elements = {
    listView: byId("company-list-view"), list: byId("company-list"), listEmpty: byId("company-list-empty"),
    listStatus: byId("company-list-status"), add: byId("company-add-button"), emptyAdd: byId("company-empty-add-button"),
    template: byId("company-list-item-template"), formView: byId("company-form-view"), form: byId("company-form"),
    formTitle: byId("company-form-title"), message: byId("company-form-message"), basic: byId("company-basic-step"),
    detail: byId("company-detail-step"), basicIndicator: byId("company-step-basic-indicator"),
    detailIndicator: byId("company-step-detail-indicator"), next: byId("company-next-step"),
    basicSave: byId("company-basic-save-button"), previous: byId("company-previous-step"),
    save: byId("company-save-button"), cancel: byId("company-form-cancel"), age: byId("company-age"),
    foundedOn: byId("established-date"), exporterAmount: byId("export-amount"),
    deleteDialog: byId("company-delete-dialog"), deleteCancel: byId("company-delete-cancel"),
    deleteConfirm: byId("company-delete-confirm"), toast: byId("company-toast"),
  };

  function setStatus(message, tone = "") {
    elements.message.textContent = message;
    elements.message.dataset.tone = tone;
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    window.setTimeout(() => elements.toast.classList.remove("visible"), 2600);
  }

  function toNullableBoolean(value) {
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
  }

  function formRadioValue(name) {
    return elements.form.querySelector(`[name="${name}"]:checked`)?.value ?? "unknown";
  }

  function calculateAge(dateText) {
    if (!dateText) return null;
    const founded = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(founded.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - founded.getFullYear();
    if (today.getMonth() < founded.getMonth() || (today.getMonth() === founded.getMonth() && today.getDate() < founded.getDate())) age -= 1;
    return Math.max(0, age);
  }

  function renderAge() {
    const age = calculateAge(elements.foundedOn.value);
    elements.age.textContent = age === null ? "설립일을 입력해 주세요" : `${age}년`;
  }

  function setStep(step) {
    state.step = step;
    elements.basic.hidden = step !== 1;
    elements.detail.hidden = step !== 2;
    if (step === 1) elements.basicIndicator.setAttribute("aria-current", "step");
    else elements.basicIndicator.removeAttribute("aria-current");
    if (step === 2) elements.detailIndicator.setAttribute("aria-current", "step");
    else elements.detailIndicator.removeAttribute("aria-current");
    const target = step === 1 ? elements.basic : elements.detail;
    const legend = target.querySelector(":scope > legend");
    if (legend) {
      legend.tabIndex = -1;
      legend.focus();
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function showList() {
    elements.formView.hidden = true;
    elements.listView.hidden = false;
    state.editingId = null;
    setStatus("");
  }

  function resetForm() {
    elements.form.reset();
    byId("company-id").value = "";
    elements.form.querySelectorAll('input[type="radio"][value="unknown"]').forEach((radio) => { radio.checked = true; });
    [byId("support-experience"), byId("same-project-benefit"), byId("participation-restriction")].forEach((select) => { select.value = "unknown"; });
    elements.exporterAmount.disabled = true;
    renderAge();
  }

  function openForm(profile = null) {
    resetForm();
    state.editingId = profile?.id ?? null;
    elements.formTitle.textContent = profile ? "업체 정보 수정" : "업체 추가";
    if (profile) populateForm(profile);
    elements.listView.hidden = true;
    elements.formView.hidden = false;
    setStep(1);
    byId("company-name").focus();
  }

  function populateForm(profile) {
    byId("company-id").value = profile.id;
    byId("company-name").value = profile.company_name;
    const entity = elements.form.querySelector(`[name="businessType"][value="${ENTITY_TO_FORM[profile.entity_type]}"]`);
    if (entity) entity.checked = true;
    byId("company-size").value = SIZE_TO_FORM[profile.company_size] ?? "";
    byId("head-office-region").value = REGION_KEYS[profile.head_office_region] ?? "";
    byId("factory-region").value = profile.factory_region ? (REGION_KEYS[profile.factory_region] ?? "none") : "none";
    byId("industry").value = profile.industry ?? "";
    byId("sub-industry").value = profile.industry_detail ?? "";
    elements.foundedOn.value = profile.founded_on ?? "";
    byId("annual-revenue").value = profile.annual_revenue_krw == null ? "" : String(profile.annual_revenue_krw / 10000);
    byId("employee-count").value = profile.employee_count ?? "";
    byId("export-amount").value = profile.export_amount_krw == null ? "" : String(profile.export_amount_krw / 10000);
    Object.entries(BOOLEAN_FIELDS).forEach(([formName, dbName]) => {
      const value = profile[dbName] == null ? "unknown" : String(profile[dbName]);
      const radio = elements.form.querySelector(`[name="${formName}"][value="${value}"]`);
      if (radio) radio.checked = true;
    });
    byId("support-experience").value = profile.has_government_project_experience == null ? "unknown" : String(profile.has_government_project_experience);
    byId("same-project-benefit").value = profile.has_same_program_benefit == null ? "unknown" : String(profile.has_same_program_benefit);
    byId("participation-restriction").value = profile.has_participation_restriction == null ? "unknown" : String(profile.has_participation_restriction);
    elements.form.querySelectorAll('[name="supportInterests"]').forEach((checkbox) => {
      checkbox.checked = profile.desired_support_types?.includes(SUPPORT_TO_DB[checkbox.value]);
    });
    elements.exporterAmount.disabled = profile.has_export_experience !== true;
    renderAge();
  }

  function readNumber(id, multiplier = 1) {
    const raw = byId(id).value;
    if (raw === "") return null;
    return Math.round(Number(raw) * multiplier);
  }

  function getPayload(step) {
    const payload = {
      company_name: byId("company-name").value.trim(),
      entity_type: ENTITY_TO_DB[formRadioValue("businessType")],
      company_size: SIZE_TO_DB[byId("company-size").value],
      head_office_region: REGION_LABELS[byId("head-office-region").value],
      factory_region: byId("factory-region").value === "none" ? null : REGION_LABELS[byId("factory-region").value],
      industry: byId("industry").value.trim(),
      industry_detail: byId("sub-industry").value.trim() || null,
      founded_on: elements.foundedOn.value,
      annual_revenue_krw: readNumber("annual-revenue", 10000),
      employee_count: readNumber("employee-count"),
      desired_support_types: [...elements.form.querySelectorAll('[name="supportInterests"]:checked')].map((input) => SUPPORT_TO_DB[input.value]),
      profile_step: step,
    };
    if (state.editingId) payload.id = state.editingId;
    Object.entries(BOOLEAN_FIELDS).forEach(([formName, dbName]) => { payload[dbName] = toNullableBoolean(formRadioValue(formName)); });
    payload.export_amount_krw = payload.has_export_experience === true ? readNumber("export-amount", 10000) : null;
    payload.has_government_project_experience = toNullableBoolean(byId("support-experience").value);
    payload.has_same_program_benefit = toNullableBoolean(byId("same-project-benefit").value);
    payload.has_participation_restriction = toNullableBoolean(byId("participation-restriction").value);
    return payload;
  }

  function validateBasic() {
    const required = [...elements.basic.querySelectorAll("[required]")];
    const invalid = required.find((input) => !input.checkValidity());
    if (!invalid) return true;
    invalid.reportValidity();
    invalid.focus();
    setStatus("필수 기본정보를 확인해 주세요.", "error");
    return false;
  }

  function setBusy(busy) {
    state.busy = busy;
    [elements.next, elements.basicSave, elements.previous, elements.save, elements.cancel].forEach((button) => { button.disabled = busy; });
  }

  async function saveProfile(step) {
    if (!validateBasic() || state.busy) return;
    setBusy(true);
    setStatus("기업정보를 저장하고 있습니다.");
    try {
      const saved = await window.DXAuth.saveCompanyProfile(getPayload(step));
      const existingIndex = state.profiles.findIndex((profile) => profile.id === saved.id);
      if (existingIndex >= 0) state.profiles[existingIndex] = saved;
      else state.profiles.unshift(saved);
      renderProfiles();
      showList();
      showToast(step === 1 ? "기본 기업정보를 저장했어요." : "기업정보를 저장했어요.");
    } catch (error) {
      setStatus(error?.message || "기업정보를 저장하지 못했습니다.", "error");
    } finally {
      setBusy(false);
    }
  }

  function renderProfiles() {
    elements.list.replaceChildren();
    elements.listEmpty.hidden = state.profiles.length > 0;
    elements.listStatus.textContent = state.profiles.length ? `저장된 업체 ${state.profiles.length}개` : "";
    state.profiles.forEach((profile) => {
      const item = elements.template.content.firstElementChild.cloneNode(true);
      item.dataset.profileId = profile.id;
      item.querySelector(".company-list-name").textContent = profile.company_name;
      item.querySelector(".company-list-summary").textContent = `${SIZE_LABELS[profile.company_size] ?? "기업규모 확인 필요"} · ${profile.head_office_region} · ${profile.industry}`;
      item.querySelector(".company-find-link").href = `index.html?mode=company&profile=${encodeURIComponent(profile.id)}`;
      item.querySelector(".company-edit-button").dataset.profileId = profile.id;
      item.querySelector(".company-delete-button").dataset.profileId = profile.id;
      elements.list.append(item);
    });
  }

  async function loadProfiles() {
    elements.listStatus.textContent = "기업정보를 불러오고 있습니다.";
    try {
      state.profiles = await window.DXAuth.loadCompanyProfiles();
      renderProfiles();
    } catch (error) {
      elements.listStatus.textContent = `기업정보를 불러오지 못했습니다: ${error?.message || "연결을 확인해 주세요."}`;
    }
  }

  async function handleAuthChange({ event, user }) {
    if (event === "UNCONFIGURED") {
      elements.listStatus.textContent = "로그인 저장 기능 설정이 필요합니다.";
      elements.add.disabled = true;
      elements.emptyAdd.disabled = true;
      return;
    }
    state.currentUser = user ?? null;
    if (!user) {
      elements.listStatus.innerHTML = '기업정보는 로그인 후 저장할 수 있습니다. <a href="login.html">로그인하기</a>';
      elements.add.disabled = true;
      elements.emptyAdd.disabled = true;
      return;
    }
    elements.add.disabled = false;
    elements.emptyAdd.disabled = false;
    await loadProfiles();
  }

  elements.add.addEventListener("click", () => openForm());
  elements.emptyAdd.addEventListener("click", () => openForm());
  elements.cancel.addEventListener("click", showList);
  elements.next.addEventListener("click", () => { if (validateBasic()) setStep(2); });
  elements.basicSave.addEventListener("click", () => saveProfile(1));
  elements.previous.addEventListener("click", () => setStep(1));
  elements.form.addEventListener("submit", (event) => { event.preventDefault(); saveProfile(2); });
  elements.foundedOn.addEventListener("change", renderAge);
  elements.form.addEventListener("change", (event) => {
    if (event.target.name !== "isExporter") return;
    const isExporter = formRadioValue("isExporter") === "true";
    elements.exporterAmount.disabled = !isExporter;
    if (!isExporter) elements.exporterAmount.value = "";
  });
  elements.list.addEventListener("click", (event) => {
    const edit = event.target.closest(".company-edit-button");
    if (edit) openForm(state.profiles.find((profile) => profile.id === edit.dataset.profileId));
    const remove = event.target.closest(".company-delete-button");
    if (remove) {
      state.deleteId = remove.dataset.profileId;
      elements.deleteDialog.showModal();
    }
  });
  elements.deleteConfirm.addEventListener("click", async (event) => {
    event.preventDefault();
    if (!state.deleteId) return;
    elements.deleteConfirm.disabled = true;
    try {
      await window.DXAuth.deleteCompanyProfile(state.deleteId);
      state.profiles = state.profiles.filter((profile) => profile.id !== state.deleteId);
      renderProfiles();
      elements.deleteDialog.close();
      showToast("업체 정보를 삭제했어요.");
    } catch (error) {
      elements.deleteDialog.close();
      showToast(error?.message || "업체 정보를 삭제하지 못했습니다.");
    } finally {
      state.deleteId = null;
      elements.deleteConfirm.disabled = false;
    }
  });
  elements.deleteCancel.addEventListener("click", () => { state.deleteId = null; });

  window.DXAuth.initialize(handleAuthChange).catch((error) => {
    elements.listStatus.textContent = `로그인 기능을 시작하지 못했습니다: ${error?.message || "설정을 확인해 주세요."}`;
  });
  window.addEventListener("beforeunload", () => window.DXAuth.destroy());
})();
