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

## 2. Проверьте наличие папки миграции
1. Убедитесь, что существует папка `prisma/migrations/20251031160832_add_is_read_to_chat`:
   ```powershell
   dir prisma\migrations\20251031160832_add_is_read_to_chat
   ```
2. Если папки нет — она была удалена. Восстановите её из Git:
   ```powershell
   git checkout -- prisma/migrations/20251031160832_add_is_read_to_chat
   ```

## 3. Проверьте наличие файла `migration.sql`
1. Откройте содержимое папки и убедитесь, что там лежит файл `migration.sql`:
   ```powershell
   dir prisma\migrations\20251031160832_add_is_read_to_chat\migration.sql
   ```
2. Если файл отсутствует, восстановите его из Git:
   ```powershell
   git checkout -- prisma/migrations/20251031160832_add_is_read_to_chat/migration.sql
   ```
3. Если файл был удалён из истории или вы получили репозиторий без него, создайте его вручную:
   ```powershell
   @"
   -- AlterTable
   ALTER TABLE "ChatMessage" ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;
   "@ | Out-File -FilePath prisma\migrations\20251031160832_add_is_read_to_chat\migration.sql -Encoding utf8 -NoNewline
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
- [ ] Папка `prisma/migrations/20251031160832_add_is_read_to_chat/` существует.
- [ ] В папке лежит файл `migration.sql` с SQL-скриптом выше.
- [ ] Команда `pnpm prisma migrate reset --force --skip-generate` проходит без ошибок.
- [ ] Команда `pnpm prisma migrate deploy` помечает все миграции как `Applied`.
- [ ] Команда `pnpm prisma db seed` выполняется успешно.

После выполнения всех пунктов ошибка P3015, а также связанная с ней ошибка P2021 больше не должны появляться.
