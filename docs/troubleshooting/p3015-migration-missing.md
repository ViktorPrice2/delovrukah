# Prisma ошибка P3015: не найден `migration.sql`

Эта памятка поможет полностью устранить ошибку `P3015 Could not find the migration file at migration.sql` при применении миграций Prisma.

## 1. Подготовка
1. Откройте терминал/PowerShell и перейдите в корень репозитория:
   ```powershell
   cd C:\delovrukah
   ```
2. Убедитесь, что локальный репозиторий чист и обновлён:
   ```powershell
   git status
   git pull
   ```

## 2. Синхронизируйте папку миграций с Git
1. Восстановите содержимое каталога `prisma/migrations` в том виде, как оно хранится в репозитории:
   ```powershell
   git restore --staged --worktree prisma/migrations
   ```
   Эта команда удалит случайно созданные папки и восстановит официальные файлы миграций.
2. После восстановления убедитесь, что внутри каталога находятся только:
   ```
   prisma/migrations/
     ├─ 20251101005541_init_with_all_features/
     │    └─ migration.sql
     └─ migration_lock.toml
   ```

## 3. Проверьте содержимое `migration.sql`
1. Убедитесь, что файл существует и не пустой:
   ```powershell
   Get-Content prisma\migrations\20251101005541_init_with_all_features\migration.sql | Select-Object -First 5
   ```
   Вы должны увидеть SQL c созданием таблиц (`CREATE TABLE "User" ...`).
2. Если файл пустой или повреждён, восстановите его из Git ещё раз:
   ```powershell
   git restore --staged --worktree prisma/migrations/20251101005541_init_with_all_features/migration.sql
   ```

## 4. Сбросьте и примените миграции
1. Остановите запущенные контейнеры базы данных (если используете Docker Compose):
   ```powershell
   docker compose down -v
   ```
2. Запустите их заново и дождитесь готовности PostgreSQL:
   ```powershell
   docker compose up -d
   Start-Sleep -Seconds 5
   ```
3. Выполните полный сброс базы с применением всех миграций:
   ```powershell
   pnpm dotenv -- pnpm prisma migrate reset --force --skip-generate
   ```
   *Если используете локальный PostgreSQL без Docker — выполните только этот шаг.*

## 5. Заполните базу тестовыми данными
После успешного применения миграций запустите сидер:
```powershell
pnpm prisma db seed
```

## 6. Если seed падает с ошибкой P2021 (`public.User` не существует)
Это означает, что база данных не получила необходимые миграции. Проверьте и выполните следующие шаги:

1. Убедитесь, что `DATABASE_URL` указывает на верную базу:
   ```powershell
   echo $env:DATABASE_URL
   ```
   Если переменная пустая, пропишите её (пример для локального Docker):
   ```powershell
   $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/delovrukah?schema=public"
   ```
2. Проверьте статус миграций:
   ```powershell
   pnpm prisma migrate status
   ```
   Все миграции должны быть помечены как `Applied`. Если видите `Pending`, выполните:
   ```powershell
   pnpm prisma migrate deploy
   ```
3. После успешного применения миграций снова запустите сидер:
   ```powershell
   pnpm prisma db seed
   ```

## 7. Контрольный список
- [ ] Каталог `prisma/migrations/` содержит только `20251101005541_init_with_all_features` и `migration_lock.toml`.
- [ ] Файл `migration.sql` внутри папки `20251101005541_init_with_all_features` присутствует и содержит SQL.
- [ ] Команда `pnpm prisma migrate reset --force --skip-generate` проходит без ошибок.
- [ ] Команда `pnpm prisma migrate deploy` помечает все миграции как `Applied`.
- [ ] Команда `pnpm prisma db seed` выполняется успешно.

После выполнения всех пунктов ошибка P3015, а также связанная с ней ошибка P2021 больше не должны появляться.
