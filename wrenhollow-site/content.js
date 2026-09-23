/*
 * Wrenhollow — editable content.
 * Wrenhollow is a FICTIONAL brewery & distillery used as a demo. Prices, hours,
 * address and product names are placeholders: replace them before launch.
 *
 * FLIGHT BEATS
 *   vh       scroll distance for this beat, in viewport heights (desktop)
 *   from/to  clip time in seconds; from === to makes a still-frame hold
 *   chapter  id of the copy chapter this beat carries (null = motion only)
 *   mvh      optional scroll distance override for phones
 *   focus    optional horizontal crop focus for tall screens (0 left … 1 right)
 */
window.WRENHOLLOW = {
  brand: {
    name: "Wrenhollow",
    tagline: "Brewery & Distillery",
    primaryAction: { label: "Book a tasting", href: "#visit" },
  },

  flight: {
    manifest: "frames/manifest.json",
    poster: "assets/poster.webp",
    beats: [
      { id: "hold-door",  vh: 0.8, mvh: 0.5, from: 0,  to: 0,  chapter: "arrive" },
      { id: "door",       vh: 1.2, mvh: 1.0, from: 0,  to: 3,  chapter: "arrive" },
      { id: "bar",        vh: 1.6, mvh: 1.3, from: 3,  to: 7,  chapter: "taproom" },
      { id: "stills",     vh: 1.8, mvh: 1.5, from: 7,  to: 12, chapter: "stills" },
      { id: "casks",      vh: 2.0, mvh: 1.6, from: 12, to: 17, chapter: "casks" },
      { id: "bottling",   vh: 1.4, mvh: 1.2, from: 17, to: 21, chapter: "bottling" },
      { id: "exit-spin",  vh: 0.9, mvh: 0.8, from: 21, to: 24, chapter: null },
      { id: "reveal",     vh: 1.6, mvh: 1.3, from: 24, to: 30, chapter: "reveal" },
      { id: "hold-aerial",vh: 1.0, mvh: 0.6, from: 30, to: 30, chapter: "reveal" },
    ],
  },

  chapters: {
    arrive: {
      eyebrow: "Alder Vale · On the river",
      title: "Brewed slow.<br>Distilled by the river.",
      short: "Brewed slow. Distilled by the river.",
      body: "Wrenhollow is a working brewhouse and still house in an old red-brick barn. Come in and follow the grain from the kettle to the glass.",
      actions: [
        { label: "Book a tasting", href: "#visit", primary: true },
        { label: "See what’s pouring", href: "#range" },
      ],
      side: "left",
      still: "assets/chapter-arrive.webp",
    },
    taproom: {
      eyebrow: "01 — The Tasting Room",
      title: "Pulled at the bar, a few steps from the kettle",
      short: "The Tasting Room",
      body: "Cask ales, orchard cider and small-batch spirits, poured by the people who made them.",
      actions: [{ label: "What’s on tap", href: "#range" }],
      side: "left",
      still: "assets/chapter-taproom.webp",
    },
    stills: {
      eyebrow: "02 — The Still House",
      title: "Copper & steam",
      short: "Copper & steam",
      body: "Two copper pot stills, run slowly and cut by hand. The distiller decides where the heart of each run begins and ends.",
      actions: [{ label: "Join a still-house tour", href: "#tours" }],
      side: "right",
      still: "assets/chapter-stills.webp",
    },
    casks: {
      eyebrow: "03 — The Barrel Warehouse",
      title: "Patience, in oak",
      short: "Patience, in oak",
      body: "Rows of casks sleep in the cool river air. Nothing leaves the warehouse until it tastes ready.",
      actions: [],
      side: "left",
      still: "assets/chapter-casks.webp",
    },
    bottling: {
      eyebrow: "04 — The Bottling Line",
      title: "Filled here, batch by batch",
      short: "Filled here, batch by batch",
      body: "Every bottle is filled, sealed and labelled on site, and each small batch is numbered.",
      actions: [{ label: "Shop the range", href: "#range" }],
      side: "right",
      still: "assets/chapter-bottling.webp",
    },
    reveal: {
      eyebrow: "Wrenhollow, from above",
      title: "Orchards, barley and the river Alder",
      short: "Come and find us",
      body: "Our apples, grain and water all come from the land you can see from here. Stay for a flight, walk the orchard and take a bottle home.",
      actions: [
        { label: "Book a tasting", href: "#visit", primary: true },
        { label: "Plan your visit", href: "#visit" },
      ],
      side: "center",
      still: "assets/chapter-reveal.webp",
    },
  },

  range: [
    { name: "Hollow Pale", kind: "Cask pale ale · 4.2%", note: "Local barley, bright hops, a soft bitter finish.", price: "£4.80 pint" },
    { name: "Wren’s Nest Stout", kind: "Oatmeal stout · 5.4%", note: "Roasted malt, cocoa and a creamy, dry finish.", price: "£5.20 pint" },
    { name: "Orchard Gate", kind: "Dry cider · 5.8%", note: "Pressed from the trees behind the warehouse.", price: "£5.00 pint" },
    { name: "Alder River Gin", kind: "Copper-pot gin · 42%", note: "Juniper, apple blossom, meadowsweet and river mint.", price: "£38 / 70cl" },
    { name: "Copperhead Malt", kind: "Cask-aged malt spirit · 46%", note: "Double-distilled from our own ale wash, rested in ex-stout casks.", price: "£52 / 70cl" },
    { name: "Ember Reserve", kind: "Barrel-aged barley wine · 10%", note: "Aged in spirit casks. Toffee, dried fig, a little smoke.", price: "£14 / 375ml" },
  ],

  tours: [
    { name: "Tasting Flight", time: "45 min", price: "£18", body: "Six pours at the bar with a host: three beers, the cider and two spirits." },
    { name: "Still House Tour", time: "90 min", price: "£32", body: "Walk the whole route in the film: brewhouse, stills, warehouse and bottling line. Ends with a flight.", featured: true },
    { name: "Barrel Room Masterclass", time: "2 hrs", price: "£65", body: "Taste straight from the cask with the distiller and fill your own 20cl bottle." },
  ],

  process: [
    { n: "01", title: "Grain", body: "Barley from the fields around the barn, malted nearby." },
    { n: "02", title: "Mash & ferment", body: "Brewed in the brewhouse. Some of it becomes ale, some becomes wash." },
    { n: "03", title: "Copper", body: "The wash is run twice through the pot stills and cut by hand." },
    { n: "04", title: "Oak", body: "Spirit and strong ales rest in casks in the riverside warehouse." },
    { n: "05", title: "Bottle", body: "Filled, sealed and numbered on the bottling line." },
  ],

  visit: {
    address: ["Wrenhollow Barn", "Mill Lane, Alder Vale", "(fictional address)"],
    hours: [
      ["Wed – Thu", "12:00 – 21:00"],
      ["Fri – Sat", "12:00 – 23:00"],
      ["Sun", "12:00 – 18:00"],
      ["Mon – Tue", "Closed"],
    ],
    note: "Sample opening hours for this demo.",
  },
};
