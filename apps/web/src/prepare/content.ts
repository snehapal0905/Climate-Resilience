/**
 * Preparedness content: general educational and action guidance for each hazard.
 *
 * This is deliberately separate from the other two hazard concepts:
 *   hazard registry (../hazards/registry.ts) — identity: name, icon, colour, model status
 *   preparedness content (this file)         — what to know and do, independent of any model
 *   risk data (API / ML service)              — live or model-based intelligence
 *
 * Nothing here is a forecast, alert or risk level. A hazard with no entry shows a
 * "being developed" state rather than invented content.
 */
import type { Hazard } from "@climate/shared";

/** An authoritative source. Only add entries with a verified official URL; never guess one. */
export interface OfficialSource {
  publisher: string;
  title: string;
  url: string;
}

export interface PreparednessGuide {
  /** "What is it?" */
  overview: string;
  /** "Why does it happen?" */
  causes: string;
  /** "Who may be more vulnerable?" */
  vulnerableGroups: string[];
  /** Observable signs to watch; never presented as predictions. */
  warningSigns: string[];
  /** Optional note shown above the warning signs (e.g. when a hazard gives little warning). */
  warningNote?: string;
  before: string[];
  during: string[];
  after: string[];
  doNot: string[];
  /** Hazard-specific additions to the general emergency kit. */
  kitExtras?: string[];
  sources: OfficialSource[];
}

export interface KitItem {
  name: string;
  detail: string;
}

/** General emergency kit, shared by every hazard. */
export const EMERGENCY_KIT: readonly KitItem[] = [
  { name: "Drinking water", detail: "Enough for everyone in the household for a few days, in clean, closed containers." },
  { name: "Basic food", detail: "Ready-to-eat items that keep well, such as dry snacks, biscuits and packaged food." },
  { name: "First-aid supplies", detail: "Bandages, antiseptic, gauze, and any basic items your family regularly needs." },
  { name: "Torch", detail: "A working torch, so you are not relying on a phone for light." },
  { name: "Batteries and power bank", detail: "Spare batteries and a charged power bank for phones and radios." },
  { name: "Essential documents", detail: "Copies of ID, property, bank and medical papers in a waterproof pouch." },
  { name: "Essential medicines", detail: "Regular prescriptions and a written list of doses and conditions." },
  { name: "Communication device", detail: "A charged mobile phone and charger; a battery radio if you have one." },
  { name: "Cash and contacts", detail: "Some cash in small notes and a written list of important phone numbers." },
  { name: "Personal needs", detail: "Clothes, hygiene and sanitary items, and supplies for infants, older people or pets." },
];

export const PREPAREDNESS_DISCLAIMER =
  "Preparedness guidance is for general information. During an active emergency, follow instructions from local authorities and emergency services.";

