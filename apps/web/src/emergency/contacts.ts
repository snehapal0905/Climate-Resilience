/**
 * Emergency Center data: contacts, "I need help with…" routes and official sources.
 *
 * Kept separate from the hazard registry (identity), preparedness content (guidance) and
 * risk data (models). Nothing here is live: there is no alert feed, incident or status data.
 *
 * Numbers: a contact only gets a `number` once it has been checked against an official
 * government page, recorded in `source` with the date checked. Otherwise `number` is null and
 * the UI shows "Contact information is being verified" — never a guessed number.
 */

export interface SourceRef {
  publisher: string;
  title: string;
  url: string;
}

export type ContactId = "unified" | "police" | "fire" | "medical" | "disaster" | "women" | "child";

export interface EmergencyContact {
  id: ContactId;
  name: string;
  /** Dialable digits only, or null while unverified. */
  number: string | null;
  description: string;
  /** Required whenever `number` is set. */
  source?: SourceRef;
  /** ISO date the number was last checked against `source`. */
  verifiedOn?: string;
  /** Shown when `number` is null: what to do instead. */
  fallback?: string;
}

const CHECKED = "2026-09-25";

const MHA_ERSS: SourceRef = {
  publisher: "Ministry of Home Affairs, Government of India",
  title: "Emergency Response Support System (ERSS)",
  url: "https://www.mha.gov.in/en/commoncontent/emergency-response-support-system-erss",
};
const TOURISM_EMERGENCY: SourceRef = {
  publisher: "Ministry of Tourism, Government of India",
  title: "Emergency numbers (Incredible India)",
  url: "https://www.incredibleindia.gov.in/en/emergency",
};

export const EMERGENCY_CONTACTS: readonly EmergencyContact[] = [
  {
    id: "unified",
    name: "National emergency number",
    number: "112",
    description: "Single emergency number for police, fire & rescue, health and other emergency services across India.",
    source: MHA_ERSS,
    verifiedOn: CHECKED,
  },
  {
    id: "police",
    name: "Police",
    number: "100",
    description: "Police assistance. You can also reach police through 112.",
    source: TOURISM_EMERGENCY,
    verifiedOn: CHECKED,
  },
  {
    id: "fire",
    name: "Fire & rescue",
    number: "101",
    description: "Fire services. You can also reach fire & rescue through 112.",
    source: TOURISM_EMERGENCY,
    verifiedOn: CHECKED,
  },
  {
    id: "medical",
    name: "Ambulance / medical emergency",
    number: null,
    description: "Emergency medical help and ambulance services.",
    fallback: "Ambulance numbers differ between states. For a medical emergency, call 112.",
  },
  {
    id: "disaster",
    name: "Disaster management control room",
    number: null,
    description: "State and district disaster control rooms.",
    fallback: "Control-room numbers differ between states and districts. In danger, call 112 and follow your local authorities.",
  },
  {
    id: "women",
    name: "Women Helpline",
    number: "181",
    description: "Toll-free, 24-hour support for women, including emergency assistance through 112.",
    source: {
      publisher: "Ministry of Women and Child Development, Government of India",
      title: "Women Helpline 181",
      url: "https://wcd.gov.in/offerings/women--helpline--scheme",
    },
    verifiedOn: CHECKED,
  },
  {
    id: "child",
    name: "Child Helpline",
    number: "1098",
    description: "24x7 helpline for children in need of care and protection, linked with 112.",
    source: {
      publisher: "Ministry of Women and Child Development, Government of India",
      title: "Child Helpline 1098",
      url: "https://wcd.gov.in/child/child-helpline",
    },
    verifiedOn: CHECKED,
  },
];

const BY_ID = new Map(EMERGENCY_CONTACTS.map((c) => [c.id, c]));
export const getContact = (id: ContactId) => BY_ID.get(id)!;

/** A contact is callable only with a verified number and a source. */
export const isCallable = (c: EmergencyContact): c is EmergencyContact & { number: string; source: SourceRef } => c.number !== null && c.source !== undefined;

/** "I need help with…": each option points to contacts and plain next steps. No backend workflow. */
export interface HelpOption {
  id: string;
  label: string;
  steps: string[];
  contacts: ContactId[];
  /** In-page or site link for more help. */
  more?: { label: string; href: string };
}

export const HELP_OPTIONS: readonly HelpOption[] = [
  {
    id: "medical",
    label: "Medical emergency",
    steps: ["Call 112 and say it is a medical emergency.", "Tell them where you are and the person's condition."],
    contacts: ["unified", "medical"],
  },
  {
    id: "fire",
    label: "Fire",
    steps: ["Get everyone out and away from the fire and smoke.", "Call fire services from a safe place."],
    contacts: ["fire", "unified"],
  },
  {
    id: "police",
    label: "Police assistance",
    steps: ["Move somewhere safer if you can.", "Call police and describe what is happening and where."],
    contacts: ["police", "unified"],
  },
  {
    id: "disaster",
    label: "Disaster-related danger",
    steps: ["Move away from immediate danger.", "Call 112 if someone is at risk, and follow local authorities."],
    contacts: ["unified", "disaster"],
    more: { label: "What to do during a disaster", href: "#during-a-disaster" },
  },
  {
    id: "unsafe-location",
    label: "Unsafe location",
    steps: ["Move to a safer place if it is safe to do so.", "Call 112 if you are in danger or cannot leave."],
    contacts: ["unified"],
  },
  {
    id: "missing",
    label: "Someone is missing",
    steps: ["Contact police as soon as possible.", "If the missing person is a child, also call the Child Helpline."],
    contacts: ["police", "child"],
  },
  {
    id: "women-children",
    label: "A woman or child is unsafe",
    steps: ["If there is immediate danger, call 112.", "For support and advice, use the Women Helpline or Child Helpline."],
    contacts: ["unified", "women", "child"],
  },
];

/** Official sources for current instructions. Only links checked on the date above. */
export const OFFICIAL_SOURCES: readonly SourceRef[] = [
  { publisher: "National Disaster Management Authority", title: "NDMA: disaster guidance, do's and don'ts", url: "https://ndma.gov.in/" },
  { publisher: "Ministry of Home Affairs", title: "112 India: Emergency Response Support System", url: "https://112.gov.in/" },
];
