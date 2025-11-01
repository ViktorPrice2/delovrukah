# Prisma ошибка P3015: не найден `migration.sql`

Эта инструкция поможет восстановить актуальные миграции, если Prisma сообщает `P3015 Could not find the migration file at migration.sql`.

## 1. Подготовьте репозиторий
1. Откройте терминал/PowerShell и перейдите в корень проекта:
   ```powershell
   cd C:\delovrukah
   ```
2. Убедитесь, что локальные правки сохранены, и обновите ветку:
   ```powershell
   git status
   git pull
   ```

## 2. Сбросьте каталог миграций
Мы заменили цепочку инкрементальных миграций одной базовой миграцией `20251101005541_init_with_all_features`. Если локально остались старые папки, Prisma не найдёт их `migration.sql` и выдаст P3015.

1. Удалите локальные артефакты миграций:
   ```powershell
   Remove-Item -Recurse -Force prisma\migrations
   ```
2. Восстановите каталог целиком из Git:
   ```powershell
   git checkout -- prisma/migrations
   ```
3. Убедитесь, что появилась только одна папка миграции и файл блокировки:
   ```powershell
   dir prisma\migrations
   ```

## 3. Пересоздайте базу и примените миграции
1. Если база запущена в Docker, остановите и удалите тома:
   ```powershell
   docker compose down -v
   ```
2. Запустите контейнеры снова и дождитесь готовности PostgreSQL:
   ```powershell
   docker compose up -d
   Start-Sleep -Seconds 5
   ```
3. Примените новую базовую миграцию. Команда автоматически создаст расширение PostGIS и всю схему:
   ```powershell
   pnpm dotenv -- pnpm prisma migrate reset --force --skip-generate
   ```
   > Если используете локальный PostgreSQL, выполните только этот шаг.

## 4. Заполните базу тестовыми данными
После успешного применения миграции запустите сидер:
```powershell
pnpm prisma db seed
```

## 5. Проверка
- [ ] В каталоге `prisma/migrations/` есть папка `20251101005541_init_with_all_features/` и файл `migration_lock.toml`.
- [ ] Команда `pnpm prisma migrate reset --force --skip-generate` завершается без ошибок.
- [ ] Команда `pnpm prisma db seed` выполняется успешно.

После выполнения этих шагов ошибки P3015 и связанные с ней проблемы со схемой (например, P2021 `public.User` не существует) исчезнут.
