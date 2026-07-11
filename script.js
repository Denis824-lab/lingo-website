"use strict";

/**
 * Запускает появление интерфейса только после готовности DOM.
 * Класс добавляется в отдельном кадре, чтобы браузер успел применить начальные стили.
 */
window.requestAnimationFrame(() => {
  document.body.classList.add("is-ready");
});

// Поддерживает актуальный год без ручного обновления разметки.
const yearElement = document.querySelector("[data-current-year]");
if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
}

// Заблокированная CTA-кнопка сохраняет hover/focus-анимацию, не запуская действие.
document.querySelectorAll("[data-disabled-action]").forEach((button) => {
  button.addEventListener("click", (event) => event.preventDefault());
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const accessForm = document.querySelector("[data-access-form]");

/**
 * Валидирует email средствами браузера и мягко переключает карточку
 * из состояния формы в подтверждение раннего доступа.
 */
if (accessForm) {
  const emailInput = accessForm.querySelector('input[type="email"]');
  const websiteInput = accessForm.querySelector('input[name="website"]');
  const errorElement = accessForm.querySelector(".access-form__error");
  const formContent = document.querySelector("[data-form-content]");
  const successMessage = document.querySelector("[data-form-success]");
  const submitButton = accessForm.querySelector("[data-submit-button]");
  const submitLabel = accessForm.querySelector("[data-submit-label]");
  const endpoint = document.querySelector('meta[name="lingo-subscribe-endpoint"]')?.content;
  let isSubmitting = false;

  const clearError = () => {
    if (errorElement) errorElement.textContent = "";
    emailInput?.removeAttribute("aria-invalid");
  };

  const setSubmitting = (value) => {
    isSubmitting = value;
    if (submitButton) submitButton.disabled = value;
    accessForm.setAttribute("aria-busy", String(value));
    if (submitLabel) submitLabel.textContent = value ? "Сохраняем…" : "Узнать о запуске";
  };

  const showError = (message) => {
    if (errorElement) errorElement.textContent = message;
    emailInput?.setAttribute("aria-invalid", "true");
  };

  emailInput?.addEventListener("input", clearError);

  accessForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (!emailInput || !emailInput.validity.valid) {
      showError("Введите корректный email, чтобы продолжить.");
      emailInput?.focus();
      return;
    }

    clearError();
    if (!endpoint) {
      showError("Сервис подписки пока недоступен. Попробуйте позже.");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    setSubmitting(true);

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput.value, website: websiteInput?.value ?? "" }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Не удалось отправить заявку. Попробуйте ещё раз.");
        }

        formContent?.classList.add("is-leaving");
        const transitionDelay = reduceMotion.matches ? 0 : 280;
        window.setTimeout(() => {
          if (formContent) formContent.hidden = true;
          if (successMessage) {
            successMessage.hidden = false;
            successMessage.classList.add("is-visible");
          }
        }, transitionDelay);
      })
      .catch((error) => {
        const message = error.name === "AbortError"
          ? "Сервер отвечает слишком долго. Попробуйте ещё раз."
          : error.message;
        showError(message);
      })
      .finally(() => {
        window.clearTimeout(timeout);
        setSubmitting(false);
      });
  });
}

const finePointer = window.matchMedia("(pointer: fine)");
const productStage = document.querySelector(".product-stage");

/**
 * Добавляет лёгкую параллакс-реакцию мокапа на курсор.
 * Эффект включён только для точного указателя и отключён при reduced motion.
 */
if (productStage && finePointer.matches && !reduceMotion.matches) {
  const appWindow = productStage.querySelector(".app-window");
  const glow = productStage.querySelector(".product-stage__glow");

  productStage.addEventListener("pointermove", (event) => {
    const bounds = productStage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    if (appWindow) {
      appWindow.style.transform = `rotateY(${x * 5}deg) rotateX(${-y * 4}deg) translateY(-3px)`;
    }

    if (glow) {
      glow.style.translate = `${x * 24}px ${y * 20}px`;
    }
  });

  productStage.addEventListener("pointerleave", () => {
    if (appWindow) appWindow.style.removeProperty("transform");
    if (glow) glow.style.removeProperty("translate");
  });
}
