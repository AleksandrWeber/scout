# Як налаштувати GITHUB_TOKEN для Scout

Scout завантажує код репозиторію з GitHub. **Публічні** репозиторії працюють без токена. **Приватні** — потребують `GITHUB_TOKEN` на backend.

Токен **ніколи не вводиться у frontend** і **не комітиться в git**. Він живе тільки в локальному `.env` або в GitHub Secrets для CI.

---

## Крок 1. Створи Personal Access Token на GitHub

1. Увійди на GitHub.
2. Відкрий: [https://github.com/settings/tokens](https://github.com/settings/tokens)
3. Натисни **Generate new token**.

Рекомендовано: **Fine-grained token** (точніші права).

### Fine-grained token (рекомендовано)

1. **Token name:** `scout-local` (або будь-яка назва)
2. **Expiration:** 30–90 днів (або custom)
3. **Repository access:**
   - **Only select repositories** — обери репозиторії, які хочеш аналізувати
   - або **All repositories**, якщо потрібен ширший доступ
4. **Permissions → Repository permissions:**
   - **Contents:** `Read-only` (обовʼязково для завантаження коду)
   - **Metadata:** `Read-only` (зазвичай додається автоматично)
5. Натисни **Generate token**
6. **Скопіюй токен одразу** — GitHub покаже його лише один раз

### Classic token (альтернатива)

1. **Generate new token (classic)**
2. Постав галочку **`repo`** (Full control of private repositories)
3. Згенеруй і скопіюй токен

---

## Крок 2. Додай токен у локальний `.env`

У корені проєкту `scout/` створи або відредагуй файл `.env`:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

Приклад повного `.env`:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=your_gemini_key
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash
```

Перезапусти backend:

```bash
npm run dev
```

або Docker:

```bash
npm run docker:up
```

---

## Крок 3. Перевір, що токен підхопився

```bash
curl http://localhost:4000/health/ready
```

У відповіді має бути:

```json
"githubToken": "configured"
```

Якщо `"not_configured"` — перевір шлях до `.env` і перезапуск сервера.

---

## Крок 4. (Опційно) GitHub Actions CI

Якщо CI має аналізувати приватні репозиторії:

1. Репозиторій Scout на GitHub → **Settings**
2. **Secrets and variables → Actions**
3. **New repository secret**
4. Name: `GITHUB_TOKEN`
5. Value: твій token

---

## Типові помилки

| Помилка | Що робити |
|---|---|
| `Private repositories require GITHUB_TOKEN` | Додай токен у `.env` |
| `GitHub rejected the configured GITHUB_TOKEN` | Токен прострочений або невірний — створи новий |
| `GitHub denied access` | Токен не має доступу до цього repo — додай repo в fine-grained token |
| `Repository not found` | Перевір URL або права токена |

---

## Безпека

- Не пиши токен у чат, issues, PR, README
- Не коміть `.env`
- Якщо токен засвітили — **revoke** його на GitHub і створи новий
- Для fine-grained token давай мінімальні права: лише **Contents: Read**

Детальніше: [secret-handling.md](./secret-handling.md)
