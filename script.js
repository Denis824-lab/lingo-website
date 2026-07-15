"use strict";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointerGlow = document.querySelector(".cursor-light");
const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".nav");

menuButton?.addEventListener("click", () => {
  const open = navigation?.classList.toggle("is-open") || false;
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
});
document.querySelectorAll(".nav-links a").forEach((link) => link.addEventListener("click", () => {
  navigation?.classList.remove("is-open");
  menuButton?.setAttribute("aria-expanded", "false");
}));

if (!reducedMotion && pointerGlow) {
  window.addEventListener("pointermove", (event) => {
    pointerGlow.style.left = `${event.clientX}px`;
    pointerGlow.style.top = `${event.clientY}px`;
  }, { passive: true });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.14, rootMargin: "0px 0px -40px" });

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  revealObserver.observe(element);
});

document.querySelectorAll("[data-tone]").forEach((button) => {
  button.addEventListener("click", () => {
    const copies = {
      "Экран": "Alt+Z — выделите область на экране",
      "Буфер": "Alt+Q — переведите текст из буфера",
      "Речь": "Alt+X — начните голосовой ввод",
    };
    document.querySelectorAll("[data-tone]").forEach((item) => item.classList.toggle("active", item === button));
    const copy = document.querySelector("[data-tone-copy]");
    if (copy) {
      copy.animate([{ opacity: 0, transform: "translateY(5px)" }, { opacity: 1, transform: "none" }], { duration: 280 });
      copy.textContent = copies[button.dataset.tone];
    }
  });
});

if (!reducedMotion) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty("--x", `${x * 100}%`);
      card.style.setProperty("--y", `${y * 100}%`);
      card.style.transform = `perspective(800px) rotateX(${(0.5 - y) * 3}deg) rotateY(${(x - 0.5) * 3}deg)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
}

const cookieBar = document.querySelector("[data-cookie-consent]");
const consent = localStorage.getItem("cookie-consent");
if (cookieBar && consent === null) cookieBar.hidden = false;
if (consent === "accepted") loadAnalytics();
document.querySelector("[data-cookie-accept]")?.addEventListener("click", () => {
  localStorage.setItem("cookie-consent", "accepted");
  if (cookieBar) cookieBar.hidden = true;
  loadAnalytics();
});
document.querySelector("[data-cookie-decline]")?.addEventListener("click", () => {
  localStorage.setItem("cookie-consent", "declined");
  if (cookieBar) cookieBar.hidden = true;
});

function loadAnalytics() {
  if (document.querySelector('script[data-lingo-analytics]')) return;
  const analytics = document.createElement("script");
  analytics.async = true;
  analytics.src = "https://mc.yandex.ru/metrika/tag.js";
  analytics.dataset.lingoAnalytics = "true";
  document.head.appendChild(analytics);
  window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
  window.ym.l = Date.now();
  window.ym("110608749", "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
}
