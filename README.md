# OGE Navigator 2027

OGE Navigator 2027 - privacy-first приложение для подготовки к ОГЭ по английскому языку.

Сейчас это первый рабочий фундамент проекта: responsive dashboard с демонстрационными данными, навигацией, блоком прогресса, списком недавних заданий, активными chunks и переключателем светлой/темной темы.

## Технологии

- React
- Vite
- JavaScript
- CSS
- localStorage для выбранной темы, локальных профилей, activeStudentId и учебного прогресса

## Privacy-first подход

В проекте нет Firebase, backend, пользовательских аккаунтов, базы данных, аналитики, трекеров, внешних API, API-ключей или секретов.

Учебные материалы на текущем этапе - demo/mock data. Прогресс, попытки, ошибки и revision сохраняются локально по studentId. Локальные профили используют нейтральные названия и хранятся только в браузере.

## Локальный запуск

```bash
npm install
npm run dev
```

Для production-сборки:

```bash
npm run build
```

## Онлайн-версия

https://tatybelykh.github.io/oge-navigator-2027/

Прогресс и пользовательские данные хранятся только локально в браузере.

## Что реализовано сейчас

- React + Vite проект на JavaScript.
- Главная страница в формате dashboard.
- Desktop sidebar и компактное мобильное меню.
- Переключатель Light / Dark theme с сохранением в localStorage.
- Локальная архитектура профилей учениц: studentId, displayName, examYear, activeStudentId.
- Локальная система прогресса Family & Relationships: chunk status, task attempts, errors, revision queue.
- Demo data вынесены в `src/data/dashboardData.js`.
- Блок общего прогресса с progress ring.
- Progress indicators для навыков и активных chunks.
- Accessibility-база: контраст, focus states, aria-label для меню и темы.

## Что планируется дальше

- Темы ОГЭ.
- Ссылки на официальные задания ФИПИ.
- Собственные exam-style задания.
- Chunks и тренировка фраз.
- Speaking Task 2 и Speaking Task 3.
- Запись аудио в браузере.
- Ошибки ученицы.
- Revision.
- Локальный прогресс.
- Экспорт и импорт прогресса.
