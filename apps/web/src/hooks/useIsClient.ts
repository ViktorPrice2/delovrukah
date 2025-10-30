import { useSyncExternalStore } from 'react';

function subscribe() {
  // Это заглушка, нам не нужно ничего делать при подписке,
  // так как состояние "клиент/сервер" никогда не меняется обратно.
  return () => {};
}

/**
 * Этот хук возвращает true, если компонент рендерится на клиенте, и false на сервере.
 * Он использует хук useSyncExternalStore, который является рекомендуемым React способом
 * для работы с состоянием, меняющимся при гидратации.
 * @returns {boolean} - true, если код выполняется в браузере, иначе false.
 */
export function useIsClient() {
  // На сервере getSnapshot вернет false.
  // На клиенте он вернет true. React обработает это изменение во время гидратации.
  const isClient = useSyncExternalStore(
    subscribe,
    () => true, // getSnapshot на клиенте
    () => false // getServerSnapshot на сервере
  );

  return isClient;
}