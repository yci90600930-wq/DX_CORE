(function initializeLoginPage() {
  const state = {
    mode: "signin",
    busy: false,
    configured: false,
  };

  const elements = {
    form: document.querySelector("#auth-form"),
    title: document.querySelector("#auth-title"),
    description: document.querySelector("#auth-description"),
    emailField: document.querySelector("#auth-email-field"),
    email: document.querySelector("#auth-email"),
    password: document.querySelector("#auth-password"),
    passwordLabel: document.querySelector("#auth-password-label"),
    submitButton: document.querySelector("#auth-submit-button"),
    message: document.querySelector("#auth-message"),
    secondaryActions: document.querySelector("#auth-secondary-actions"),
    modeButton: document.querySelector("#auth-mode-button"),
    resetButton: document.querySelector("#password-reset-button"),
    temporaryNote: document.querySelector(".auth-temporary-note"),
  };

  function setMessage(message = "", tone = "") {
    elements.message.textContent = message;
    if (tone) {
      elements.message.dataset.tone = tone;
    } else {
      delete elements.message.dataset.tone;
    }
  }

  function translateAuthError(error) {
    const message = error?.message ?? "";
    if (message === "SUPABASE_NOT_CONFIGURED") return "로그인 연결 준비가 필요합니다.";
    if (/invalid login credentials/i.test(message)) return "이메일 또는 비밀번호가 올바르지 않습니다.";
    if (/email not confirmed/i.test(message)) return "이메일 확인을 완료한 뒤 로그인해 주세요.";
    if (/user already registered/i.test(message)) return "이미 가입된 이메일입니다.";
    if (/password should be/i.test(message)) return "비밀번호는 8자 이상 입력해 주세요.";
    return message || "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }

  function setBusy(isBusy) {
    state.busy = isBusy;
    elements.submitButton.disabled = isBusy;
    elements.modeButton.disabled = isBusy;
    elements.resetButton.disabled = isBusy;
    elements.submitButton.textContent = isBusy
      ? "처리 중..."
      : state.mode === "signup"
        ? "회원가입"
        : state.mode === "recovery"
          ? "새 비밀번호 저장"
          : "로그인";
  }

  function setMode(mode) {
    state.mode = mode;
    const isSignup = mode === "signup";
    const isRecovery = mode === "recovery";
    elements.emailField.hidden = isRecovery;
    elements.email.disabled = isRecovery;
    elements.email.required = !isRecovery;
    elements.secondaryActions.hidden = isRecovery;
    elements.temporaryNote.hidden = isRecovery;
    elements.resetButton.hidden = isSignup;
    elements.title.textContent = isRecovery ? "새 비밀번호 설정" : isSignup ? "회원가입" : "로그인";
    elements.description.textContent = isRecovery
      ? "새 비밀번호를 입력해 계정 보안을 완료하세요."
      : isSignup
        ? "이메일 확인 후 관심 키워드를 계정에 저장할 수 있습니다."
        : "계정에 저장한 관심 키워드를 불러옵니다.";
    elements.passwordLabel.textContent = isRecovery ? "새 비밀번호" : "비밀번호";
    elements.password.autocomplete = isRecovery || isSignup ? "new-password" : "current-password";
    elements.modeButton.textContent = isSignup ? "로그인으로 돌아가기" : "회원가입";
    elements.password.value = "";
    setMessage();
    setBusy(false);
    window.setTimeout(() => (isRecovery ? elements.password : elements.email).focus(), 0);
  }

  function goToMain() {
    window.location.replace("index.html");
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!state.configured) {
      setMessage("회원가입 연결 설정이 필요합니다. Supabase Project URL과 Publishable key를 먼저 입력해 주세요.", "error");
      return;
    }

    const email = elements.email.value.trim();
    const password = elements.password.value;
    setBusy(true);
    setMessage();

    try {
      if (state.mode === "signup") {
        const { data, error } = await window.DXAuth.signUp(email, password);
        if (error) throw error;
        if (data.session) {
          goToMain();
        } else {
          setMessage("회원가입 이메일을 보냈습니다. 이메일 확인 후 로그인해 주세요.", "success");
        }
      } else if (state.mode === "recovery") {
        const { error } = await window.DXAuth.updatePassword(password);
        if (error) throw error;
        setMessage("새 비밀번호를 저장했습니다. 공고 화면으로 이동합니다.", "success");
        window.setTimeout(goToMain, 900);
      } else {
        const { data, error } = await window.DXAuth.signIn(email, password);
        if (error) throw error;
        if (data.session) goToMain();
      }
    } catch (error) {
      setMessage(translateAuthError(error), "error");
    } finally {
      setBusy(false);
    }
  }

  async function requestPasswordReset() {
    if (!state.configured) {
      setMessage("로그인 연결 준비가 필요합니다.", "error");
      return;
    }

    const email = elements.email.value.trim();
    if (!email) {
      setMessage("비밀번호를 재설정할 이메일을 입력해 주세요.", "error");
      elements.email.focus();
      return;
    }

    setBusy(true);
    try {
      const { error } = await window.DXAuth.resetPassword(email);
      if (error) throw error;
      setMessage("비밀번호 재설정 이메일을 보냈습니다.", "success");
    } catch (error) {
      setMessage(translateAuthError(error), "error");
    } finally {
      setBusy(false);
    }
  }

  function handleAuthChange({ event, user }) {
    if (event === "UNCONFIGURED") {
      state.configured = false;
      setBusy(false);
      setMessage("회원가입 연결 설정이 필요합니다. Supabase Project URL과 Publishable key를 먼저 입력해 주세요.", "error");
      return;
    }

    state.configured = true;
    setBusy(false);
    if (event === "PASSWORD_RECOVERY") {
      setMode("recovery");
      return;
    }

    if (event === "INITIAL_SESSION" && user) {
      setMessage("이미 로그인되어 있습니다. 공고 화면으로 돌아갈 수 있습니다.", "success");
    }
  }

  elements.form.addEventListener("submit", submitForm);
  elements.modeButton.addEventListener("click", () => setMode(state.mode === "signup" ? "signin" : "signup"));
  elements.resetButton.addEventListener("click", requestPasswordReset);
  const requestedMode = new URLSearchParams(window.location.search).get("mode");
  setMode(requestedMode === "recovery" ? "recovery" : window.location.hash === "#signup" ? "signup" : "signin");

  window.DXAuth.initialize(handleAuthChange).catch((error) => {
    state.configured = false;
    setBusy(false);
    setMessage(`로그인 기능을 시작하지 못했습니다: ${translateAuthError(error)}`, "error");
  });

  window.addEventListener("beforeunload", () => window.DXAuth.destroy());
})();
