/**
 * Прототип ADDU за паролем (Cloudflare Worker + статические ассеты).
 *
 * Логин и пароль задаются переменными окружения Worker'а в панели Cloudflare:
 *   PROTO_USER     — логин (по умолчанию "addu")
 *   PROTO_PASSWORD — пароль; пока не задан, сайт открыт, чтобы первый деплой не заперся сам
 *
 * Worker стоит перед ассетами (assets.run_worker_first), поэтому пароль спрашивается
 * на любой запрос, включая картинки и стили. Заодно на каждый ответ вешаем
 * X-Robots-Tag: noindex — на GitHub Pages заголовки задать было нельзя.
 */

const REALM = 'ADDU prototype';

/** Сравнение без утечки времени: не выходим раньше на первом несовпавшем символе. */
function equal(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Разбирает заголовок Authorization: Basic <base64>, корректно понимая UTF-8. */
function credentials(header) {
  if (!header || !header.startsWith('Basic ')) return null;
  let decoded;
  try {
    const bytes = Uint8Array.from(atob(header.slice(6)), (c) => c.charCodeAt(0));
    decoded = new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
  const i = decoded.indexOf(':');
  return i < 0 ? null : { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
}

function unauthorized() {
  return new Response('Доступ к прототипу закрыт паролем.', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store',
    },
  });
}

export default {
  async fetch(request, env) {
    const password = env.PROTO_PASSWORD;

    if (password) {
      const user = env.PROTO_USER || 'addu';
      const got = credentials(request.headers.get('Authorization'));
      if (!got || !equal(got.user, user) || !equal(got.pass, password)) return unauthorized();
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
