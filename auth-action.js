import {
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { auth } from "./firebase-config.js";

const params = new URLSearchParams(window.location.search);
const mode = params.get("mode");
const oobCode = params.get("oobCode");

const loading = document.querySelector("[data-action-loading]");
const verifySuccess = document.querySelector("[data-action-verify-success]");
const resetForm = document.querySelector("[data-action-reset]");
const resetSuccess = document.querySelector("[data-action-reset-success]");
const errorState = document.querySelector("[data-action-error]");
const errorText = document.querySelector("[data-action-error-text]");

function hideAll() {
  [loading, verifySuccess, resetForm, resetSuccess, errorState].forEach((el) => {
    if (el) el.hidden = true;
  });
}

function showError(message) {
  hideAll();
  if (errorState) errorState.hidden = false;
  if (errorText && message) errorText.textContent = message;
}

function translateFirebaseError(code) {
  const map = {
    "auth/invalid-action-code": "Ссылка недействительна или уже была использована.",
    "auth/expired-action-code": "Ссылка истекла. Запросите новую.",
    "auth/user-disabled": "Аккаунт отключён.",
    "auth/user-not-found": "Пользователь не найден.",
    "auth/weak-password": "Пароль должен быть не менее 6 символов.",
  };
  return map[code] || null;
}

// Password visibility toggle for the reset form
document.querySelectorAll("[data-password-toggle]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const wrap = btn.closest(".auth-input-wrap");
    const input = wrap?.querySelector(".auth-input");
    if (!input) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    btn.setAttribute("aria-label", isPassword ? "Скрыть пароль" : "Показать пароль");
    btn.querySelector(".auth-input-toggle__eye")?.classList.toggle("is-hidden", !isPassword);
    btn.querySelector(".auth-input-toggle__eye-off")?.classList.toggle("is-hidden", isPassword);
  });
});

// Update year
document.querySelectorAll("[data-current-year]").forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});

if (!oobCode) {
  showError("Не указан код действия. Проверьте ссылку из письма.");
} else if (mode === "verifyEmail") {
  try {
    await applyActionCode(auth, oobCode);
    hideAll();
    if (verifySuccess) verifySuccess.hidden = false;
  } catch (err) {
    const msg = translateFirebaseError(err.code);
    showError(msg || "Не удалось подтвердить email. Попробуйте запросить новую ссылку.");
  }
} else if (mode === "resetPassword") {
  try {
    await verifyPasswordResetCode(auth, oobCode);
    hideAll();
    if (resetForm) resetForm.hidden = false;

    const form = document.querySelector("[data-reset-password-form]");
    const errorEl = document.querySelector("[data-reset-error]");
    const submitBtn = document.querySelector("[data-reset-submit]");
    const submitLabel = document.querySelector("[data-reset-submit-label]");

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (errorEl) errorEl.textContent = "";

      const passwordInput = form.querySelector('input[name="password"]');
      if (!passwordInput || passwordInput.value.length < 6) {
        if (errorEl) errorEl.textContent = "Пароль должен быть не менее 6 символов.";
        passwordInput?.focus();
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = "Сохраняем…";

      try {
        await confirmPasswordReset(auth, oobCode, passwordInput.value);
        hideAll();
        if (resetSuccess) resetSuccess.hidden = false;
      } catch (err) {
        if (errorEl) errorEl.textContent = translateFirebaseError(err.code) || "Не удалось сохранить пароль. Попробуйте ещё раз.";
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = "Сохранить пароль";
      }
    });
  } catch (err) {
    const msg = translateFirebaseError(err.code);
    showError(msg || "Не удалось проверить ссылку сброса. Запросите новую.");
  }
} else {
  showError("Неизвестный тип действия. Проверьте ссылку из письма.");
}
