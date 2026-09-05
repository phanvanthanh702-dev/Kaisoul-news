/* =========================================================
   KAISOUL NEWS
   Frontend application
========================================================= */

"use strict";

/* =========================================================
   CONFIG
========================================================= */

const CONFIG = {
  API_BASE:
    window.KAISOUL_NEWS_API ||
    localStorage.getItem("kaisoul_news_api") ||
    "/api",

  KAISOUL_ID_URL:
    "https://phanvanthanh702-dev.github.io/KAISOUL-ID/",

  STORAGE: {
    TOKEN: "kaisoul_news_token",
    USER: "kaisoul_news_user",
    THEME: "kaisoul_news_theme",
    VISITOR: "kaisoul_news_visitor",
    SEARCH: "kaisoul_news_search"
  }
};


/* =========================================================
   STATE
========================================================= */

const state = {
  user: null,
  token: null,
  articles: [],
  featuredArticles: [],
  popularArticles: [],
  categories: [],
  currentCategory: "",
  searchKeyword: "",
  loading: false
};


/* =========================================================
   DOM
========================================================= */

const DOM = {
  menuButton:
    document.getElementById("menuButton"),

  closeMenuButton:
    document.getElementById("closeMenuButton"),

  sideMenu:
    document.getElementById("sideMenu"),

  menuOverlay:
    document.getElementById("menuOverlay"),

  searchButton:
    document.getElementById("searchButton"),

  searchPanel:
    document.getElementById("searchPanel"),

  searchForm:
    document.getElementById("searchForm"),

  searchInput:
    document.getElementById("searchInput"),

  accountButton:
    document.getElementById("accountButton"),

  accountText:
    document.getElementById("accountText"),

  accountAvatar:
    document.getElementById("accountAvatar"),

  loginModal:
    document.getElementById("loginModal"),

  closeLoginModal:
    document.getElementById("closeLoginModal"),

  loginKaisoulButton:
    document.getElementById(
      "loginKaisoulButton"
    ),

  registerKaisoulButton:
    document.getElementById(
      "registerKaisoulButton"
    ),

  accountModal:
    document.getElementById("accountModal"),

  closeAccountModal:
    document.getElementById(
      "closeAccountModal"
    ),

  profileAvatar:
    document.getElementById("profileAvatar"),

  profileName:
    document.getElementById("profileName"),

  profileKaisoulId:
    document.getElementById(
      "profileKaisoulId"
    ),

  profileButton:
    document.getElementById("profileButton"),

  savedButton:
    document.getElementById("savedButton"),

  logoutButton:
    document.getElementById("logoutButton"),

  breakingBar:
    document.getElementById("breakingBar"),

  breakingLink:
    document.getElementById("breakingLink"),

  heroNews:
    document.getElementById("heroNews"),

  latestNews:
    document.getElementById("latestNews"),

  featuredNews:
    document.getElementById(
      "featuredNews"
    ),

  popularNews:
    document.getElementById(
      "popularNews"
    ),

  refreshButton:
    document.getElementById(
      "refreshButton"
    ),

  toast:
    document.getElementById("toast"),

  toastMessage:
    document.getElementById(
      "toastMessage"
    ),

  noResults:
    document.getElementById("noResults"),

  categoryNavigation:
    document.getElementById(
      "categoryNavigation"
    )
};


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  init
);

