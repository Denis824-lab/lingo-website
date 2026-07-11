const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const MAX_REQUEST_BYTES = 4_096;

function escapeHtml(value) {
  return value.replace(/[&<>"']/gu, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function jsonResponse(status, body, origin) {
  const headers = new Headers({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  });

  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
}

function isAllowedOrigin(origin, siteOrigin) {
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(siteOrigin).origin;
  } catch {
    return false;
  }
}

export default async (request) => {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_TO_EMAIL, SITE_ORIGIN } = process.env;
  const origin = request.headers.get("origin") || "";

  if (!SITE_ORIGIN || !RESEND_API_KEY || !RESEND_FROM_EMAIL || !RESEND_TO_EMAIL) {
    console.error("Contact service is missing required environment configuration.");
    return jsonResponse(503, { error: "Сервис временно недоступен. Попробуйте позже." }, SITE_ORIGIN || "null");
  }

  if (!isAllowedOrigin(origin, SITE_ORIGIN)) {
    return jsonResponse(403, { error: "Запрос отклонён." }, SITE_ORIGIN);
  }

  if (request.method === "OPTIONS") {
    return jsonResponse(204, {}, origin);
  }

  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Метод не поддерживается." }, origin);
  }

  const rawBody = await request.text();
  if (!rawBody || new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return jsonResponse(400, { error: "Некорректный запрос." }, origin);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, { error: "Некорректный запрос." }, origin);
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const website = typeof payload.website === "string" ? payload.website.trim() : "";

  if (website) {
    return jsonResponse(200, { ok: true }, origin);
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return jsonResponse(422, { error: "Введите корректный email, чтобы продолжить." }, origin);
  }

  if (!subject || subject.length > 200) {
    return jsonResponse(422, { error: "Укажите тему обращения (до 200 символов)." }, origin);
  }

  if (!message || message.length > 5000) {
    return jsonResponse(422, { error: "Напишите сообщение (до 5000 символов)." }, origin);
  }

  try {
    const resendResponse = await fetch(RESEND_EMAILS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [RESEND_TO_EMAIL],
        reply_to: email,
        subject: `[Lingo Contact] ${subject}`,
        html: `
          <h2>Новое сообщение с сайта Lingo</h2>
          <p><strong>От:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          <p><strong>Тема:</strong> ${escapeHtml(subject)}</p>
          <hr />
          <p>${escapeHtml(message).replace(/\n/gu, "<br />")}</p>
        `,
        text: `Новое сообщение с сайта Lingo\n\nОт: ${email}\nТема: ${subject}\n\n${message}`,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (resendResponse.ok) {
      const result = await resendResponse.json().catch(() => ({}));
      console.info("Contact email accepted by Resend.", { emailId: result.id || "unknown" });
      return jsonResponse(200, { ok: true }, origin);
    }

    const details = await resendResponse.text();
    console.error("Resend email delivery failed.", { status: resendResponse.status, details: details.slice(0, 500) });
    return jsonResponse(502, { error: "Не удалось отправить сообщение. Попробуйте ещё раз." }, origin);
  } catch (error) {
    console.error("Contact provider request failed.", error);
    return jsonResponse(502, { error: "Не удалось отправить сообщение. Проверьте соединение и попробуйте ещё раз." }, origin);
  }
};
