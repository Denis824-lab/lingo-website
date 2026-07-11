const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const MAX_REQUEST_BYTES = 2_048;

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
    console.error("Subscription service is missing required environment configuration.");
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
  const website = typeof payload.website === "string" ? payload.website.trim() : "";

  // A filled hidden field identifies automated submissions; return success to avoid useful feedback to bots.
  if (website) {
    return jsonResponse(200, { ok: true }, origin);
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return jsonResponse(422, { error: "Введите корректный email, чтобы продолжить." }, origin);
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
        subject: "Новая заявка на ранний доступ Lingo",
        html: `<p>Новая заявка на ранний доступ: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>`,
        text: `Новая заявка на ранний доступ: ${email}`,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (resendResponse.ok) {
      const result = await resendResponse.json().catch(() => ({}));
      console.info("Subscription email accepted by Resend.", { emailId: result.id || "unknown" });
      return jsonResponse(200, { ok: true }, origin);
    }

    const details = await resendResponse.text();
    console.error("Resend email delivery failed.", { status: resendResponse.status, details: details.slice(0, 500) });
    return jsonResponse(502, { error: "Не удалось отправить заявку. Попробуйте ещё раз." }, origin);
  } catch (error) {
    console.error("Subscription provider request failed.", error);
    return jsonResponse(502, { error: "Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз." }, origin);
  }
};