async function init() {
  try {
    createVisitorId();

    loadStoredAuth();

    initializeTheme();

    bindEvents();

    updateAccountUI();

    await loadSettings();

    await loadCategories();

    await loadHomeNews();

  } catch (error) {
    console.error(
      "KAISOUL NEWS initialization error:",
      error
    );

    showToast(
      "Không thể tải dữ liệu KAISOUL NEWS."
    );
  }
}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

  /* Menu */

  DOM.menuButton?.addEventListener(
    "click",
    openMenu
  );

  DOM.closeMenuButton?.addEventListener(
    "click",
    closeMenu
  );

  DOM.menuOverlay?.addEventListener(
    "click",
    closeMenu
  );


  /* Search */

  DOM.searchButton?.addEventListener(
    "click",
    toggleSearch
  );

  DOM.searchForm?.addEventListener(
    "submit",
    handleSearch
  );


  /* Account */

  DOM.accountButton?.addEventListener(
    "click",
    handleAccountClick
  );


  /* Login modal */

  DOM.closeLoginModal?.addEventListener(
    "click",
    closeLoginModal
  );

  DOM.loginModal?.querySelector(
    ".modal-backdrop"
  )?.addEventListener(
    "click",
    closeLoginModal
  );

  DOM.loginKaisoulButton?.addEventListener(
    "click",
    loginWithKaisoulID
  );

  DOM.registerKaisoulButton?.addEventListener(
    "click",
    registerKaisoulID
  );


  /* Account modal */

  DOM.closeAccountModal?.addEventListener(
    "click",
    closeAccountModal
  );

  DOM.accountModal?.querySelector(
    ".modal-backdrop"
  )?.addEventListener(
    "click",
    closeAccountModal
  );

  DOM.profileButton?.addEventListener(
    "click",
    openKaisoulProfile
  );

  DOM.savedButton?.addEventListener(
    "click",
    openSavedArticles
  );

  DOM.logoutButton?.addEventListener(
    "click",
    logout
  );


  /* Refresh */

  DOM.refreshButton?.addEventListener(
    "click",
    () => loadHomeNews(true)
  );


  /* Categories */

  DOM.categoryNavigation
    ?.querySelectorAll(
      ".category-chip"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const category =
            button.dataset.category || "";

          setActiveCategory(category);

          state.currentCategory =
            category;

          loadLatestNews({
            category
          });

          if (category) {
            scrollToCategory(
              category
            );
          }
        }
      );
    });


  /* Category section buttons */

  document
    .querySelectorAll(
      "[data-category-link]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const category =
            button.dataset
              .categoryLink;

          setActiveCategory(category);

          state.currentCategory =
            category;

          loadLatestNews({
            category
          });

          scrollToCategory(category);
        }
      );
    });


  /* Side menu links */

  document
    .querySelectorAll(
      ".side-navigation a"
    )
    .forEach((link) => {

      link.addEventListener(
        "click",
        closeMenu
      );
    });


  /* ESC */

  document.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "Escape") {
        closeMenu();
        closeLoginModal();
        closeAccountModal();
      }

    }
  );
}


/* =========================================================
   API
========================================================= */

async function apiRequest(
  endpoint,
  options = {}
) {

  const headers = {
    ...(options.body
      ? {
          "Content-Type":
            "application/json"
        }
      : {}),
    ...(options.headers || {})
  };


  if (state.token) {
    headers.Authorization =
      `Bearer ${state.token}`;
  }


  const response =
    await fetch(
      `${CONFIG.API_BASE}${endpoint}`,
      {
        ...options,
        headers
      }
    );


  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }


  if (!response.ok) {

    const message =
      data?.message ||
      `API error ${response.status}`;

    throw new Error(message);
  }


  return data;
}


/* =========================================================
   AUTH STORAGE
========================================================= */

function loadStoredAuth() {

  const token =
    localStorage.getItem(
      CONFIG.STORAGE.TOKEN
    );

  const user =
    localStorage.getItem(
      CONFIG.STORAGE.USER
    );


  if (token) {
    state.token = token;
  }


  if (user) {

    try {
      state.user = JSON.parse(user);
    } catch {
      state.user = null;
    }

  }
}


/* =========================================================
   VERIFY SESSION
========================================================= */

async function verifySession() {

  if (!state.token) {
    return false;
  }


  try {

    const data =
      await apiRequest(
        "/auth/me"
      );


    if (data?.user) {

      state.user =
        data.user;

      localStorage.setItem(
        CONFIG.STORAGE.USER,
        JSON.stringify(
          data.user
        )
      );

      updateAccountUI();

      return true;
    }


  } catch (error) {

    console.warn(
      "Session invalid:",
      error.message
    );

    clearAuth();

  }


  return false;
}


/* =========================================================
   AUTH UI
========================================================= */

