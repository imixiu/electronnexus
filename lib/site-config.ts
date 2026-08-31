export const siteConfig = {
  name: "electronnexus",
  title: "ElectronNexus - Your Guide to Consumer Electronics",
  description: "Expert reviews, buying guides, and the latest news on smartphones, laptops, audio gear, smart home devices, wearables, and gaming tech.",
  tagline: "Navigate the Future of Tech",
  url: "https://electronnexus.com",
  colors: {
    primary: "#6366f1",
    primaryDark: "#4f46e5",
    secondary: "#8b5cf6",
    accent: "#06b6d4",
  },
  categories: [
    {
      key: "smartphones",
      label: "Smartphones",
      description: "Latest smartphone reviews, comparisons, and buying guides for every budget.",
      bannerIntro: "Choosing a smartphone in 2026 means navigating an overwhelming field of flagships, mid-range contenders, and budget surprises — each promising the best camera, longest battery, and fastest performance. This section cuts through the marketing noise with hands-on testing across real-world scenarios: 500+ photo samples in varied lighting conditions, 48-hour battery drain tests, thermal throttling benchmarks during sustained gaming, and display calibration checks against reference monitors. We cover every major platform — Apple, Samsung, Google, OnePlus, Xiaomi — and evaluate them on the metrics that actually affect daily use: screen brightness under direct sunlight, speaker quality for calls, charging speed under load, and software update commitments. Whether you are deciding between a $200 budget phone and a $1,200 flagship, or comparing camera systems across three generations, the guides here are built on measured data rather than spec-sheet promises. We also track the secondary market — refurbished units, trade-in values, and carrier deals — so you can find the best phone at the best price point for your specific needs.",
    },
    {
      key: "laptopspcs",
      label: "Laptops & Computers",
      description: "In-depth laptop and desktop reviews for work, creativity, and everyday use.",
      bannerIntro: "The laptop and desktop market has fractured into more use cases than ever: ultrabooks for travel productivity, mobile workstations for on-site engineering, gaming rigs that double as content creation machines, and mini PCs that replace full towers for home servers and media centers. This section evaluates each category through sustained real-world workloads rather than synthetic benchmarks alone. We run multi-day productivity workflows — simultaneous video calls, browser tabs, code compilation, and spreadsheet modeling — to measure thermal behavior, fan noise, and battery degradation under actual usage patterns. For creative professionals, we benchmark 4K and 8K video export times in DaVinci Resolve, Photoshop batch processing speeds, and 3D rendering performance in Blender. Keyboard feel, trackpad accuracy, port selection, and webcam quality get equal attention because they affect every hour of use. Our buying guides organize recommendations by primary use case — student, remote worker, video editor, developer, gamer — with clear explanations of why certain specs matter more for each workflow and where spending more delivers diminishing returns.",
    },
    {
      key: "audio",
      label: "Audio & Headphones",
      description: "Headphones, earbuds, speakers, and audio equipment reviews and recommendations.",
      bannerIntro: "Audio equipment selection sits at the intersection of subjective listening experience and measurable acoustic performance. This section addresses both sides: we measure frequency response curves, active noise cancellation depth in decibels across different noise profiles (airplane cabin, open office, subway), driver distortion at various volume levels, and battery endurance under real-world listening patterns. But we also spend weeks with each product to evaluate comfort during extended sessions, call quality in windy environments, codec support for high-resolution streaming, and the software ecosystem that controls EQ profiles and firmware updates. Coverage spans the full range from $30 earbuds to $400 over-ear ANC headphones, from portable Bluetooth speakers to soundbar systems with Dolby Atmos room calibration. We test multi-device pairing reliability, latency for video watching and gaming, and how well each product handles the transition between noise cancellation and transparency modes. Whether you are an audiophile evaluating open-back headphones for critical listening or a commuter looking for earbuds that survive daily abuse, the reviews here prioritize consistent methodology over first-impressions takes.",
    },
    {
      key: "smarthome",
      label: "Smart Home",
      description: "Smart home devices, IoT gadgets, and home automation guides.",
      bannerIntro: "Building a smart home that actually works requires understanding three separate problems: device compatibility across ecosystems (Apple HomeKit, Google Home, Amazon Alexa, Matter protocol), network infrastructure that can handle dozens of connected devices without degrading WiFi performance, and privacy implications of putting microphones and cameras throughout your living space. This section tackles each layer systematically. We test mesh WiFi systems across homes ranging from 1,200 to 5,000 square feet, measuring throughput at every node, handoff latency between access points, and stability under heavy streaming and video call loads. Smart lock reviews evaluate physical security alongside app reliability and guest access management. Smart lighting guides cover color accuracy, dimming range, and the automation routines that genuinely improve daily life versus those that add complexity without value. We also audit each manufacturer's data handling policies, local versus cloud processing options, and what happens to your devices if the company shuts down its servers. The goal is a connected home that enhances comfort and efficiency without creating new failure points or privacy vulnerabilities.",
    },
    {
      key: "wearables",
      label: "Wearables",
      description: "Smartwatch, fitness tracker, and wearable technology reviews and news.",
      bannerIntro: "Wearable technology has matured from novelty step counters into serious health and fitness tools — but accuracy varies dramatically between products and use cases. This section validates wearable claims against reference equipment: heart rate sensors compared to chest strap monitors during interval training, GPS tracks measured against surveyed distance, SpO2 readings cross-checked with pulse oximeters, and sleep staging algorithms evaluated against user-reported sleep quality. We test battery life under realistic conditions — always-on display enabled, GPS tracking three times per week, notifications flowing throughout the day — rather than manufacturer-stated maximums. Beyond fitness metrics, we evaluate smartwatch functionality for daily productivity: notification management, voice assistant responsiveness, contactless payment reliability, and third-party app ecosystems. The guides address specific user profiles — marathon runners who need accurate pace and distance, gym-goers tracking strength progress, people managing chronic conditions with continuous monitoring — and recommend devices based on which sensors and algorithms actually deliver for each scenario. We also track the rapidly evolving landscape of non-invasive glucose monitoring, blood pressure estimation, and body composition analysis to separate genuine breakthroughs from marketing claims.",
    },
    {
      key: "gaming",
      label: "Gaming & Entertainment",
      description: "Gaming consoles, accessories, monitors, and entertainment tech coverage.",
      bannerIntro: "Gaming hardware sits at the intersection of raw performance, input responsiveness, and display quality — and each component in the chain affects the others. This section evaluates gaming tech through competitive and immersive scenarios: input lag measured with high-speed cameras at millisecond precision, monitor response times tested for ghosting and overshoot across refresh rates, HDR peak brightness and color volume validated against reference displays, and console frame rates tracked during actual gameplay sequences rather than benchmark loops. We cover the full ecosystem — OLED and mini-LED gaming monitors, mechanical keyboards with different switch types, mice evaluated for sensor accuracy and click latency, headsets tested for positional audio accuracy in competitive shooters, and controllers assessed for stick drift, trigger response, and ergonomic comfort during extended sessions. Console comparisons go beyond teraflops to examine load times, backward compatibility, subscription value, and exclusive library strength. For entertainment beyond gaming, we evaluate streaming devices on codec support, upscaling quality, and interface responsiveness, and home theater setups on Dolby Atmos implementation, room correction algorithms, and the speaker configurations that deliver cinematic immersion at different budget levels.",
    },
    {
      key: "more",
      label: "More Electronics",
      description: "TVs, cameras, drones, and other electronics reviews and guides.",
      bannerIntro: "Consumer electronics extends far beyond phones and laptops — and many of the most consequential purchasing decisions involve categories that get less coverage despite their complexity. This section addresses the devices and systems that round out a complete tech ecosystem: drones evaluated for flight stability, camera sensor quality, obstacle avoidance reliability, and regulatory compliance; action cameras tested for stabilization effectiveness, waterproofing durability, and low-light performance; e-readers compared on display technology, battery endurance, and ecosystem lock-in; and portable power stations benchmarked for real-world capacity, charging speed, and solar panel compatibility. We also cover home entertainment systems — TV panel technologies (OLED, QLED, mini-LED) evaluated for motion handling, viewing angles, and HDR implementation — and the connectivity standards that tie everything together, from WiFi 7 router performance to USB-C hub reliability and Thunderbolt dock compatibility. Each guide applies the same testing rigor used in our core categories: measured performance data, extended real-world usage, and clear recommendations organized by use case and budget rather than by manufacturer marketing tiers.",
    },
  ] as { key: string; label: string; description: string; bannerIntro: string }[],
};
