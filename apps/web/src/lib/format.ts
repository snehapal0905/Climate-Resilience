import i18n from "../i18n";

const locale = () => (i18n.language === "hi" ? "hi-IN" : "en-IN");

export function formatDay(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat(locale(), { ...opts, timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

export function formatNumber(n: number, digits = 0) {
  return new Intl.NumberFormat(locale(), { maximumFractionDigits: digits }).format(n);
}