function updateAccountUI() {

  if (!state.user) {

    if (DOM.accountText) {
      DOM.accountText.textContent =
        "Đăng nhập";
    }

    if (DOM.accountAvatar) {
      DOM.accountAvatar.textContent =
        "👤";
    }

    return;
  }


  const name =
    state.user.displayName ||
    state.user.kaisoulId ||
    "Người dùng";


  if (DOM.accountText) {
    DOM.accountText.textContent =
      name;
  }


  if (
    state.user.avatar &&
    DOM.accountAvatar
  ) {

    DOM.accountAvatar.innerHTML =
      `<img src="${escapeAttribute(
        state.user.avatar
      )}" alt="">`;

  } else if (DOM.accountAvatar) {

    DOM.accountAvatar.textContent =
      "👤";
  }


  if (DOM.profileName) {
    DOM.profileName.textContent =
      name;
  }


  if (DOM.profileKaisoulId) {
    DOM.profileKaisoulId.textContent =
      state.user.kaisoulId ||
      "KAISOUL ID";
  }


  if (DOM.profileAvatar) {

    if (state.user.avatar) {

      DOM.profileAvatar.innerHTML =
        `<img src="${escapeAttribute(
          state.user.avatar
        )}" alt="">`;

    } else {

      DOM.profileAvatar.textContent =
        "👤";
    }
  }
}


/* =========================================================
   LOGIN
========================================================= */

function handleAccountClick() {

  if (state.user) {
    openAccountModal();
  } else {
    openLoginModal();
  }
}


/*
   NEWS không thu thập mật khẩu KAISOUL ID.

   Việc xác thực phải được thực hiện
   bởi KAISOUL ID.
*/

function loginWithKaisoulID() {

  const returnUrl =
    window.location.href;

  const url =
    new URL(
      CONFIG.KAISOUL_ID_URL
    );


  /*
     Các tham số này chỉ là cơ chế
     điều hướng.

     KAISOUL ID thực tế cần có endpoint
     OAuth/OIDC/session callback để
     xác thực an toàn.
  */

  url.searchParams.set(
    "redirect",
    returnUrl
  );

  url.searchParams.set(
    "service",
    "kaisoul-news"
  );


  window.location.href =
    url.toString();
}


function registerKaisoulID() {

  window.location.href =
    CONFIG.KAISOUL_ID_URL;
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

  clearAuth();

  closeAccountModal();

  updateAccountUI();

  showToast(
    "Đã đăng xuất KAISOUL ID."
  );
}


function clearAuth() {

  state.token = null;
  state.user = null;

  localStorage.removeItem(
    CONFIG.STORAGE.TOKEN
  );

  localStorage.removeItem(
    CONFIG.STORAGE.USER
  );
}


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

  const savedTheme =
    localStorage.getItem(
      CONFIG.STORAGE.THEME
    );


  if (
    savedTheme === "dark" ||
    savedTheme === "light"
  ) {

    applyTheme(savedTheme);

    return;
  }


  applySystemTheme();
}


function applyTheme(theme) {

  document.documentElement
    .setAttribute(
      "data-theme",
      theme
    );
}


function applySystemTheme() {

  const dark =
    window.matchMedia &&
    window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;


  applyTheme(
    dark ? "dark" : "light"
  );
}


window.addEventListener(
  "storage",
  (event) => {

    if (
      event.key ===
      CONFIG.STORAGE.THEME
    ) {

      initializeTheme();
    }

  }
);


/* =========================================================
   SETTINGS
========================================================= */

async function loadSettings() {

  try {

    const data =
      await apiRequest(
        "/settings"
      );


    if (
      data?.settings?.siteName
    ) {

      document.title =
        data.settings.siteName;
    }


    if (
      data?.settings?.description
    ) {

      const meta =
        document.querySelector(
          'meta[name="description"]'
        );

      if (meta) {
        meta.setAttribute(
          "content",
          data.settings.description
        );
      }
    }


  } catch (error) {

    console.warn(
      "Settings unavailable:",
      error.message
    );
  }
}


/* =========================================================
   CATEGORIES
========================================================= */

