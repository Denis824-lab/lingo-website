import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { auth } from "./firebase-config.js";

const ACTION_CODE_SETTINGS = { url: "https://lingo-app.ru/auth/action", handleCodeInApp: false };
const provider = new GoogleAuthProvider();
const form = document.querySelector("[data-auth-form]");
const email = document.querySelector("[data-auth-email]");
const password = document.querySelector("[data-auth-password]");
const confirmPassword = document.querySelector("[data-auth-confirm]");
const remember = document.querySelector("[data-auth-remember]");
const message = document.querySelector("[data-auth-message]");
const submit = document.querySelector("[data-auth-submit]");
const submitLabel = document.querySelector("[data-auth-submit-label]");
const title = document.querySelector("[data-auth-title]");
const subtitle = document.querySelector("[data-auth-subtitle]");
let mode = "login";

const copy = {
  login: { title: "Снова в Lingo", subtitle: "Войдите, чтобы продолжить без границ.", action: "Войти в Lingo" },
  register: { title: "Начните с Lingo", subtitle: "Создайте аккаунт — это займёт меньше минуты.", action: "Создать аккаунт" },
  forgot: { title: "Вернём доступ", subtitle: "Отправим ссылку для сброса пароля на вашу почту.", action: "Отправить ссылку" },
};

function errorText(code, action = "login") {
  const errors = {
    "auth/invalid-credential": "Неверный email или пароль.",
    "auth/user-disabled": "Аккаунт отключён. Обратитесь в поддержку.",
    "auth/invalid-email": "Введите корректный email.",
    "auth/email-already-in-use": "Аккаунт с таким email уже существует.",
    "auth/weak-password": "Пароль должен содержать минимум 6 символов.",
    "auth/too-many-requests": "Слишком много попыток. Попробуйте позже.",
    "auth/network-request-failed": "Нет соединения. Проверьте интернет и попробуйте снова.",
    "auth/popup-closed-by-user": "Окно авторизации было закрыто.",
    "auth/popup-blocked": "Браузер заблокировал окно авторизации.",
    "auth/operation-not-allowed": "Этот способ входа пока недоступен.",
    "auth/internal-error": "Сервис авторизации временно недоступен. Попробуйте ещё раз позже.",
  };
  if (errors[code]) return errors[code];
  if (action === "register") return "Не удалось создать аккаунт. Попробуйте ещё раз позже.";
  if (action === "reset") return "Не удалось отправить ссылку. Попробуйте ещё раз позже.";
  return "Не удалось войти. Попробуйте ещё раз позже.";
}

function showMessage(text, type = "error") {
  if (!message) return;
  message.hidden = !text;
  message.textContent = text;
  message.dataset.type = type;
}

function setLoading(value, text = "Подождите…") {
  if (submit) submit.disabled = value;
  if (submitLabel) submitLabel.textContent = value ? text : copy[mode].action;
  form?.setAttribute("aria-busy", String(value));
}

function setMode(nextMode) {
  mode = nextMode;
  showMessage("");
  if (title) title.textContent = copy[mode].title;
  if (subtitle) subtitle.textContent = copy[mode].subtitle;
  if (submitLabel) submitLabel.textContent = copy[mode].action;
  document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
    const active = tab.dataset.authTab === mode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".register-only").forEach((field) => { field.hidden = mode !== "register"; });
  document.querySelector(".password-field").hidden = mode === "forgot";
  document.querySelector(".auth-options").hidden = mode !== "login";
  document.querySelector(".google-button").hidden = mode === "forgot";
  document.querySelector(".auth-divider").hidden = mode === "forgot";
  if (password) password.required = mode !== "forgot";
  if (confirmPassword) confirmPassword.required = mode === "register";
  document.querySelectorAll("[data-password-toggle]").forEach((toggle) => {
    const target = form?.elements.namedItem(toggle.dataset.passwordTarget);
    if (!(target instanceof HTMLInputElement)) return;
    target.type = "password";
    toggle.dataset.visible = "false";
    toggle.setAttribute("aria-pressed", "false");
    const fieldName = toggle.dataset.passwordTarget === "confirm" ? "повтор пароля" : "пароль";
    toggle.setAttribute("aria-label", `Показать ${fieldName}`);
  });
}

