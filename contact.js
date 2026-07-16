"use strict";

const CONTACT_ENDPOINT = "https://formsubmit.co/ajax/kugubaev.dev@gmail.com";
const MAX_SUBJECT_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 5000;

const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
  const emailInput = contactForm.querySelector("#contact-email");
  const subjectInput = contactForm.querySelector("#contact-subject");
  const messageInput = contactForm.querySelector("#contact-message");
  const honeypotInput = contactForm.querySelector("[name='website']");
  const submitButton = contactForm.querySelector("[data-contact-submit]");
  const submitLabel = contactForm.querySelector("[data-contact-submit-label]");
  const formWrapper = document.querySelector("[data-contact-form-wrapper]");
  const successMessage = document.querySelector("[data-contact-success]");
  const formError = document.querySelector("[data-contact-form-error]");

  let isSubmitting = false;
  const errors = {
    email: contactForm.querySelector("#contact-email-error"),
    subject: contactForm.querySelector("#contact-subject-error"),
    message: contactForm.querySelector("#contact-message-error"),
  };

  const fieldFor = (field) => ({ email: emailInput, subject: subjectInput, message: messageInput })[field];

  const clearError = (field) => {
    errors[field]?.replaceChildren();
    fieldFor(field)?.removeAttribute("aria-invalid");
  };

  const clearAllErrors = () => Object.keys(errors).forEach(clearError);

  const showError = (field, message) => {
    if (errors[field]) errors[field].textContent = message;
    fieldFor(field)?.setAttribute("aria-invalid", "true");
  };

  const showFormError = (message) => {
    if (formError) formError.textContent = message;
  };

  const setSubmitting = (value) => {
    isSubmitting = value;
    if (submitButton) submitButton.disabled = value;
    contactForm.setAttribute("aria-busy", String(value));
    if (submitLabel) submitLabel.textContent = value ? "Отправляем…" : "Отправить сообщение";
  };

  emailInput?.addEventListener("input", () => clearError("email"));
  subjectInput?.addEventListener("input", () => clearError("subject"));
  messageInput?.addEventListener("input", () => clearError("message"));

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    clearAllErrors();
    showFormError("");

    const email = emailInput?.value.trim() ?? "";
    const subject = subjectInput?.value.trim() ?? "";
    const message = messageInput?.value.trim() ?? "";
    let firstInvalidField = null;

    if (!emailInput?.validity.valid) {
      showError("email", "Введите корректный email.");
      firstInvalidField ??= emailInput;
    }
    if (!subject) {
      showError("subject", "Укажите тему обращения.");
      firstInvalidField ??= subjectInput;
    } else if (subject.length > MAX_SUBJECT_LENGTH) {
      showError("subject", `Тема не должна превышать ${MAX_SUBJECT_LENGTH} символов.`);
      firstInvalidField ??= subjectInput;
    }
    if (!message) {
      showError("message", "Напишите сообщение.");
      firstInvalidField ??= messageInput;
    } else if (message.length > MAX_MESSAGE_LENGTH) {
      showError("message", `Сообщение не должно превышать ${MAX_MESSAGE_LENGTH} символов.`);
      firstInvalidField ??= messageInput;
    }
    if (firstInvalidField) {
      firstInvalidField.focus();
      return;
    }

    // Bots that fill the visually hidden field never reach the mail provider.
    if (honeypotInput?.value.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        credentials: "omit",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          subject,
          message,
          _subject: `[Lingo] ${subject}`,
          _replyto: email,
          _template: "table",
          source: "lingo-app.ru/contact",
        }),
      });

      if (!response.ok) throw new Error(`Contact request failed with ${response.status}`);

      formWrapper?.classList.add("is-leaving");
      window.setTimeout(() => {
        if (formWrapper) formWrapper.hidden = true;
        if (successMessage) {
          successMessage.hidden = false;
          successMessage.classList.add("is-visible");
        }
      }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 280);
    } catch (error) {
      console.error("Unable to send contact request", error);
      showFormError("Не удалось отправить сообщение. Проверьте подключение и попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  });
}
