# Конструктор логических схем

Веб-тренажёр для лабораторных работ по цифровой логике: собирайте схемы из
логических элементов, проверяйте их по таблицам истинности и выполняйте задания
по методичкам.

- **5 лабораторных работ**: базовые элементы, сумматоры и компараторы,
  дешифраторы и мультиплексоры, триггеры, регистры;
- **свободный режим** с полным набором элементов;
- условные обозначения по **ГОСТ 2.743-91**;
- таблица истинности для отдельного элемента и для всей схемы.

## Скачать

| Система | Файл |
|---|---|
| Windows | ⬇️ **[logical-constructor.exe](https://github.com/Nainyxx/logical-constructor/releases/download/latest/logical-constructor.exe)** |
| Linux | ⬇️ [logical-constructor.AppImage](https://github.com/Nainyxx/logical-constructor/releases/download/latest/logical-constructor.AppImage) |
| macOS | ⬇️ [logical-constructor.dmg](https://github.com/Nainyxx/logical-constructor/releases/download/latest/logical-constructor.dmg) |

Сборки обновляются автоматически после каждого пуша в `main`.

- **Windows** — exe запускается сразу, установка не нужна. SmartScreen может
  предупредить о неизвестном издателе: «Подробнее» → «Выполнить в любом случае».
- **Linux** — сделайте файл исполняемым: `chmod +x logical-constructor.AppImage`.
- **macOS** — приложение не подписано: при первом запуске откройте его через
  правый клик → «Открыть».

## Сборка из исходников

```
cd cons-front
npm install
npm run dev     # режим разработки
npm run build   # веб-сборка в cons-front/dist/
npm run dist    # десктопное приложение для текущей ОС в cons-front/release/
```

Подробнее об устройстве проекта — в [cons-front/README.md](cons-front/README.md).

## Структура репозитория

- `cons-front/` — исходный код приложения (React + Vite, десктоп — Electron);
- `labas/` — методички к лабораторным работам;
- `Диз/` — материалы по дизайну.
