"use strict";

const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
  const emailInput = contactForm.querySelector("#contact-email");
  const subjectInput = contactForm.querySelector("#contact-subject");
  const messageInput = contactForm.querySelector("#contact-message");
  const submitButton = contactForm.querySelector("[data-contact-submit]");
  const submitLabel = contactForm.querySelector("[data-contact-submit-label]");
  const formWrapper = document.querySelector("[data-contact-form-wrapper]");
  const successMessage = document.querySelector("[data-contact-success]");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let isSubmitting = false;

  const errors = {
    email: contactForm.querySelector("#contact-email-error"),
    subject: contactForm.querySelector("#contact-subject-error"),
    message: contactForm.querySelector("#contact-message-error"),
  };

  const clearError = (field) => {
    if (errors[field]) errors[field].textContent = "";
    const input = field === "email" ? emailInput : field === "subject" ? subjectInput : messageInput;
    input?.removeAttribute("aria-invalid");
  };

  const clearAllErrors = () => {
    Object.keys(errors).forEach(clearError);
  };

  const showError = (field, message) => {
    if (errors[field]) errors[field].textContent = message;
    const input = field === "email" ? emailInput : field === "subject" ? subjectInput : messageInput;
    input?.setAttribute("aria-invalid", "true");
  };

  const setSubmitting = (value) => {
    isSubmitting = value;
    if (submitButton) submitButton.disabled = value;
    contactForm.setAttribute("aria-busy", String(value));
    if (submitLabel) submitLabel.textContent = value ? "Готовим…" : "Подготовить письмо";
  };

  emailInput?.addEventListener("input", () => clearError("email"));
  subjectInput?.addEventListener("input", () => clearError("subject"));
  messageInput?.addEventListener("input", () => clearError("message"));

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    clearAllErrors();
    let hasErrors = false;

    if (!emailInput || !emailInput.validity.valid) {
      showError("email", "Введите корректный email.");
      if (!hasErrors) emailInput?.focus();
      hasErrors = true;
    }

    if (!subjectInput || !subjectInput.value.trim()) {
      showError("subject", "Укажите тему обращения.");
      if (!hasErrors) subjectInput?.focus();
      hasErrors = true;
    }

    if (!messageInput || !messageInput.value.trim()) {
      showError("message", "Напишите сообщение.");
      if (!hasErrors) messageInput?.focus();
      hasErrors = true;
    }

    if (hasErrors) return;

    setSubmitting(true);
    const subject = `[Lingo] ${subjectInput.value.trim()}`;
    const body = `${messageInput.value.trim()}\n\nEmail для ответа: ${emailInput.value.trim()}`;
    window.location.href = `mailto:kugubaev.dev@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    formWrapper?.classList.add("is-leaving");
    const transitionDelay = reduceMotion.matches ? 0 : 280;
    window.setTimeout(() => {
      if (formWrapper) formWrapper.hidden = true;
      if (successMessage) {
        successMessage.hidden = false;
        successMessage.classList.add("is-visible");
      }
      setSubmitting(false);
    }, transitionDelay);
  });
}
