// Focus Feed: hides the X and LinkedIn feeds + notifications while leaving
// posting and messages alone. The feed can be unlocked for the current tab
// by keeping the page open and focused for UNLOCK_SECONDS.
(() => {
  "use strict";

  const UNLOCK_SECONDS = 15;
  const root = document.documentElement;

  const host = location.hostname;
  const site = /(^|\.)linkedin\.com$/.test(host) ? "li" : "x";

  const MESSAGES_URL = site === "x" ? "/messages" : "/messaging/";

  function pageType() {
    const path = location.pathname;
    if (site === "x") {
      if (path === "/" || path === "/home" || path.startsWith("/explore")) return "feed";
      if (path.startsWith("/notifications")) return "notifications";
    } else {
      if (path === "/" || path === "/feed" || path === "/feed/") return "feed";
      if (path.startsWith("/notifications")) return "notifications";
    }
    return "other";
  }

  // "locked" -> "counting" -> "unlocked". Unlocking lasts until the tab is
  // reloaded or "Hide feed again" is clicked.
  let state = "locked";
  let countdownStart = 0;
  let resetNotice = false;
  let lastUrl = "";
  let lastRender = "";

  root.setAttribute("data-ff-site", site);
  root.setAttribute("data-ff-page", pageType());

  // ---------- card UI ----------

  let card = null;

  function ensureCard() {
    if (!document.body) return null;
    if (!card) {
      card = document.createElement("div");
      card.id = "ff-card";
      card.setAttribute("role", "status");
      card.hidden = true;
      card.addEventListener("click", onCardClick);
    }
    if (!card.isConnected) document.body.appendChild(card);
    return card;
  }

  function onCardClick(event) {
    const action = event.target.closest("button")?.dataset.action;
    if (action === "start") startCountdown();
    else if (action === "cancel") cancelCountdown(false);
    else if (action === "relock") relock();
    else if (action === "messages") location.assign(MESSAGES_URL);
  }

  function render() {
    const el = ensureCard();
    if (!el) return;
    const page = root.getAttribute("data-ff-page");

    let key;
    let html = "";
    let compact = false;

    if (page === "notifications") {
      key = "notifications";
      html = `
        <p class="ff-title">Notifications are hidden</p>
        <p class="ff-text">Messages still work.</p>
        <button type="button" data-action="messages">Open messages</button>`;
    } else if (page !== "feed") {
      key = "none";
    } else if (state === "unlocked") {
      key = "unlocked";
      compact = true;
      html = `<button type="button" class="ff-ghost" data-action="relock">Hide feed again</button>`;
    } else if (state === "counting") {
      const remaining = Math.max(0, UNLOCK_SECONDS - (Date.now() - countdownStart) / 1000);
      const pct = 100 - (remaining / UNLOCK_SECONDS) * 100;
      key = `counting:${Math.ceil(remaining)}:${Math.round(pct)}`;
      html = `
        <p class="ff-title">Showing feed in ${Math.ceil(remaining)}s</p>
        <p class="ff-text">Stay on this page. Switching tabs or apps resets the timer.</p>
        <div class="ff-bar"><div style="width:${pct}%"></div></div>
        <button type="button" class="ff-ghost" data-action="cancel">Never mind</button>`;
    } else {
      key = `locked:${resetNotice}`;
      html = `
        <p class="ff-title">Feed hidden</p>
        <p class="ff-text">${
          resetNotice
            ? "You left the page, so the timer reset."
            : "You can still post. Want the feed anyway? Wait " + UNLOCK_SECONDS + " seconds."
        }</p>
        <button type="button" data-action="start">Show feed</button>`;
    }

    if (key === lastRender) return;
    lastRender = key;

    el.hidden = key === "none";
    el.classList.toggle("ff-compact", compact);
    if (key === "none") return;

    // Only swap the markup when the layout changes, so the progress bar can
    // animate smoothly between ticks.
    const bar = el.querySelector(".ff-bar > div");
    const title = el.querySelector(".ff-title");
    if (state === "counting" && bar && title && key.startsWith("counting")) {
      const remaining = Math.max(0, UNLOCK_SECONDS - (Date.now() - countdownStart) / 1000);
      title.textContent = `Showing feed in ${Math.ceil(remaining)}s`;
      bar.style.width = `${100 - (remaining / UNLOCK_SECONDS) * 100}%`;
    } else {
      el.innerHTML = html;
    }
  }

  // ---------- unlock flow ----------

  function startCountdown() {
    if (document.visibilityState !== "visible") return;
    state = "counting";
    countdownStart = Date.now();
    resetNotice = false;
    lastRender = "";
    render();
  }

  function cancelCountdown(leftPage) {
    if (state !== "counting") return;
    state = "locked";
    resetNotice = leftPage;
    lastRender = "";
    render();
  }

  function unlock() {
    state = "unlocked";
    root.setAttribute("data-ff-unlocked", "");
    render();
  }

  function relock() {
    state = "locked";
    resetNotice = false;
    root.removeAttribute("data-ff-unlocked");
    render();
  }

  const leftPage = () => cancelCountdown(true);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") leftPage();
  });
  window.addEventListener("blur", leftPage);
  window.addEventListener("pagehide", leftPage);

  // ---------- main loop ----------
  // Both sites are single-page apps, so poll for URL changes rather than
  // relying on page loads. This also strips the "(3) " unread count that
  // both sites prepend to the tab title.

  function tick() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      root.setAttribute("data-ff-page", pageType());
      if (state === "counting") cancelCountdown(true);
    }

    if (state === "counting" && Date.now() - countdownStart >= UNLOCK_SECONDS * 1000) {
      unlock();
    }

    const title = document.title;
    const cleaned = title.replace(/^\(\d+\+?\)\s*/, "");
    if (cleaned !== title) document.title = cleaned;

    render();
  }

  setInterval(tick, 250);
  document.addEventListener("DOMContentLoaded", tick);
  tick();
})();
