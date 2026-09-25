/**
 * /emergency — Emergency Center. Public, static and honest: verified contacts, what to do now,
 * and routes to existing features. No live alerts, statuses, dispatch or location access.
 */
import { useState } from "react";
import type { Hazard } from "@climate/shared";
import { Link } from "../lib/router";
import { formatDay } from "../lib/format";
import { HazardTile } from "../hazards/HazardBits";
import { getHazard, HAZARD_REGISTRY, parseHazard, prepareHazardHref } from "../hazards/registry";
import { getPreparedness } from "../prepare/content";
import { ArrowIcon, DoNotList, SectionTitle } from "../prepare/PrepareBits";
import { ROUTES } from "../site/SiteLayout";
import { EMERGENCY_CONTACTS, getContact, HELP_OPTIONS, isCallable, OFFICIAL_SOURCES, type EmergencyContact } from "./contacts";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-green";

function PhoneIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4.5 2.5h3l1.5 4-2 1.3a9.5 9.5 0 0 0 5.2 5.2l1.3-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A14.5 14.5 0 0 1 3 4.1 1.5 1.5 0 0 1 4.5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A tel: link. Tapping opens the device's phone app; nothing is dialled automatically. */
function CallButton({ contact, size = "md", className = "" }: { contact: EmergencyContact & { number: string }; size?: "md" | "lg"; className?: string }) {
  const primary = contact.id === "unified";
  return (
    <a
      href={`tel:${contact.number}`}
      aria-label={`Call ${contact.name}, ${contact.number.split("").join(" ")}`}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
        size === "lg" ? "min-h-14 px-7 text-[18px]" : "min-h-12 px-5 text-[16px]"
      } ${
        primary
          ? "bg-lp-alert text-white hover:bg-[#861d18] focus-visible:outline-lp-alert"
          : "bg-lp-ink text-white hover:bg-lp-green-deep focus-visible:outline-lp-ink"
      } ${className}`}
    >
      <PhoneIcon />
      Call {contact.number}
    </a>
  );
}

function Hero() {
  const unified = getContact("unified");
  return (
    <section className="border-b border-lp-line">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12 lg:px-8">
        <p className="mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-lp-alert">
          <span className="h-2 w-2 rounded-full bg-lp-alert" aria-hidden="true" />
          Emergency
        </p>
        <h1 className="font-lp-display text-[40px] leading-[1.05] tracking-[-0.02em] text-lp-ink sm:text-[56px]">Emergency Center</h1>
        <p className="mt-4 max-w-2xl text-[18px] leading-relaxed text-lp-ink-2">Quick access to emergency services, safety guidance, and essential contacts.</p>

        <div className="mt-8 flex flex-col gap-5 rounded-2xl border border-lp-alert/25 bg-lp-alert-soft p-5 sm:p-7 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="text-[19px] font-semibold leading-snug text-lp-ink sm:text-[21px]">
              If you are in immediate danger, contact the appropriate emergency service in your area.
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-lp-ink-2">
              In India, <strong className="font-semibold text-lp-ink">112</strong> is the single emergency number for police, fire & rescue and health emergencies.
            </p>
          </div>
          {isCallable(unified) && (
            <div className="flex shrink-0 flex-col items-stretch gap-2 md:items-end">
              <CallButton contact={unified} size="lg" />
              <p className="text-center text-[12.5px] text-lp-ink-3 md:text-right">Opens your phone app. Nothing is dialled automatically.</p>
            </div>
          )}
        </div>

        <nav aria-label="On this page" className="mt-6">
          <ul className="flex flex-wrap gap-2">
            {[
              ["#contacts", "Emergency contacts"],
              ["#need-help", "I need help with…"],
              ["#during-a-disaster", "During a disaster"],
              ["#official", "Official instructions"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className={`inline-flex min-h-10 items-center rounded-full border border-lp-line-strong bg-lp-surface px-4 text-[14px] font-medium text-lp-ink hover:border-lp-ink-3 ${focusRing}`}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}

function NoLiveAlerts() {
  return (
    <aside aria-label="Live alerts" className="flex items-start gap-3 rounded-xl border border-lp-line bg-lp-surface p-4 sm:p-5">
      <svg className="mt-0.5 h-5 w-5 shrink-0 text-lp-ink-3" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 2.5a5 5 0 0 0-5 5v3l-1.5 3h13L15 10.5v-3a5 5 0 0 0-5-5ZM8 16a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="m3 3 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <p className="text-[15px] leading-relaxed text-lp-ink-2">
        <span className="font-semibold text-lp-ink">Live emergency alerts are not currently available.</span> This page does not show active emergencies,
        evacuation orders or alert status. The absence of an alert here does not mean an area is safe.
      </p>
    </aside>
  );
}

function ContactCard({ contact }: { contact: EmergencyContact }) {
  const callable = isCallable(contact);
  const unified = getContact("unified");
  return (
    <li id={`contact-${contact.id}`} className="flex scroll-mt-24 flex-col rounded-xl border border-lp-line bg-lp-surface p-5 sm:p-6">
      <h3 className="text-[16px] font-semibold text-lp-ink">{contact.name}</h3>
      {callable ? (
        <>
          <p className="mt-1 font-lp-display text-[40px] leading-none tracking-tight text-lp-ink tabular-nums">{contact.number}</p>
          <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-lp-ink-2">{contact.description}</p>
          <CallButton contact={contact} className="mt-5 w-full" />
          <p className="mt-3 text-[12.5px] leading-snug text-lp-ink-3">
            Source:{" "}
            <a href={contact.source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-lp-ink">
              {contact.source.publisher}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            {contact.verifiedOn && <> · checked {formatDay(contact.verifiedOn, { day: "numeric", month: "short", year: "numeric" })}</>}
          </p>
        </>
      ) : (
        <>
          <p className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-lp-line-strong bg-lp-bg px-2.5 py-0.5 text-[12.5px] font-medium text-lp-ink-2">
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 5v3.2l2 1.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Being verified
          </p>
          <p className="mt-3 text-[14.5px] leading-relaxed text-lp-ink-2">{contact.description}</p>
          <p className="mt-2 flex-1 text-[14.5px] font-medium leading-relaxed text-lp-ink">Contact information is being verified.</p>
          {contact.fallback && <p className="mt-1 text-[14px] leading-relaxed text-lp-ink-2">{contact.fallback}</p>}
          {isCallable(unified) && <CallButton contact={unified} className="mt-5 w-full" />}
        </>
      )}
    </li>
  );
}

function Contacts() {
  return (
    <section id="contacts" aria-labelledby="contacts-title" className="scroll-mt-20">
      <SectionTitle id="contacts-title" title="Emergency contacts">
        National numbers checked against official government sources. Services and availability can vary by state.
      </SectionTitle>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EMERGENCY_CONTACTS.map((c) => (
          <ContactCard key={c.id} contact={c} />
        ))}
      </ul>
    </section>
  );
}

function NeedHelp() {
  return (
    <section id="need-help" aria-labelledby="need-help-title" className="scroll-mt-20">
      <SectionTitle id="need-help-title" title="I need help with…">
        Find the right service and the first things to do.
      </SectionTitle>
      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {HELP_OPTIONS.map((o) => (
          <li key={o.id} className="rounded-xl border border-lp-line bg-lp-surface p-5">
            <h3 className="text-[18px] font-semibold text-lp-ink">{o.label}</h3>
            <ol className="mt-2 space-y-1 text-[15px] leading-relaxed text-lp-ink-2">
              {o.steps.map((s, i) => (
                <li key={s} className="flex gap-2">
                  <span className="font-medium text-lp-ink-3" aria-hidden="true">
                    {i + 1}.
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              {o.contacts.map((id) => {
                const c = getContact(id);
                return isCallable(c) ? (
                  <a
                    key={id}
                    href={`tel:${c.number}`}
                    aria-label={`Call ${c.name}, ${c.number.split("").join(" ")}`}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[15px] font-semibold transition-colors ${
                      id === "unified" ? "border-lp-alert bg-lp-alert text-white hover:bg-[#861d18]" : "border-lp-line-strong bg-lp-surface text-lp-ink hover:border-lp-ink-3"
                    } ${focusRing}`}
                  >
                    <PhoneIcon className="h-4 w-4" />
                    {c.number}
                    <span className="font-normal">· {c.name}</span>
                  </a>
                ) : (
                  <a key={id} href={`#contact-${id}`} className={`inline-flex min-h-11 items-center rounded-full border border-dashed border-lp-line-strong px-4 text-[14px] text-lp-ink-2 hover:text-lp-ink ${focusRing}`}>
                    {c.name}: being verified
                  </a>
                );
              })}
              {o.more && (
                <a href={o.more.href} className={`inline-flex min-h-11 items-center gap-1.5 px-2 text-[14.5px] font-medium text-lp-green underline-offset-4 hover:underline ${focusRing}`}>
                  {o.more.label}
                  <ArrowIcon />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The selected hazard is kept in ?hazard= so the view can be shared or bookmarked. */
function initialHazard(): Hazard | undefined {
  return parseHazard(new URLSearchParams(window.location.search).get("hazard"));
}

function DuringDisaster({ hazard, onSelect }: { hazard?: Hazard; onSelect: (h: Hazard) => void }) {
  const guide = hazard ? getPreparedness(hazard) : undefined;
  const meta = hazard ? getHazard(hazard) : undefined;
  return (
    <section id="during-a-disaster" aria-labelledby="during-title" className="scroll-mt-20">
      <SectionTitle id="during-title" title="During a disaster">
        Choose a hazard to see what to do now.
      </SectionTitle>
      <div role="group" aria-label="Choose a hazard" className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-9">
        {HAZARD_REGISTRY.map((h) => {
          const selected = h.id === hazard;
          return (
            <button
              key={h.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(h.id)}
              className={`flex min-h-12 items-center gap-2 rounded-lg border px-3 py-2 text-left text-[14.5px] font-medium transition-colors lg:flex-col lg:justify-center lg:gap-1.5 lg:py-3 lg:text-center ${
                selected ? "border-lp-green bg-lp-green-soft text-lp-green" : "border-lp-line bg-lp-surface text-lp-ink hover:border-lp-ink-3"
              } ${focusRing}`}
            >
              <HazardTile hazard={h.id} size="sm" />
              {h.name}
            </button>
          );
        })}
      </div>

      <div className="mt-5" aria-live="polite">
        {!hazard || !meta ? (
          <p className="rounded-xl border border-dashed border-lp-line-strong bg-lp-surface px-5 py-6 text-[15px] text-lp-ink-2">Select a hazard above to see a short checklist.</p>
        ) : !guide ? (
          <p className="rounded-xl border border-dashed border-lp-line-strong bg-lp-surface px-5 py-6 text-[15px] text-lp-ink-2">
            Preparedness guidance for this hazard is being developed. Follow instructions from your local authorities and emergency services.
          </p>
        ) : (
          <div className="rounded-2xl border border-lp-line bg-lp-surface p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <HazardTile hazard={meta.id} />
              <h3 className="text-[22px] font-semibold tracking-tight text-lp-ink">{meta.name}: what to do now</h3>
            </div>
            <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <h4 className="text-[13px] font-medium uppercase tracking-[0.12em] text-lp-ink-3">Do</h4>
                <ol className="mt-3 space-y-2.5">
                  {guide.during.map((s, i) => (
                    <li key={s} className="flex gap-3 text-[16px] leading-snug text-lp-ink">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lp-green-soft text-[13px] font-semibold text-lp-green" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <h4 className="text-[13px] font-medium uppercase tracking-[0.12em] text-lp-ink-3">Do not</h4>
                <div className="mt-3">
                  <DoNotList items={guide.doNot.slice(0, 3)} singleColumn />
                </div>
              </div>
            </div>
            <Link to={prepareHazardHref(meta.id)} className={`mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium text-lp-green underline-offset-4 hover:underline ${focusRing}`}>
              Full {meta.name.toLowerCase()} guide: before, during and after
              <ArrowIcon />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function Shortcuts({ hazard }: { hazard?: Hazard }) {
  const card = "flex flex-col rounded-2xl border border-lp-line bg-lp-surface p-6 sm:p-7";
  const button = `mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium sm:w-fit ${focusRing}`;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section aria-labelledby="local-risk-title" className={card}>
        <h2 id="local-risk-title" className="text-[20px] font-semibold text-lp-ink">
          Know your local risk
        </h2>
        <p className="mt-2 flex-1 text-[15px] leading-relaxed text-lp-ink-2">
          See model-based risk information for your area, where it is available. Your location is only requested after you choose to share it.
        </p>
        <Link to={ROUTES.amISafe} className={`${button} border border-lp-line-strong text-lp-ink hover:border-lp-ink-3`}>
          Check My Location
          <ArrowIcon />
        </Link>
      </section>
      <section aria-labelledby="prepare-title" className={card}>
        <h2 id="prepare-title" className="text-[20px] font-semibold text-lp-ink">
          Prepare before an emergency
        </h2>
        <p className="mt-2 flex-1 text-[15px] leading-relaxed text-lp-ink-2">
          Checklists for before, during and after each hazard, and what to keep in your emergency kit.
        </p>
        <Link to={hazard ? prepareHazardHref(hazard) : ROUTES.prepare} className={`${button} bg-lp-green text-white hover:bg-lp-green-deep`}>
          {hazard ? `Open ${getHazard(hazard).name} Preparedness Guide` : "Open Preparedness Guide"}
          <ArrowIcon />
        </Link>
      </section>
    </div>
  );
}

function OfficialInstructions() {
  return (
    <section id="official" aria-labelledby="official-title" className="scroll-mt-20">
      <SectionTitle id="official-title" title="Follow official instructions">
        During an active emergency, follow current instructions from government and local authorities, including evacuation advice. Conditions can change quickly.
      </SectionTitle>
      <div className="mt-6 rounded-xl border border-lp-line bg-lp-surface p-5 sm:p-6">
        {OFFICIAL_SOURCES.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {OFFICIAL_SOURCES.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className={`text-[16px] font-medium text-lp-green underline-offset-4 hover:underline ${focusRing}`}>
                  {s.title}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                <span className="block text-[13.5px] text-lp-ink-3">{s.publisher}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-lp-ink-2">Follow instructions from your local authorities and emergency services.</p>
        )}
        <p className="mt-5 border-t border-lp-line pt-4 text-[14px] leading-relaxed text-lp-ink-2">
          Your state and district administration also publish local control-room numbers and instructions. Follow instructions from your local authorities and emergency services.
        </p>
      </div>
    </section>
  );
}

export default function EmergencyPage() {
  const [hazard, setHazard] = useState<Hazard | undefined>(initialHazard);
  const select = (h: Hazard) => {
    setHazard(h);
    const url = new URL(window.location.href);
    url.searchParams.set("hazard", h);
    window.history.replaceState(null, "", url);
  };

  return (
    <>
      <Hero />
      <div className="mx-auto max-w-7xl space-y-14 px-4 py-10 sm:space-y-20 sm:px-6 sm:py-14 lg:px-8">
        <NoLiveAlerts />
        <Contacts />
        <NeedHelp />
        <DuringDisaster hazard={hazard} onSelect={select} />
        <Shortcuts hazard={hazard} />
        <OfficialInstructions />
        <p className="rounded-lg bg-lp-sand/60 px-4 py-3 text-[13.5px] leading-relaxed text-lp-ink-2">
          This page is for general information and does not replace emergency services. ClimateResilience does not receive calls, dispatch help or track your
          location.
        </p>
      </div>
    </>
  );
}
