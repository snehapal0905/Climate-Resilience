/**
 * Minimal client-side router built on the History API (no dependency).
 * It uses the same popstate signal as lib/urlState.ts, so path changes and the
 * dashboard's query-string state stay in sync with the back/forward buttons.
 */
import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from "react";

const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};

/** "/prepare/" and "/prepare" are the same route. */
export function normalizePath(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export function usePathname(): string {
  return normalizePath(useSyncExternalStore(subscribe, () => window.location.pathname));
}

export function navigate(to: string) {
  if (to === window.location.pathname + window.location.search) {
    window.scrollTo(0, 0);
    return;
  }
  window.history.pushState(null, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string };

/** An <a> that navigates client-side, while keeping ctrl/cmd-click, middle-click etc. as normal links. */
export function Link({ to, onClick, target, ...rest }: LinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (target && target !== "_self")) return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={to} target={target} onClick={handleClick} {...rest} />;
}
