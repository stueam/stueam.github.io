(function () {
const state = {
  profile: null,
  resume: null,
  research: [],
  news: [],
  papers: [],
  blog: [],
  activeCategory: "all"
};

const categories = [
  { id: "all", label: "All" },
  { id: "notes", label: "Notes" },
  { id: "writing", label: "Writing" },
  { id: "projects", label: "Projects" }
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

document.addEventListener("DOMContentLoaded", init);

async function init() {
  $("#year").textContent = new Date().getFullYear();
  bindNavigation();
  bindReader();

  const [profile, resume, research, news, papers, blog] = await Promise.all([
    getJson("data/profile.json", {}),
    getJson("data/resume.json", {}),
    getJson("data/research.json", []),
    getJson("data/news.json", []),
    getJson("data/papers.json", { papers: [] }),
    getJson("data/blog-index.json", { entries: [] })
  ]);

  state.profile = profile;
  state.resume = resume;
  state.research = Array.isArray(research) ? research : [];
  state.news = Array.isArray(news) ? news : [];
  state.papers = Array.isArray(papers) ? papers : papers.papers || [];
  state.blog = Array.isArray(blog.entries) ? blog.entries : [];

  renderProfile();
  renderResearch();
  renderNews();
  renderResume();
  renderPapers();
  renderCategories();
  renderBlogList();
  updateRoute();
}

async function getJson(url, fallback) {
  try {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) throw new Error(url);
    return await response.json();
  } catch {
    return fallback;
  }
}

function bindNavigation() {
  $$(".nav-tab").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.hash = `#${button.dataset.routeTarget}`;
    });
  });
  window.addEventListener("hashchange", updateRoute);
}