async function loadCategories() {

  try {

    const data =
      await apiRequest(
        "/categories"
      );


    state.categories =
      Array.isArray(
        data?.categories
      )
        ? data.categories
        : [];


  } catch (error) {

    console.warn(
      "Categories unavailable:",
      error.message
    );
  }
}


/* =========================================================
   HOME NEWS
========================================================= */

async function loadHomeNews(
  showRefresh = false
) {

  if (state.loading) {
    return;
  }


  state.loading = true;


  if (showRefresh) {

    DOM.refreshButton?.classList.add(
      "loading"
    );
  }


  try {

    await Promise.all([
      loadHeroNews(),
      loadLatestNews({
        category:
          state.currentCategory
      }),
      loadFeaturedNews(),
      loadPopularNews(),
      loadCategorySections(),
      loadBreakingNews()
    ]);


    hideNoResults();


  } catch (error) {

    console.error(
      "Home loading error:",
      error
    );

    showToast(
      "Không thể tải tin tức."
    );

  } finally {

    state.loading = false;

    DOM.refreshButton?.classList.remove(
      "loading"
    );
  }
}


/* =========================================================
   HERO
========================================================= */

async function loadHeroNews() {

  try {

    const data =
      await apiRequest(
        "/articles?status=published"
      );


    const articles =
      Array.isArray(
        data?.articles
      )
        ? data.articles
        : [];


    state.articles =
      articles;


    renderHeroNews(
      articles.slice(0, 3)
    );


  } catch (error) {

    console.error(
      "Hero loading error:",
      error
    );

    renderEmpty(
      DOM.heroNews,
      "Chưa có bài viết."
    );
  }
}


function renderHeroNews(
  articles
) {

  if (!articles.length) {

    renderEmpty(
      DOM.heroNews,
      "Chưa có bài viết."
    );

    return;
  }


  DOM.heroNews.innerHTML =
    articles
      .map(
        (article) =>
          createHeroCard(
            article
          )
      )
      .join("");
}


/* =========================================================
   LATEST
========================================================= */

async function loadLatestNews({
  category = "",
  search = ""
} = {}) {

  try {

    let endpoint =
      "/articles?status=published";


    if (category) {

      endpoint +=
        `&category=${encodeURIComponent(
          category
        )}`;
    }


    if (search) {

      endpoint +=
        `&search=${encodeURIComponent(
          search
        )}`;
    }


    const data =
      await apiRequest(endpoint);


    const articles =
      Array.isArray(
        data?.articles
      )
        ? data.articles
        : [];


    renderNewsGrid(
      DOM.latestNews,
      articles
    );


    if (
      search &&
      articles.length === 0
    ) {

      DOM.noResults.hidden =
        false;

    } else {

      DOM.noResults.hidden =
        true;
    }


  } catch (error) {

    console.error(
      "Latest news error:",
      error
    );

    renderEmpty(
      DOM.latestNews,
      "Không thể tải tin tức."
    );
  }
}


/* =========================================================
   FEATURED
========================================================= */

async function loadFeaturedNews() {

  try {

    const data =
      await apiRequest(
        "/articles?status=published&featured=true"
      );


    const articles =
      Array.isArray(
        data?.articles
      )
        ? data.articles
        : [];


    state.featuredArticles =
      articles;


    renderNewsGrid(
      DOM.featuredNews,
      articles
    );


  } catch (error) {

    renderEmpty(
      DOM.featuredNews,
      "Chưa có tin nổi bật."
    );
  }
}


/* =========================================================
   POPULAR
========================================================= */

async function loadPopularNews() {

  try {

    const data =
      await apiRequest(
        "/articles?status=published"
      );


    let articles =
      Array.isArray(
        data?.articles
      )
        ? data.articles
        : [];


    /*
       Không tạo view giả.

       Chỉ sắp xếp theo viewCount
       do backend cung cấp.
    */

    articles =
      [...articles]
        .sort(
          (a, b) =>
            Number(
              b.viewCount || 0
            ) -
            Number(
              a.viewCount || 0
            )
        )
        .slice(0, 8);


    state.popularArticles =
      articles;


    renderNewsGrid(
      DOM.popularNews,
      articles
    );


  } catch (error) {

    renderEmpty(
      DOM.popularNews,
      "Chưa có dữ liệu phổ biến."
    );
  }
}


