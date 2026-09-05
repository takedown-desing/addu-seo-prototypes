# Прототип ADDU

Статический прототип нового сайта addu.ru. Живёт на Cloudflare Workers, закрыт паролем.

## Как закрыт от посторонних

| Слой | Где |
|---|---|
| Пароль на вход (Basic Auth) | `worker.js` — логин и пароль из переменных окружения |
| `<meta name="robots" content="noindex,nofollow">` | во всех 121 странице |
| Заголовок `X-Robots-Tag: noindex, nofollow` | `worker.js`, на каждый ответ |
| `rel="canonical"` на боевой addu.ru | во всех страницах |

Карты сайта (`sitemap.xml`) намеренно нет.

## Переменные окружения

Задаются в панели Cloudflare: проект → Settings → Runtime variables and secrets.

| Имя | Тип | Значение |
|---|---|---|
| `PROTO_PASSWORD` | Secret | пароль; **пока не задан — сайт открыт** (чтобы первый деплой не заперся сам) |
| `PROTO_USER` | Text | логин; если не задан, используется `addu` |

Пароль — латиницей и цифрами: часть браузеров передаёт Basic Auth не в UTF-8.

После добавления или смены секрета создаётся новая версия Worker'а — её нужно задеплоить,
иначе продолжит работать предыдущая. Проще всего — запушить любое изменение: сборка
пройдёт заново и подхватит текущие секреты.

## Сборка

`build-cf.sh` копирует сайт в `dist/` и меняет абсолютные пути `/addu-seo-prototypes/` на `/`
(на GitHub Pages сайт лежал в подпапке, на Cloudflare — в корне). Исходники не трогаются.

Настройки проекта в панели Cloudflare:

- Build command: `bash build-cf.sh`
- Deploy command: `npx wrangler deploy`

Деплой автоматический на каждый пуш в `main`.

## Локальная проверка

```bash
bash build-cf.sh
echo 'PROTO_PASSWORD=test123' > .dev.vars
npx wrangler dev --port 8787 --local
```

Без пароля любой запрос отдаёт 401, с паролем — сайт открывается:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8787/            # 401
curl -s -o /dev/null -w '%{http_code}\n' -u addu:test123 http://127.0.0.1:8787/  # 200
```