async function applyAuthPersistence() {
  await setPersistence(auth, remember?.checked ? browserLocalPersistence : browserSessionPersistence);
}

document.querySelectorAll("[data-auth-tab]").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.authTab)));
document.querySelector("[data-show-forgot]")?.addEventListener("click", () => setMode("forgot"));
document.querySelectorAll("[data-password-toggle]").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const target = form?.elements.namedItem(toggle.dataset.passwordTarget);
    if (!(target instanceof HTMLInputElement)) return;
    const visible = target.type === "password";
    target.type = visible ? "text" : "password";
    toggle.dataset.visible = String(visible);
    toggle.setAttribute("aria-pressed", String(visible));
    const fieldName = toggle.dataset.passwordTarget === "confirm" ? "повтор пароля" : "пароль";
    toggle.setAttribute("aria-label", visible ? `Скрыть ${fieldName}` : `Показать ${fieldName}`);
  });
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("");
  if (!email?.validity.valid) { showMessage("Введите корректный email."); email?.focus(); return; }
  if (mode !== "forgot" && (!password.value || password.value.length < 6)) { showMessage("Пароль должен содержать минимум 6 символов."); password?.focus(); return; }
  if (mode === "register" && password.value !== confirmPassword?.value) { showMessage("Пароли не совпадают."); confirmPassword?.focus(); return; }
  setLoading(true);
  try {
    if (mode !== "forgot") await applyAuthPersistence();
    if (mode === "login") {
      const credential = await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
      await credential.user.reload();
      if (!credential.user.emailVerified) {
        showMessage("Подтвердите email по ссылке в письме. Мы можем отправить письмо повторно.", "info");
        await sendEmailVerification(credential.user, ACTION_CODE_SETTINGS).catch(() => {});
        return;
      }
      window.location.assign("/");
    } else if (mode === "register") {
      const credential = await createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
      try {
        await sendEmailVerification(credential.user, ACTION_CODE_SETTINGS);
        showMessage("Аккаунт создан. Проверьте почту и папку «Спам», затем подтвердите email.", "success");
      } catch (verificationError) {
        console.warn("Email verification delivery failed", verificationError?.code || "unknown");
        showMessage("Аккаунт создан, но письмо пока не отправилось. Перейдите во «Войти»: после входа мы повторим отправку.", "info");
      }
      form.reset();
    } else {
      await sendPasswordResetEmail(auth, email.value.trim(), ACTION_CODE_SETTINGS);
      showMessage("Ссылка для сброса пароля отправлена. Проверьте почту.", "success");
    }
  } catch (error) {
    const action = mode === "register" ? "register" : mode === "forgot" ? "reset" : "login";
    showMessage(errorText(error.code, action));
  } finally {
    setLoading(false);
  }
});

document.querySelector("[data-google-login]")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  showMessage("");
  try {
    await applyAuthPersistence();
    const result = await signInWithPopup(auth, provider);
    if (result.user) window.location.assign("/");
  } catch (error) {
    if (error.code === "auth/popup-blocked") {
      await signInWithRedirect(auth, provider);
      return;
    }
    if (error.code !== "auth/popup-closed-by-user") showMessage(errorText(error.code));
  } finally {
    button.disabled = false;
  }
});

try {
  const redirect = await getRedirectResult(auth);
  if (redirect?.user) window.location.assign("/");
} catch (error) { showMessage(errorText(error.code)); }

const params = new URLSearchParams(window.location.search);
if (params.get("mode") === "register") setMode("register");
else setMode("login");
if (params.get("verified") === "1") showMessage("Email подтверждён. Теперь вы можете войти.", "success");
if (params.get("passwordReset") === "1") showMessage("Пароль изменён. Войдите с новым паролем.", "success");