/* =========================================================
   CATEGORY SECTIONS
========================================================= */

async function loadCategorySections() {

  const containers =
    document.querySelectorAll(
      "[data-category-news]"
    );


  for (
    const container of containers
  ) {

    const category =
      container.dataset.categoryNews;


    if (!category) {
      continue;
    }


    try {

      const data =
        await apiRequest(
          `/articles?status=published&category=${encodeURIComponent(
            category
          )}`
        );


      const articles =
        Array.isArray(
          data?.articles
        )
          ? data.articles.slice(0, 6)
          : [];


      if (!articles.length) {

        renderEmpty(
          container,
          "Chưa có bài viết."
        );

        continue;
      }


      container.innerHTML =
        articles
          .map(
            (article) =>
              createNewsCard(
                article
              )
          )
          .join("");


    } catch (error) {

      renderEmpty(
        container,
        "Không thể tải dữ liệu."
      );
    }
  }
}


/* =========================================================
   BREAKING NEWS
========================================================= */

async function loadBreakingNews() {

  try {

    const data =
      await apiRequest(
        "/articles?status=published&breaking=true"
      );


    const articles =
      Array.isArray(
        data?.articles
      )
        ? data.articles
        : [];


    if (!articles.length) {

      DOM.breakingBar.hidden =
        true;

      return;
    }


    const article =
      articles[0];


    DOM.breakingBar.hidden =
      false;


    DOM.breakingLink.textContent =
      article.title ||
      "Tin nóng";


    DOM.breakingLink.href =
      articleUrl(article);


  } catch {

    DOM.breakingBar.hidden =
      true;
  }
}


/* =========================================================
   RENDER NEWS
========================================================= */

function renderNewsGrid(
  container,
  articles
) {

  if (!container) {
    return;
  }


  if (!articles.length) {

    renderEmpty(
      container,
      "Chưa có bài viết."
    );

    return;
  }


  container.innerHTML =
    articles
      .map(
        (article) =>
          createNewsCard(
            article
          )
      )
      .join("");
}


function renderEmpty(
  container,
  message
) {

  if (!container) {
    return;
  }


  container.innerHTML =
    `<div class="empty-state">
      ${escapeHTML(message)}
    </div>`;
}


/* =========================================================
   CARD BUILDERS
========================================================= */

function createHeroCard(
  article
) {

  const title =
    article.title ||
    "Không có tiêu đề";


  const category =
    getCategoryName(
      article.categoryId
    );


  const image =
    safeImage(
      article.cover
    );


  return `
    <a
      class="hero-card"
      href="${articleUrl(article)}"
      data-article-id="${escapeAttribute(
        article.id || ""
      )}"
    >

      <img
        class="hero-card-image"
        src="${image}"
        alt="${escapeAttribute(
          title
        )}"
        loading="lazy"
        onerror="this.style.display='none'"
      >

      <div class="hero-card-content">

        <span class="hero-card-category">
          ${escapeHTML(category)}
        </span>

        <h2 class="hero-card-title">
          ${escapeHTML(title)}
        </h2>

        <div class="hero-card-meta">
          <span>
            ${formatDate(
              article.publishedAt ||
              article.createdAt
            )}
          </span>

          <span>•</span>

          <span>
            ${Number(
              article.viewCount || 0
            )} lượt xem
          </span>
        </div>

      </div>

    </a>
  `;
}


function createNewsCard(
  article
) {

  const title =
    article.title ||
    "Không có tiêu đề";


  const category =
    getCategoryName(
      article.categoryId
    );


  const image =
    safeImage(
      article.cover
    );


  return `
    <article class="news-card">

      <a
        href="${articleUrl(article)}"
        aria-label="${escapeAttribute(
          title
        )}"
      >

        <div class="news-card-image-wrap">

          <img
            class="news-card-image"
            src="${image}"
            alt="${escapeAttribute(
              title
            )}"
            loading="lazy"
            onerror="this.style.display='none'"
          >

        </div>

        <div class="news-card-content">

          <div class="news-card-category">
            ${escapeHTML(category)}
          </div>

          <h3 class="news-card-title">
            ${escapeHTML(title)}
          </h3>

          ${
            article.description
              ? `
                <p class="news-card-description">
                  ${escapeHTML(
                    article.description
                  )}
                </p>
              `
              : ""
          }

          <div class="news-card-meta">

            <span>
              ${formatDate(
                article.publishedAt ||
                article.createdAt
              )}
            </span>

            <span class="separator">
              •
            </span>

            <span>
              ${Number(
                article.viewCount || 0
              )} lượt xem
            </span>

          </div>

        </div>

      </a>

    </article>
  `;
}


