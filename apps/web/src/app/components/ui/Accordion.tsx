'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type AccordionItem = {
  id: string;
  title: string;
  content: ReactNode;
  description?: ReactNode;
  initiallyOpen?: boolean;
};

export type AccordionProps = {
  items: AccordionItem[];
  allowMultipleOpen?: boolean;
  className?: string;
};

function buildInitialState(items: AccordionItem[], allowMultipleOpen: boolean): string[] {
  const initiallyOpen = items
    .filter((item) => item.initiallyOpen)
    .map((item) => item.id);

  if (initiallyOpen.length > 0) {
    return allowMultipleOpen ? initiallyOpen : [initiallyOpen[0]];
  }

  if (!allowMultipleOpen && items.length > 0) {
    return [items[0].id];
  }

  return initiallyOpen;
}

export function Accordion({ items, allowMultipleOpen = true, className }: AccordionProps) {
  const [openIds, setOpenIds] = useState<string[]>(() => buildInitialState(items, allowMultipleOpen));

  const handleToggle = useCallback(
    (id: string) => {
      setOpenIds((prev) => {
        const isOpen = prev.includes(id);

        if (allowMultipleOpen) {
          if (isOpen) {
            return prev.filter((value) => value !== id);
          }
          return [...prev, id];
        }

        return isOpen ? [] : [id];
      });
    },
    [allowMultipleOpen],
  );

  const sortedItems = useMemo(() => items.filter((item) => Boolean(item.content)), [items]);

  if (sortedItems.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
        {sortedItems.map((item) => {
          const isOpen = openIds.includes(item.id);

          return (
            <div key={item.id} className="group">
              <button
                type="button"
                onClick={() => handleToggle(item.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                <div>
                  <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                  {item.description ? (
                    <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                  ) : null}
                </div>
                <span
                  className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition group-hover:border-emerald-400 group-hover:text-emerald-600"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden px-5 pb-6 text-sm text-slate-700">
                  {typeof item.content === 'string' ? <p>{item.content}</p> : item.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Accordion;
