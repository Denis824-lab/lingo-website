# Linmo Website

Статический официальный сайт Linmo. Production публикуется через GitHub Pages
из ветки `main` репозитория `Denis824-lab/Linmo-Website`.

## Важные файлы

- `CNAME` — основной домен `linmoapp.ru`;
- `download.html` — публичная ссылка на проверенный installer;
- `updates/beta.json` — manifest для Linmo;
- `updates/legacy-beta.json` — переходный manifest для старых Lingo;
- `firebase-config.js` — публичная клиентская конфигурация существующего
  Firebase-проекта.

Внутренний Firebase project ID содержит прежнее имя Lingo и не переименовывается:
это постоянный технический идентификатор, а не пользовательский бренд.

## Локальная проверка

Сайт не требует сборщика. Запустите любой статический HTTP-сервер из корня,
например:

```powershell
python -m http.server 8080
```

Перед публикацией JSON manifests должны разбираться без ошибок, URL installer
должен быть публичным, а SHA-256 — совпадать с проверенным GitHub asset.
Полная последовательность описана в `../RELEASE_GUIDE_RU.md`.
