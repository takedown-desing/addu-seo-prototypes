/**
 * Пароль на весь прототип (Cloudflare Pages Functions).
 * Логин и пароль задаются переменными окружения проекта в панели Cloudflare:
 *   PROTO_USER     — логин (если не задан, используется "addu")
 *   PROTO_PASSWORD — пароль (если не задан, сайт открыт — чтобы не запереть себя при первом деплое)
 * Заодно на каждый ответ вешаем X-Robots-Tag: noindex — на GitHub Pages так было нельзя.
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
  if (i < 0) return null;
  return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
}

export const onRequest = async ({ request, env, next }) => {
  const password = env.PROTO_PASSWORD;

  if (password) {
    const user = env.PROTO_USER || 'addu';
    const got = credentials(request.headers.get('Authorization'));
    const ok = got && equal(got.user, user) && equal(got.pass, password);
    if (!ok) {
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
  }

  const response = await next();
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