/** Partial on purpose: a registry hazard may not have guidance yet, and the UI must handle that. */
export const PREPAREDNESS: Partial<Record<Hazard, PreparednessGuide>> = {
  flood: {
    overview:
      "A flood is when water covers land that is normally dry. In India, floods happen most often during the monsoon, but they can also follow cyclones or short bursts of very heavy rain.",
    causes:
      "Heavy or prolonged rainfall, rivers rising over their banks, and drains in towns and cities that cannot carry water away fast enough. Storm surge can flood coastal land, and water released from dams upstream can raise river levels.",
    vulnerableGroups: [
      "People living in low-lying areas, on floodplains or close to riverbanks",
      "Households in kutcha or temporary housing",
      "Older people, young children, and people with disabilities or illness who may need help to move",
      "Families whose livelihoods, grain stores or livestock are on the ground floor",
    ],
    warningSigns: [
      "Flood or heavy-rain warnings from official authorities",
      "Heavy rain continuing for many hours or several days",
      "Water rising in nearby rivers, streams, canals or drains",
      "Water collecting in streets and low-lying areas",
      "In hilly areas, streams suddenly turning muddy or rising quickly",
    ],
    before: [
      "Keep ID, property, bank and medical documents in a waterproof bag",
      "Prepare an emergency kit and keep it where you can grab it quickly",
      "Know the route to higher ground or the nearest relief shelter",
      "Move valuables, grain and electrical items to higher shelves",
      "Plan where livestock can be moved to safety",
      "Keep phones charged and follow official weather and flood updates",
    ],
    during: [
      "Follow evacuation instructions promptly",
      "Move to higher ground or an upper floor if water is rising",
      "Switch off electricity and gas at the main supply, if it is safe to do so",
      "Stay out of floodwater: it can be deeper, faster and dirtier than it looks",
      "Drink only boiled, treated or bottled water",
      "Keep away from drains, canals and fast-flowing streams",
    ],
    after: [
      "Return home only when authorities say it is safe",
      "Check for structural damage and electrical hazards before going inside",
      "Have wiring and appliances checked before switching power back on",
      "Clean and disinfect everything that was in contact with floodwater",
      "Watch for fever, diarrhoea or skin infections and seek medical help if needed",
      "Be careful of snakes and animals that may have sheltered indoors",
    ],
    doNot: [
      "Do not walk, swim or drive through floodwater of unknown depth",
      "Do not touch electrical equipment while wet or standing in water",
      "Do not ignore evacuation instructions",
      "Do not let children play in or near floodwater",
      "Do not eat food that has been in contact with floodwater",
    ],
    kitExtras: ["Waterproof bags for documents and phones", "Water purification tablets and ORS packets"],
    sources: [],
  },

  heatwave: {
    overview:
      "A heatwave is a spell of unusually high temperatures, often lasting several days. Heat can be dangerous even before a formal warning, especially when nights stay warm and the air is humid.",
    causes:
      "Settled weather with clear skies and hot, dry winds can keep temperatures high for days. Delayed rain and dense urban areas that trap heat can make conditions worse.",
    vulnerableGroups: [
      "Older people, infants and young children",
      "Pregnant women",
      "People with heart, lung or kidney conditions, or who take medicines that affect heat tolerance",
      "Outdoor workers such as construction and farm workers, street vendors and delivery workers",
      "People without access to shade, cooling or enough drinking water, and people living alone",
    ],
    warningSigns: [
      "Heat warnings from weather authorities",
      "Days much hotter than usual for the season, and nights that do not cool down",
      "High humidity that makes it feel hotter than the temperature suggests",
      "In people: heavy sweating, dizziness, headache, nausea or muscle cramps (early signs of heat illness)",
    ],
    before: [
      "Plan how to keep your home cool: shades, curtains and ventilation at night",
      "Store enough drinking water for the household",
      "Learn the signs of heat exhaustion and heat stroke",
      "Find cool public places nearby where you can rest if needed",
      "Plan outdoor work for the cooler early-morning and evening hours",
      "Arrange to check on neighbours or relatives who live alone",
    ],
    during: [
      "Drink water regularly, even if you do not feel thirsty",
      "Stay indoors or in shade during the hottest hours of the day",
      "Wear light, loose, light-coloured cotton clothes and cover your head outdoors",
      "Cool down with damp cloths or cool baths",
      "Use oral rehydration solution (ORS) if you are sweating heavily",
      "Treat confusion, fainting or very hot skin as an emergency: get medical help and cool the person",
    ],
    after: [
      "Keep drinking fluids, as recovery from heat stress can take time",
      "Watch for lingering tiredness, headache or dizziness and seek care if it continues",
      "Check again on older people, young children and anyone unwell",
      "Note what helped keep your home and family cool for next time",
    ],
    doNot: [
      "Do not leave children, older people or pets in parked vehicles",
      "Do not do heavy outdoor work or exercise in the hottest hours",
      "Do not rely on alcohol, tea, coffee or sugary drinks to stay hydrated",
      "Do not ignore early signs of heat illness in yourself or others",
    ],
    kitExtras: ["ORS packets", "A hat, cap or umbrella for shade"],
    sources: [],
  },

  cyclone: {
    overview:
      "A tropical cyclone is a large, rotating storm that forms over warm sea. It can bring very strong winds, heavy rain and storm surge, a rise in sea level that floods coastal land. Along India's coasts, cyclones occur most often before and after the monsoon.",
    causes:
      "Cyclones form over warm ocean water, where moist air rises and the storm organises into a rotating system. As they approach land, wind, rain and storm surge can affect both coastal and inland areas.",
    vulnerableGroups: [
      "Coastal and low-lying communities",
      "Fishing communities and anyone at sea",
      "People in kutcha houses, temporary shelters or weak structures",
      "Island communities",
      "Older people, children and people with disabilities who may need help to evacuate",
    ],
    warningSigns: [
      "Official cyclone watch or warning bulletins",
      "Advice for fishers not to go to sea",
      "Winds getting stronger and seas becoming rough",
      "Bands of heavy rain arriving",
      "Unusually high tides or seawater moving inland",
    ],
    before: [
      "Know your nearest cyclone shelter and the route to reach it",
      "Secure or bring indoors loose items that wind could throw",
      "Keep documents and your emergency kit in waterproof bags",
      "Charge phones and power banks, and keep a battery radio if you have one",
      "Store drinking water and dry food",
      "If you fish, return to shore and secure boats when warnings are issued",
    ],
    during: [
      "Evacuate early if you are asked to",
      "If you stay, shelter in the strongest part of the building, away from windows",
      "Switch off electricity and gas if instructed or if water starts entering",
      "Keep following official updates on radio or phone",
      "If the wind suddenly calms, stay where you are: it may be the eye of the storm, and winds can return",
    ],
    after: [
      "Stay in shelter until officials say it is safe to leave",
      "Keep away from fallen power lines, damaged buildings and uprooted trees",
      "Watch for flooding, which can continue after the wind drops",
      "Use only safe drinking water",
      "Check on neighbours, and record damage with photos where it is safe to do so",
    ],
    doNot: [
      "Do not go outside during the storm, even if it seems calm",
      "Do not go to sea after warnings are issued",
      "Do not ignore official evacuation instructions",
      "Do not touch or go near fallen power lines",
      "Do not shelter under trees, hoardings or weak walls",
      "Do not spread unverified information",
    ],
    kitExtras: ["A battery-powered radio", "Waterproof bags for documents and phones"],
    sources: [],
  },

  drought: {
    overview:
      "Drought is a long shortage of water, usually after rainfall stays below normal for an extended period. It develops slowly over weeks or months and can affect drinking water, farming, livestock, health and livelihoods.",
    causes:
      "Below-normal or delayed monsoon rainfall is the main trigger. High temperatures increase evaporation, and heavy use of groundwater and surface water, along with degraded land that holds less water, can deepen shortages.",
    vulnerableGroups: [
      "Rain-fed farming households and agricultural workers",
      "Livestock keepers and pastoral communities",
      "Communities that rely on a single water source",
      "People in arid and semi-arid regions",
      "Children, older people and pregnant women, who are more affected by dehydration and poor nutrition",
    ],
    warningSigns: [
      "Official advisories about rainfall deficit or drought conditions",
      "A delayed or weak monsoon",
      "Falling water levels in wells, ponds and reservoirs",
      "Drying soil and visibly stressed crops",
      "Less fodder and grazing available for livestock",
    ],
    before: [
      "Save water at home: fix leaks and reuse water where it is safe",
      "Harvest rainwater where possible",
      "Ask local agriculture officials about drought-tolerant crops and contingency plans",
      "Plan for fodder and drinking water for livestock",
      "Find out what support your local authorities and agriculture offices provide",
    ],
    during: [
      "Prioritise water for drinking, cooking and hygiene",
      "Store water in clean, covered containers",
      "Follow local water-use restrictions",
      "Watch for dehydration and heat illness, especially in children and older people",
      "Seek veterinary advice if livestock show signs of stress",
    ],
    after: [
      "Keep conserving water while supplies recover",
      "Work with your community to restore ponds, tanks and recharge structures",
      "Review crop and water plans with local agriculture advisers",
      "Reach out for support if financial or emotional stress continues",
    ],
    doNot: [
      "Do not waste water or leave taps running",
      "Do not drink from untested or unsafe water sources",
      "Do not store water in open containers, which can breed mosquitoes",
      "Do not over-extract shared groundwater; it can run dry faster for everyone",
    ],
    kitExtras: ["Clean, covered water storage containers"],
    sources: [],
  },

  landslide: {
    overview:
      "A landslide is the movement of rock, soil or debris down a slope. In India, landslides are most common in hilly and mountainous areas such as the Himalaya, the Western Ghats and the North-East, especially during monsoon rain.",
    causes:
      "Intense or prolonged rain soaking slopes is the most common trigger. Steep terrain, weak or fractured rock, slope cutting for roads and buildings, and loss of vegetation make slopes less stable. Earthquakes can also trigger landslides.",
    vulnerableGroups: [
      "People living on, or at the foot of, steep slopes",
      "Communities along hill streams and narrow valleys",
      "Travellers on hill roads during the monsoon",
      "Homes built on cut slopes or without proper drainage",
      "Visitors who are unfamiliar with local conditions",
    ],
    warningSigns: [
      "Official heavy-rain or landslide advisories",
      "New cracks in the ground, walls or roads",
      "Doors or windows that suddenly stick or jam",
      "Trees, poles or fences starting to tilt",
      "Small rockfalls, or stream water suddenly turning muddy or dropping",
      "Unusual rumbling or cracking sounds from the slope",
    ],
    before: [
      "Find out whether your area has had landslides before",
      "Keep drains and water channels around your home clear",
      "Identify a safer place away from steep slopes and the route to get there",
      "Avoid unnecessary travel on hill roads during heavy rain",
      "Report new cracks or ground movement to local authorities",
      "Keep your emergency kit ready during the monsoon",
    ],
    during: [
      "Move away from the path of the slide as quickly as you can, following official advice",
      "Stay alert during heavy rain, including at night",
      "If you are travelling, watch the road for fallen rocks and debris and do not try to cross it",
      "Follow instructions from local authorities",
    ],
    after: [
      "Stay away from the slide area, as more slides can follow",
      "Report injured or trapped people to emergency services rather than entering unstable ground",
      "Watch for flooding, which can follow landslides",
      "Report broken power, water or gas lines",
      "Have your home checked for damage before returning",
    ],
    doNot: [
      "Do not stay near steep slopes during heavy rain when you have been advised to move",
      "Do not cross landslide debris or fast-flowing hill streams",
      "Do not ignore road closures in hilly areas",
      "Do not cut into slopes or build on them without proper guidance",
      "Do not return to the area before it has been declared safe",
    ],
    kitExtras: ["A whistle to signal for help"],
    sources: [],
  },

  wildfire: {
    overview:
      "A wildfire, often called a forest fire in India, is an uncontrolled fire in forests, grasslands or other vegetation. In India, forest fires are most common in the dry months before the monsoon.",
    causes:
      "Many forest fires start from human activity, such as burning crop residue or vegetation, careless disposal of cigarettes, and campfires. Dry vegetation, heat, low humidity and wind help fires spread.",
    vulnerableGroups: [
      "Communities living in or next to forests",
      "People who collect forest produce",
      "Forest workers and firefighters",
      "People with asthma, lung or heart conditions affected by smoke",
      "Farms and livestock near forest edges",
    ],
    warningSigns: [
      "Fire alerts from the forest department or local authorities",
      "The smell of smoke, visible smoke or falling ash",
      "Long dry spells with hot, windy weather",
      "Thick layers of dry leaves and grass",
    ],
    before: [
      "Clear dry leaves, grass and other flammable material around your home",
      "Keep water, buckets and sand where you can reach them",
      "Know more than one route out of your area",
      "Put out and dispose of any burning material safely",
      "Plan how to move livestock",
      "Know how to report a fire to the forest department or local authorities",
    ],
    during: [
      "Report the fire promptly",
      "Leave early if you are advised to, or if the fire is approaching",
      "Cover your nose and mouth with a damp cloth or mask to reduce smoke",
      "If smoke is heavy but you are not in the fire's path, stay indoors with doors and windows closed",
      "Follow instructions from forest and local authorities",
    ],
    after: [
      "Return only when authorities say it is safe",
      "Watch for smouldering ground and hot spots",
      "Keep away from burned trees, which may fall",
      "Wear a mask when cleaning up ash",
      "Check livestock and water sources for contamination",
    ],
    doNot: [
      "Do not light fires or burn waste or crop residue near forests in the dry season",
      "Do not throw away lit cigarettes or matches near vegetation",
      "Do not try to fight a large fire yourself",
      "Do not drive or walk into thick smoke",
      "Do not go back for belongings once you have left",
    ],
    kitExtras: ["Face masks (N95 or similar) for smoke"],
    sources: [],
  },

  lightning: {
    overview:
      "Lightning is a powerful electrical discharge from a thunderstorm. It can injure or kill people, especially those outdoors, and can damage buildings and start fires.",
    causes:
      "Thunderstorms form when warm, moist air rises quickly. Electrical charge builds up in the storm clouds and is released as lightning. In India, thunderstorms are common before and during the monsoon.",
    vulnerableGroups: [
      "Farmers and farm workers in open fields",
      "Outdoor workers and herders",
      "People sheltering under trees",
      "People fishing or boating on open water",
      "People on rooftops, sports grounds or other open areas",
    ],
    warningSigns: [
      "Thunderstorm or lightning alerts from weather authorities",
      "Dark, towering clouds and a sudden rise in wind",
      "Hearing thunder: if you can hear it, you may be close enough to be struck",
      "Visible lightning flashes",
    ],
    before: [
      "Check the weather forecast before outdoor work or travel",
      "Know where the nearest safe shelter is: a solid building or a hard-top vehicle",
      "Plan outdoor work so you can reach shelter quickly",
      "Unplug electrical appliances before a storm arrives, if it is safe",
    ],
    during: [
      "Go indoors as soon as you hear thunder",
      "Stay away from windows and doors",
      "Avoid using corded phones, taps and plumbing",
      "If you are caught outside with no shelter, move away from tall or isolated objects and crouch low with feet together and head tucked",
      "Get out of water and off boats as quickly as possible",
    ],
    after: [
      "Wait about 30 minutes after the last thunder before going outside",
      "Help anyone who has been struck: they do not carry an electrical charge and can be touched safely",
      "Call emergency services for anyone injured",
      "Check your home for damage or signs of fire",
    ],
    doNot: [
      "Do not shelter under isolated trees",
      "Do not stay in open fields, on hilltops or on rooftops",
      "Do not stay in water or on a boat",
      "Do not lie flat on the ground",
      "Do not hold metal tools or umbrellas with metal parts in the open",
    ],
    sources: [],
  },

  earthquake: {
    overview:
      "An earthquake is sudden shaking of the ground caused by movement along faults in the Earth's crust. Earthquakes cannot currently be reliably predicted, so preparation has to happen in advance. Large parts of India, including the Himalaya and the North-East, lie in higher seismic zones.",
    causes:
      "Stress builds up along faults as the Earth's tectonic plates move. When it is released suddenly, the ground shakes. Most harm comes from collapsing structures and falling objects, and from effects such as fires and landslides.",
    vulnerableGroups: [
      "People in buildings not built to earthquake-resistant standards",
      "People in older multi-storey buildings",
      "Communities in hilly areas where shaking can trigger landslides",
      "People with limited mobility",
      "Schools, hospitals and workplaces without an emergency plan",
    ],
    warningNote: "Earthquakes usually strike without warning, so there is little to watch for beforehand.",
    warningSigns: [
      "Official information about the seismic zone you live in",
      "Aftershocks are common after a large earthquake",
      "Near the coast, strong or long shaking can be a natural tsunami warning",
    ],
    before: [
      "Fix heavy furniture, shelves and water heaters securely to walls",
      "Identify safe spots in each room, such as under a sturdy table",
      "Practise Drop, Cover and Hold On with your household",
      "Learn how to switch off gas and electricity",
      "Find out whether your building meets earthquake-resistant standards",
      "Keep your emergency kit and sturdy shoes near your bed",
    ],
    during: [
      "Drop to the ground, take cover under sturdy furniture and hold on",
      "If indoors, stay inside until the shaking stops",
      "Keep away from windows, glass and heavy objects that could fall",
      "If outdoors, move to an open area away from buildings, trees and power lines",
      "If driving, stop in an open place and stay inside the vehicle",
    ],
    after: [
      "Expect aftershocks and be ready to Drop, Cover and Hold On again",
      "Check yourself and others for injuries",
      "Leave damaged buildings carefully, using the stairs",
      "If you smell gas, open windows, leave, and report it",
      "If you are near the coast and the shaking was strong, move to higher ground",
      "Follow official information",
    ],
    doNot: [
      "Do not use lifts or elevators",
      "Do not rush toward exits while the building is shaking",
      "Do not rely on doorways for protection",
      "Do not light matches or use open flames after the shaking",
      "Do not enter damaged buildings",
      "Do not spread rumours about further earthquakes",
    ],
    kitExtras: ["Sturdy shoes", "A whistle to signal for help"],
    sources: [],
  },

  tsunami: {
    overview:
      "A tsunami is a series of large sea waves, usually caused by an undersea earthquake. Waves can reach the coast within minutes to hours and may keep arriving for hours. India's coasts and island territories can be affected.",
    causes:
      "Most tsunamis are caused by large earthquakes under or near the sea. Undersea landslides and volcanic eruptions can also cause them.",
    vulnerableGroups: [
      "People in low-lying coastal areas and on beaches",
      "Fishing communities and harbour workers",
      "Tourists who are unfamiliar with local warning signs",
      "Island communities",
      "People who need help to evacuate quickly",
    ],
    warningSigns: [
      "Official tsunami warnings",
      "Strong or long-lasting earthquake shaking felt near the coast",
      "The sea suddenly pulling back and exposing the seabed",
      "An unusual roaring sound from the ocean",
    ],
    before: [
      "Find out whether your home, school or workplace is in a coastal evacuation area",
      "Identify higher ground, or a tall and sturdy building, that you can reach on foot",
      "Practise the evacuation route with your household",
      "Keep a grab-bag emergency kit you can carry while walking",
      "When visiting the coast, learn the local evacuation routes",
    ],
    during: [
      "If you feel strong shaking near the coast or see the sea pull back, move to higher ground or inland immediately",
      "Do not wait for an official warning if you notice natural signs",
      "Go on foot where possible, as roads may be congested",
      "If you are on a boat, follow instructions from coastal authorities",
      "Follow official instructions and updates",
    ],
    after: [
      "Stay on higher ground until authorities announce it is safe: more waves can follow",
      "Keep away from flooded and damaged areas",
      "Watch for debris and fallen power lines",
      "Use only safe drinking water",
    ],
    doNot: [
      "Do not go to the beach to watch the waves",
      "Do not return after the first wave",
      "Do not collect fish or shells from the exposed seabed",
      "Do not rely on a vehicle if roads may be congested",
    ],
    kitExtras: ["A lightweight grab bag you can carry on foot"],
    sources: [],
  },
};

export function getPreparedness(hazard: Hazard): PreparednessGuide | undefined {
  return PREPAREDNESS[hazard];
}
