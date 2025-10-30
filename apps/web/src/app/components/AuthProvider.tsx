'use client';

import { useEffect } from 'react';
import { useAuth } from '../store/auth.store';

/**
 * Этот компонент-провайдер отвечает за инициализацию состояния аутентификации
 * при первой загрузке приложения в браузере.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Получаем действие rehydrate из стора
  const rehydrate = useAuth((state) => state.rehydrate);

  useEffect(() => {
    // rehydrate() теперь сама вызовет fetchUser, если найдет токен.
    // Это действие выполняется только один раз при монтировании компонента.
    rehydrate();
  }, [rehydrate]);

  return <>{children}</>;
}