/* =========================================================
   ARTICLE URL
========================================================= */

function articleUrl(
  article
) {

  if (article.slug) {

    return `article.html?slug=${encodeURIComponent(
      article.slug
    )}`;
  }


  if (article.id) {

    return `article.html?id=${encodeURIComponent(
      article.id
    )}`;
  }


  return "article.html";
}


/* =========================================================
   SEARCH
========================================================= */

async function handleSearch(
  event
) {

  event.preventDefault();


  const keyword =
    DOM.searchInput?.value.trim() ||
    "";


  state.searchKeyword =
    keyword;


  localStorage.setItem(
    CONFIG.STORAGE.SEARCH,
    keyword
  );


  if (!keyword) {

    await loadLatestNews({
      category:
        state.currentCategory
    });

    return;
  }


  await loadLatestNews({
    search: keyword
  });


  document
    .getElementById("latest")
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
}


/* =========================================================
   CATEGORY
========================================================= */

function setActiveCategory(
  category
) {

  DOM.categoryNavigation
    ?.querySelectorAll(
      ".category-chip"
    )
    .forEach((button) => {

      const value =
        button.dataset.category ||
        "";

      button.classList.toggle(
        "active",
        value === category
      );
    });
}


function scrollToCategory(
  category
) {

  const target =
    document.getElementById(
      category
    );


  if (target) {

    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}


/* =========================================================
   MENU
========================================================= */

function openMenu() {

  DOM.sideMenu?.classList.add(
    "open"
  );

  DOM.menuOverlay?.classList.add(
    "visible"
  );

  document.body.classList.add(
    "menu-open"
  );
}


function closeMenu() {

  DOM.sideMenu?.classList.remove(
    "open"
  );

  DOM.menuOverlay?.classList.remove(
    "visible"
  );

  document.body.classList.remove(
    "menu-open"
  );
}


/* =========================================================
   SEARCH PANEL
========================================================= */

function toggleSearch() {

  DOM.searchPanel?.classList.toggle(
    "open"
  );


  if (
    DOM.searchPanel?.classList.contains(
      "open"
    )
  ) {

    setTimeout(
      () =>
        DOM.searchInput?.focus(),
      50
    );
  }
}


/* =========================================================
   LOGIN MODAL
========================================================= */

function openLoginModal() {

  if (!DOM.loginModal) {
    return;
  }


  DOM.loginModal.hidden =
    false;

  document.body.classList.add(
    "menu-open"
  );
}


function closeLoginModal() {

  if (!DOM.loginModal) {
    return;
  }


  DOM.loginModal.hidden =
    true;

  document.body.classList.remove(
    "menu-open"
  );
}


/* =========================================================
   ACCOUNT MODAL
========================================================= */

function openAccountModal() {

  if (!DOM.accountModal) {
    return;
  }


  updateAccountUI();

  DOM.accountModal.hidden =
    false;

  document.body.classList.add(
    "menu-open"
  );
}


function closeAccountModal() {

  if (!DOM.accountModal) {
    return;
  }


  DOM.accountModal.hidden =
    true;

  document.body.classList.remove(
    "menu-open"
  );
}


/* =========================================================
   KAISOUL PROFILE
========================================================= */

function openKaisoulProfile() {

  /*
     Khi KAISOUL ID có profile URL thật,
     có thể thay bằng URL profile cụ thể.
  */

  window.location.href =
    CONFIG.KAISOUL_ID_URL;
}


/* =========================================================
   SAVED ARTICLES
========================================================= */

function openSavedArticles() {

  if (!state.user) {

    closeAccountModal();

    openLoginModal();

    return;
  }


  /*
     Trang bookmark riêng có thể được
     bổ sung sau.

     Không tạo dữ liệu giả ở frontend.
  */

  showToast(
    "Tính năng bài viết đã lưu sẽ lấy dữ liệu từ tài khoản KAISOUL ID."
  );
}


/* =========================================================
   VISITOR ID
========================================================= */

function createVisitorId() {

  let visitorId =
    localStorage.getItem(
      CONFIG.STORAGE.VISITOR
    );


  if (!visitorId) {

    visitorId =
      generateUUID();


    localStorage.setItem(
      CONFIG.STORAGE.VISITOR,
      visitorId
    );
  }
}


function getVisitorId() {

  return localStorage.getItem(
    CONFIG.STORAGE.VISITOR
  );
}


/* =========================================================
   VIEW TRACKING
========================================================= */

async function registerArticleView(
  articleId
) {

  if (!articleId) {
    return;
  }


  try {

    const headers = {};


    if (!state.token) {

      headers[
        "x-visitor-id"
      ] =
        getVisitorId();
    }


    await apiRequest(
      `/articles/${encodeURIComponent(
        articleId
      )}/view`,
      {
        method: "POST",
        headers
      }
    );


  } catch (error) {

    console.warn(
      "View tracking failed:",
      error.message
    );
  }
}


/* =========================================================
   AUTH GATE
========================================================= */

function requireLogin() {

  if (state.user) {
    return true;
  }


  openLoginModal();

  showToast(
    "Hãy đăng nhập bằng KAISOUL ID."
  );


  return false;
}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function showToast(
  message
) {

  if (!DOM.toast) {
    return;
  }


  DOM.toastMessage.textContent =
    message;


  DOM.toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        DOM.toast.classList.remove(
          "show"
        );

      },
      2800
    );
}


