(function initializeAuthModule() {
  const config = window.DX_SUPABASE_CONFIG ?? {};
  let client = null;
  let currentUser = null;
  let authSubscription = null;

  function hasUsableConfig() {
    const publishableKey = config.publishableKey ?? "";
    return Boolean(
      window.supabase?.createClient
      && /^https:\/\//.test(config.url ?? "")
      && /^sb_publishable_/i.test(publishableKey),
    );
  }

  function requireClient() {
    if (!client) throw new Error("SUPABASE_NOT_CONFIGURED");
    return client;
  }

  function normalizeKeyword(value) {
    return value.toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
  }

  function getRedirectUrl() {
    if (config.redirectUrl) return config.redirectUrl;
    if (["http:", "https:"].includes(window.location.protocol)) {
      return `${window.location.origin}${window.location.pathname}`;
    }
    return null;
  }

  async function initialize(onAuthChange) {
    if (!hasUsableConfig()) {
      onAuthChange({ event: "UNCONFIGURED", session: null, user: null });
      return;
    }

    client = window.supabase.createClient(config.url, config.publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    });

    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    currentUser = data.session?.user ?? null;
    onAuthChange({ event: "INITIAL_SESSION", session: data.session, user: currentUser });

    const listener = client.auth.onAuthStateChange((event, session) => {
      currentUser = session?.user ?? null;
      window.setTimeout(() => onAuthChange({ event, session, user: currentUser }), 0);
    });
    authSubscription = listener.data.subscription;
  }

  async function signUp(email, password) {
    const options = {};
    const redirectUrl = getRedirectUrl();
    if (redirectUrl) options.emailRedirectTo = redirectUrl;
    const result = await requireClient().auth.signUp({ email, password, options });
    if (result.data.session) currentUser = result.data.user;
    return result;
  }

  async function signIn(email, password) {
    const result = await requireClient().auth.signInWithPassword({ email, password });
    if (result.data.session) currentUser = result.data.user;
    return result;
  }

  async function signOut() {
    const result = await requireClient().auth.signOut();
    if (!result.error) currentUser = null;
    return result;
  }

  async function resetPassword(email) {
    const redirectUrl = getRedirectUrl();
    const options = redirectUrl ? { redirectTo: redirectUrl } : undefined;
    return requireClient().auth.resetPasswordForEmail(email, options);
  }

  async function updatePassword(password) {
    return requireClient().auth.updateUser({ password });
  }

  async function loadKeywords() {
    if (!currentUser) return [];
    const { data, error } = await requireClient()
      .from("user_keywords")
      .select("keyword")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data.map((row) => row.keyword);
  }

  async function addKeyword(keyword) {
    if (!currentUser) throw new Error("AUTH_REQUIRED");
    const { error } = await requireClient().from("user_keywords").insert({
      user_id: currentUser.id,
      keyword,
      normalized_keyword: normalizeKeyword(keyword),
    });
    if (error) throw error;
  }

  async function removeKeyword(keyword) {
    if (!currentUser) throw new Error("AUTH_REQUIRED");
    const { error } = await requireClient()
      .from("user_keywords")
      .delete()
      .eq("user_id", currentUser.id)
      .eq("normalized_keyword", normalizeKeyword(keyword));
    if (error) throw error;
  }

  function destroy() {
    authSubscription?.unsubscribe();
  }

  window.DXAuth = Object.freeze({
    addKeyword,
    destroy,
    initialize,
    isConfigured: hasUsableConfig,
    loadKeywords,
    removeKeyword,
    resetPassword,
    signIn,
    signOut,
    signUp,
    updatePassword,
  });
})();
