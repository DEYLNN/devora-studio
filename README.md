# Devora Studio

Devora Studio is a Laravel + Inertia React AI chat studio with a public ChatGPT-like interface and a private admin dashboard for managing providers, models, and usage visibility.

## Features

- Public `/chat` interface with local browser chat history
- Private admin dashboard behind Laravel auth
- OpenAI-compatible provider support
- Encrypted provider API keys via Laravel casts
- Admin provider management with masked API key status
- Admin model management with categories, icons, default model, vision/file flags, and active/inactive states
- Markdown AI responses with code block copy support
- Public chat UX polish: mobile layout, model dropdown, typewriter for new assistant replies, continue helper, image uploads for vision models
- Public endpoint safety controls: rate limits, payload limits, image size/type limits, friendly errors, and honeypot field
- Usage/error logging for admin evaluation

## Main Routes

```txt
/                 Landing page
/chat             Public AI chat
/login            Admin login
/dashboard        Admin dashboard
/admin/providers  Provider settings
/admin/models     Model settings
/admin/chat       Authenticated/admin chat
```

Register is intentionally disabled. Admin users should be managed manually by the project owner.

## Stack

- Laravel 13 / PHP 8.3+
- Inertia React
- Tailwind CSS
- MySQL
- OpenAI-compatible chat completions backend
- Vite build pipeline

## Security Notes

- Provider API keys are stored in the database using Laravel's `encrypted` cast.
- Provider API keys are hidden from serialization and never rendered in the frontend.
- Provider edit forms never show the old key; filling the API key field replaces it, leaving it empty keeps the existing encrypted key.
- Public chat never calls provider APIs directly from the browser; it calls Laravel endpoints only.
- Public chat POST endpoints are rate limited and validate/truncate payloads server-side.

## Local Development Notes

The server environment for this project expects PHP 8.3+. If the host PHP is older, run artisan/composer checks through a PHP 8.4 Docker container.

Useful commands:

```bash
npm install
npm run build
```

Syntax/check examples:

```bash
docker run --rm --add-host=host.docker.internal:host-gateway \
  -v "$PWD":/app -w /app php:8.4-cli php -l routes/web.php
```

For database-backed artisan commands from Docker, ensure the container has `pdo_mysql` installed:

```bash
docker run --rm --add-host=host.docker.internal:host-gateway \
  -v "$PWD":/app -w /app php:8.4-cli sh -lc \
  'docker-php-ext-install pdo_mysql >/tmp/pdo.log 2>&1 && php artisan route:list'
```

## Build

```bash
npm run build
```

Generated assets live in `public/build/` and should not be included in source-only backups.

## Backup Preference

For clean checkpoints, use source-only backups excluding:

```txt
node_modules
vendor
public/build
storage/logs
storage/framework/cache
storage/framework/views
```