/* =========================================================
   DATE
========================================================= */

function formatDate(
  value
) {

  if (!value) {
    return "Chưa xác định";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "Chưa xác định";
  }


  return new Intl.DateTimeFormat(
    "vi-VN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}


/* =========================================================
   CATEGORY NAME
========================================================= */

function getCategoryName(
  categoryId
) {

  const found =
    state.categories.find(
      (category) =>
        category.id === categoryId ||
        category.slug === categoryId
    );


  if (found) {

    return (
      found.name ||
      found.title ||
      categoryId ||
      "Tin tức"
    );
  }


  const fallback = {
    vietnam: "Việt Nam",
    world: "Thế giới",
    sports: "Thể thao",
    technology: "Công nghệ",
    entertainment: "Giải trí",
    economy: "Kinh tế"
  };


  return (
    fallback[categoryId] ||
    categoryId ||
    "Tin tức"
  );
}


/* =========================================================
   IMAGE
========================================================= */

function safeImage(
  url
) {

  if (
    typeof url !== "string" ||
    !url.trim()
  ) {

    /*
       Không dùng ảnh giả.
       Khi chưa có ảnh thật,
       dùng nền trong CSS.
    */

    return "";
  }


  return escapeAttribute(
    url.trim()
  );
}


/* =========================================================
   ESCAPE
========================================================= */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


function escapeAttribute(
  value
) {

  return escapeHTML(
    value
  );
}


/* =========================================================
   UUID
========================================================= */

function generateUUID() {

  if (
    crypto &&
    typeof crypto.randomUUID ===
      "function"
  ) {

    return crypto.randomUUID();
  }


  return (
    "visitor_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .substring(2, 12)
  );
}


/* =========================================================
   NO RESULTS
========================================================= */

function hideNoResults() {

  if (DOM.noResults) {
    DOM.noResults.hidden =
      true;
  }
}


/* =========================================================
   GLOBAL HELPERS
========================================================= */

window.KAISOUL_NEWS = {

  state,

  config: CONFIG,

  requireLogin,

  showToast,

  registerArticleView,

  loadHomeNews,

  loadLatestNews,

  logout
};


/* =========================================================
   END
========================================================= */