function parseRoute() {
  const raw = window.location.hash.replace(/^#/, "");
  const parts = raw.split("/");
  const active = parts[0] || "main";
  const valid = new Set(["main", "info", "scholar", "blog", "doc"]);
  return {
    active: valid.has(active) ? active : "main",
    entryId: decodeURIComponent(parts[1] || "")
  };
}

function updateRoute() {
  const { active, entryId } = parseRoute();

  $$(".view").forEach((view) => {
    view.hidden = view.id !== `view-${active}`;
  });

  $$(".nav-tab").forEach((button) => {
    const selected = button.dataset.routeTarget === (active === "doc" ? "blog" : active);
    button.classList.toggle("is-active", selected);
  });

  if (active === "doc") {
    renderDoc(entryId);
    return;
  }

  window.scrollTo({ top: 0, behavior: "auto" });
}

function renderProfile() {
  const profile = state.profile || {};
  $("#profile-name").textContent = profile.displayName || "Your Name";
  $("#profile-headline").textContent = profile.headline || "Short headline placeholder";
  $("#profile-bio").textContent = profile.bio || "Replace this area with your own introduction.";
  const avatar = $("#profile-avatar");
  if (avatar && profile.avatar) avatar.src = profile.avatar;

  const quickFacts = Array.isArray(profile.quickFacts) ? profile.quickFacts : [];
  $("#quick-facts").innerHTML = quickFacts.length
    ? quickFacts.map((item) => `<div class="fact-item">${escapeHtml(item)}</div>`).join("")
    : emptyState("Add quick facts in data/profile.json");

  const socials = Array.isArray(profile.socials) ? profile.socials : [];
  $("#social-links").innerHTML = socials.length
    ? socials
        .map(
          (item) =>
            `<a class="social-link" href="${escapeAttr(item.url || "#")}" target="_blank" rel="noreferrer">${escapeHtml(item.label || "Link")}</a>`
        )
        .join("")
    : emptyState("Add social links in data/profile.json");
}

function renderResearch() {
  const target = $("#research-list");
  if (!target) return;
  if (!state.research.length) {
    target.innerHTML = emptyState("Add research entries in data/research.json");
    return;
  }

  target.innerHTML = state.research
    .map(
      (item) => `
        <article class="research-item">
          <div class="research-main">
            <div class="research-topline">
              <div>
                <p class="research-kicker">${escapeHtml(item.subtitle || "Research project")}</p>
                <h3>${escapeHtml(item.title || "Untitled project")}</h3>
              </div>
              <time>${escapeHtml(item.date || "")}</time>
            </div>
            <p>${escapeHtml(item.body || "")}</p>
            ${(item.tags || []).length ? `<div class="research-tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
          </div>
          ${item.url ? `<a class="text-button research-link" href="${escapeAttr(item.url)}" target="_blank" rel="noreferrer">Project</a>` : ""}
        </article>
      `
    )
    .join("");
}

function renderNews() {
  const target = $("#news-list");
  if (!state.news.length) {
    target.innerHTML = emptyState("Add entries in data/news.json");
    return;
  }

  target.innerHTML = state.news
    .map(
      (item) => `
        <article class="news-item">
          <time datetime="${escapeAttr(item.date || "")}"><h2>${escapeHtml(item.date || "")}</h2></time>
          <div>
            <h3>${escapeHtml(item.title || "Untitled news")}</h3>
            <p>${escapeHtml(item.body || "")}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderResume() {
  const resume = state.resume || {};
  const sections = Array.isArray(resume.sections) ? resume.sections : [];

  $("#resume-header").innerHTML = `
    <h2>${escapeHtml(resume.name || "Your Name")}</h2>
    <div class="resume-contact">
      <span>${escapeHtml(resume.affiliation || "Affiliation placeholder")}</span>
      <a href="mailto:${escapeAttr(resume.email || "")}">${escapeHtml(resume.email || "email@example.com")}</a>
      ${resume.phone ? `<a href="tel:${escapeAttr(resume.phone.replace(/\s+/g, ""))}">${escapeHtml(resume.phone)}</a>` : ""}
    </div>
  `;

  $("#resume-toc-links").innerHTML = sections.length
    ? sections
        .map((section) => `<a href="#info/${escapeAttr(section.id || "")}">${escapeHtml(section.title || "Section")}</a>`)
        .join("")
    : emptyState("Add resume sections in data/resume.json");

  $("#resume-sections").innerHTML = sections.length
    ? sections
        .map(
          (section) => `
            <section class="resume-section" id="${escapeAttr(section.id || "")}">
              <h2>${escapeHtml(section.title || "Section")}</h2>
              ${Array.isArray(section.entries) ? section.entries.map(renderResumeEntry).join("") : ""}
            </section>
          `
        )
        .join("")
    : "";
}

function renderResumeEntry(entry) {
  const bullets = Array.isArray(entry.bullets) ? entry.bullets : [];
  const title = entry.url
    ? `<a href="${escapeAttr(entry.url)}" target="_blank" rel="noreferrer">${escapeHtml(entry.title || "Entry title")}</a>`
    : escapeHtml(entry.title || "Entry title");
  return `
    <article class="resume-entry">
      <div class="entry-topline">
        <h3>${title}</h3>
        <time>${escapeHtml(entry.date || "")}</time>
      </div>
      <div class="entry-subline">
        ${entry.subtitle ? `<span>${renderInline(entry.subtitle)}</span>` : ""}
        ${entry.meta ? `<span>${escapeHtml(entry.meta)}</span>` : ""}
      </div>
      ${bullets.length ? `<ul>${bullets.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>` : ""}
    </article>
  `;
}

function renderPapers() {
  const target = $("#paper-list");
  if (!state.papers.length) {
    target.innerHTML = emptyState("Add papers in data/papers.json");
    return;
  }

  target.innerHTML = state.papers
    .map(
      (paper) => `
        <article class="paper-item">
          <div>
            <span>${escapeHtml(paper.date || "")}</span>
            <h2>${escapeHtml(paper.title || "Untitled paper")}</h2>
            <p>${escapeHtml(paper.abstract || "")}</p>
          </div>
          <a class="text-button" href="${escapeAttr(paper.url || "#")}" target="_blank" rel="noreferrer">Open</a>
        </article>
      `
    )
    .join("");
}

function renderCategories() {
  $("#blog-categories").innerHTML = categories
    .map(
      (category) => `
        <button class="category-button ${category.id === state.activeCategory ? "is-active" : ""}" type="button" data-category="${category.id}">
          <span>${escapeHtml(category.label)}</span>
          <strong>${countCategory(category.id)}</strong>
        </button>
      `
    )
    .join("");

  $$(".category-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category;
      renderCategories();
      renderBlogList();
    });
  });
}

function renderBlogList() {
  const target = $("#blog-list");
  const entries = state.blog.filter((entry) => {
    if (state.activeCategory === "all") return true;
    return (entry.category || "") === state.activeCategory;
  });

  if (!entries.length) {
    target.innerHTML = emptyState("Add blog entries in data/blog-index.json");
    return;
  }

  target.innerHTML = entries
    .map(
      (entry) => `
        <article class="blog-item">
          <div>
            <div class="item-meta">
              <span>${escapeHtml(entry.category || "")}</span>
              <time datetime="${escapeAttr(entry.date || "")}">${escapeHtml(entry.date || "")}</time>
            </div>
            <h2>${escapeHtml(entry.title || "Untitled post")}</h2>
            <p>${escapeHtml(entry.summary || "")}</p>
          </div>
          <button class="text-button" type="button" data-entry-id="${escapeAttr(entry.id || "")}">Read</button>
        </article>
      `
    )
    .join("");

  $$("[data-entry-id]", target).forEach((button) => {
    button.addEventListener("click", () => {
      window.location.hash = `#doc/${encodeURIComponent(button.dataset.entryId)}`;
    });
  });
}

function countCategory(categoryId) {
  if (categoryId === "all") return state.blog.length;
  return state.blog.filter((entry) => (entry.category || "") === categoryId).length;
}

function bindReader() {
  const closeButton = $("#reader-close");
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      $("#blog-reader").hidden = true;
    });
  }

  const backButton = $("#doc-back");
  if (backButton) {
    backButton.addEventListener("click", () => {
      window.location.hash = "#blog";
    });
  }
}

function renderDoc(entryId) {
  const entry = state.blog.find((item) => item.id === entryId);
  $("#doc-meta").innerHTML = entry
    ? `
        <div class="item-meta">
          <span>${escapeHtml(entry.category || "")}</span>
          <time datetime="${escapeAttr(entry.date || "")}">${escapeHtml(entry.date || "")}</time>
        </div>
        <h1 id="doc-title">${escapeHtml(entry.title || "Untitled post")}</h1>
      `
    : `<h1 id="doc-title">Document not found</h1>`;

  $("#doc-content").innerHTML = entry
    ? `<div class="loading-line">Connect this route to your markdown or document content later.</div>`
    : emptyState("This document does not exist yet.");

  $("#doc-toc").innerHTML = entry ? emptyState("Add headings when document rendering is connected.") : "";
}

function renderInline(value) {
  return simpleInline(String(value ?? ""));
}

function simpleInline(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
})();
