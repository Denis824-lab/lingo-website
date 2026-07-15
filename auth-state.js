import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { auth } from "./firebase-config.js";

const CONTROLS_SELECTOR = "[data-auth-controls]";
const AVATAR_SIZE = 30;

function createSvgIcon(pathD) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "currentColor");
  path.setAttribute("d", pathD);
  svg.appendChild(path);
  return svg;
}

function getInitial(email) {
  if (!email) return "?";
  return email.charAt(0).toUpperCase();
}

function buildAvatar(user) {
  if (user.photoURL) {
    const img = document.createElement("img");
    img.src = user.photoURL;
    img.alt = "";
    img.width = AVATAR_SIZE;
    img.height = AVATAR_SIZE;
    img.referrerPolicy = "no-referrer";
    img.className = "auth-avatar__img";
    return img;
  }
  const span = document.createElement("span");
  span.className = "auth-avatar__initial";
  span.textContent = getInitial(user.email);
  span.setAttribute("aria-hidden", "true");
  return span;
}

function buildUnverifiedState(controls) {
  const notice = document.createElement("span");
  notice.className = "auth-verify-notice";
  notice.textContent = "Подтвердите email";

  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button";
  logoutBtn.className = "auth-link";
  logoutBtn.textContent = "Выйти";
  logoutBtn.addEventListener("click", () => signOut(auth));

  controls.appendChild(notice);
  controls.appendChild(logoutBtn);
}

function buildAuthenticatedState(controls, user) {
  const displayName =
    user.displayName || user.email?.split("@")[0] || "Профиль";

  const menuWrap = document.createElement("div");
  menuWrap.className = "auth-menu";

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "auth-menu__toggle";
  toggleBtn.setAttribute("aria-expanded", "false");
  toggleBtn.setAttribute("aria-haspopup", "true");
  toggleBtn.setAttribute("aria-label", `Меню: ${displayName}`);

  const avatar = buildAvatar(user);
  toggleBtn.appendChild(avatar);

  const nameSpan = document.createElement("span");
  nameSpan.className = "auth-menu__name";
  nameSpan.textContent = displayName;
  toggleBtn.appendChild(nameSpan);

  const dropdown = document.createElement("div");
  dropdown.className = "auth-menu__dropdown glass-panel";
  dropdown.setAttribute("role", "menu");
  dropdown.hidden = true;

  const profileBtn = document.createElement("button");
  profileBtn.type = "button";
  profileBtn.className = "auth-menu__item";
  profileBtn.setAttribute("role", "menuitem");
  profileBtn.textContent = "Профиль";
  profileBtn.addEventListener("click", () => {
    closeMenu();
  });

  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button";
  logoutBtn.className = "auth-menu__item auth-menu__item--danger";
  logoutBtn.setAttribute("role", "menuitem");
  logoutBtn.textContent = "Выйти";
  logoutBtn.addEventListener("click", () => {
    closeMenu();
    signOut(auth);
  });

  dropdown.appendChild(profileBtn);
  dropdown.appendChild(logoutBtn);

  menuWrap.appendChild(toggleBtn);
  menuWrap.appendChild(dropdown);
  controls.appendChild(menuWrap);

  function openMenu() {
    dropdown.hidden = false;
    toggleBtn.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => {
      document.addEventListener("click", onOutsideClick, { capture: true });
      document.addEventListener("keydown", onEscape);
    });
  }

  function closeMenu() {
    dropdown.hidden = true;
    toggleBtn.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onOutsideClick, { capture: true });
    document.removeEventListener("keydown", onEscape);
  }

  function onOutsideClick(e) {
    if (!menuWrap.contains(e.target)) closeMenu();
  }

  function onEscape(e) {
    if (e.key === "Escape") {
      closeMenu();
      toggleBtn.focus();
    }
  }

  toggleBtn.addEventListener("click", () => {
    const isOpen = toggleBtn.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  });
}

function buildGuestState(controls) {
  const loginLink = document.createElement("a");
  loginLink.href = "/login";
  loginLink.className = "auth-link";
  loginLink.textContent = "Войти";

  const signupLink = document.createElement("a");
  signupLink.href = "/login?mode=register";
  signupLink.className = "auth-button";
  signupLink.textContent = "Создать аккаунт";

  controls.appendChild(loginLink);
  controls.appendChild(signupLink);
}

function renderAuthUI(user, verified) {
  document.querySelectorAll(CONTROLS_SELECTOR).forEach((controls) => {
    controls.innerHTML = "";

    if (!user) {
      buildGuestState(controls);
    } else if (!verified) {
      buildUnverifiedState(controls);
    } else {
      buildAuthenticatedState(controls, user);
    }

    controls.setAttribute("data-auth-state", user ? (verified ? "verified" : "unverified") : "guest");
  });
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      await user.reload();
    } catch (_) {
      // ignore network errors during reload
    }
    renderAuthUI(user, user.emailVerified);
  } else {
    renderAuthUI(null, false);
  }
});

// Update year in footers
document.querySelectorAll("[data-current-year]").forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});
