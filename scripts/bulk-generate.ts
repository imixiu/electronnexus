import { neon } from "@neondatabase/serverless";

const SITE = "electronnexus";
const TARGET = parseInt(process.env.TARGET_ARTICLES || "1000");

// ─── TOPICS & AUTHORS ───
const topics = ["smartphones", "laptopspcs", "audio", "smarthome", "wearables", "gaming"];
const authorsByTopic: Record<string, string[]> = {
  smartphones: ["Alex Chen", "Mike Russo"],
  "laptopspcs": ["David Kumar", "Mike Russo"],
  "audio": ["Sarah Mitchell", "Alex Chen"],
  "smarthome": ["Emma Wilson", "Mike Russo"],
  wearables: ["Lisa Tanaka", "Sarah Mitchell"],
  gaming: ["James Park", "David Kumar"],
};

// ─── TITLE TEMPLATES ───
const titleTemplates: Record<string, string[]> = {
  smartphones: [
    "Why the {brand} {model} Is the Best Phone for {use_case} in {year}",
    "{brand} {model} vs {brand2} {model2}: The Ultimate Comparison",
    "{number} Smartphone Features You Didn't Know Existed",
    "The Complete Guide to Choosing a Phone Under ${price}",
    "How {brand}'s New {feature} Technology Changes Everything",
    "{number} Reasons to Upgrade to the {brand} {model} Right Now",
    "Best Camera Phones of {year}: Ranked by Our Experts",
    "Budget vs Flagship: Is the {brand} {model} Worth the Premium?",
    "The {brand} {model} Battery Life Test: Real-World Results",
    "How to Get the Most Out of Your {brand} {model}'s Camera",
    "{number} Hidden Settings on Your {brand} Phone That Improve Performance",
    "Why {brand}'s {feature} Is a Game Changer for Mobile Photography",
    "The Best {brand} Accessories for Your {model}",
    "Smartphone Buying Guide {year}: {number} Things to Consider",
    "Is the {brand} {model} the Best Value Phone of {year}?",
  ],
  "laptopspcs": [
    "Why the {brand} {model} Is the Perfect Laptop for {use_case}",
    "{brand} {model} vs {brand2} {model2}: Which Should You Buy?",
    "{number} Laptops That Deliver the Best Battery Life in {year}",
    "The Best {use_case} Laptops Under ${price}",
    "How {brand}'s {feature} Chip Redefines Performance",
    "Building a {use_case} Desktop PC: The Complete {year} Guide",
    "{number} Laptop Accessories Every Remote Worker Needs",
    "The {brand} {model} Review: {adjective} Performance Meets {adjective2} Design",
    "MacBook vs Windows: The {year} Showdown for {use_case}",
    "Best Monitors for {use_case}: Our Top {number} Picks",
    "How to Choose the Right RAM and Storage for Your New Laptop",
    "The Rise of ARM Laptops: What {brand}'s {feature} Means for You",
    "{number} Common Laptop Mistakes and How to Avoid Them",
    "Gaming Laptop vs Desktop: Which Gives Better Value in {year}?",
    "The Ultimate {use_case} Workstation Setup Guide",
  ],
  "audio": [
    "Why the {brand} {model} Are the Best Headphones for {use_case}",
    "{brand} {model} vs {brand2} {model2}: Sound Quality Showdown",
    "{number} Wireless Earbuds That Rival Over-Ear Headphones",
    "The Best Noise-Canceling Headphones Under ${price}",
    "How {brand}'s {feature} Technology Transforms Your Listening Experience",
    "Open-Back vs Closed-Back Headphones: Which Is Right for {use_case}?",
    "{number} Speaker Setups That Will Upgrade Your Home Audio",
    "The {brand} {model} Review: {adjective} Sound in a {adjective2} Package",
    "Best DACs for Audiophiles: Our Top {number} Picks for {year}",
    "How to Choose the Right Earbuds for {use_case}",
    "The Science Behind Active Noise Cancellation: What {brand} Does Differently",
    "Wired vs Wireless: The {year} Audio Quality Comparison",
    "{number} Portable Speakers Perfect for Outdoor Adventures",
    "Studio Monitor Buying Guide: {number} Options for Every Budget",
    "Why {brand}'s {feature} Codec Is Changing High-Res Audio",
  ],
  "smarthome": [
    "Why the {brand} {model} Is the Best Smart {device} for Your Home",
    "{brand} {model} vs {brand2} {model2}: Smart Home Showdown",
    "{number} Smart Home Devices Every Beginner Should Own",
    "The Complete Smart Home Setup Guide for {year}",
    "How {brand}'s {feature} Protocol Changes Smart Home Connectivity",
    "{number} Smart Security Devices That Actually Protect Your Home",
    "Best Smart Thermostats: Save Energy Without Sacrificing Comfort",
    "The {brand} {model} Review: {adjective} Smart Home Control",
    "Matter vs Zigbee vs Z-Wave: Which Protocol Wins in {year}?",
    "How to Build a Smart Lighting System on a Budget",
    "{number} Smart Kitchen Gadgets That Simplify Daily Life",
    "Voice Assistant Showdown: Alexa vs Google vs Siri in {year}",
    "The Best Robot Vacuums for {use_case}: Ranked and Reviewed",
    "Smart Lock Buying Guide: {number} Options for Every Door",
    "Why {brand}'s {feature} Hub Is the Brain Your Smart Home Needs",
  ],
  wearables: [
    "Why the {brand} {model} Is the Best Smartwatch for {use_case}",
    "{brand} {model} vs {brand2} {model2}: Wearable Tech Comparison",
    "{number} Fitness Trackers That Deliver Accurate Health Data",
    "The Best Smartwatches Under ${price} for {year}",
    "How {brand}'s {feature} Sensor Technology Advances Health Monitoring",
    "{number} Smartwatch Features You Should Be Using but Probably Aren't",
    "Best Fitness Bands for Runners: Our Top {number} Picks",
    "The {brand} {model} Review: {adjective} Design Meets {adjective2} Function",
    "Smartwatch Battery Life Champions: {number} Models That Last",
    "How to Use Your Smartwatch to Improve Sleep Quality",
    "The Future of Wearable Health Tech: What {brand} Is Building",
    "GPS Watches for Hiking: {number} Rugged Options Tested",
    "Smart Rings vs Smartwatches: Which Wearable Is Right for You?",
    "{number} Wearable Accessories to Customize Your {brand} Watch",
    "Why {brand}'s {feature} Is the Most Accurate Heart Rate Monitor Yet",
  ],
  gaming: [
    "Why the {brand} {model} Is the Best {device} for Gamers in {year}",
    "{brand} {model} vs {brand2} {model2}: Gaming Hardware Showdown",
    "{number} Gaming Peripherals That Improve Your Performance",
    "The Best Gaming Monitors Under ${price}",
    "How {brand}'s {feature} Technology Delivers Next-Gen Gaming",
    "{number} Gaming Setup Essentials for Competitive Play",
    "Best Mechanical Keyboards for Gaming: Our Top {number} Picks",
    "The {brand} {model} Review: {adjective} Gaming Performance",
    "Console vs PC Gaming: The {year} Cost and Performance Analysis",
    "How to Build the Ultimate Gaming Desk Setup",
    "{number} Gaming Headsets That Deliver Immersive Sound",
    "The Best Graphics Cards for {resolution} Gaming in {year}",
    "Gaming Mouse Buying Guide: {number} Options for Every Grip Style",
    "Why {brand}'s {feature} Is Changing Cloud Gaming Forever",
    "VR Headset Comparison: {number} Models Tested for {year}",
  ],
};

// ─── FILL WORDS ───
const fillWords: Record<string, string[]> = {
  brand: ["Samsung", "Apple", "Google", "Sony", "OnePlus", "Xiaomi", "ASUS", "Lenovo", "Dell", "HP", "Bose", "Sennheiser", "JBL", "Logitech", "Razer", "Corsair", "Garmin", "Fitbit", "Amazon", "Philips", "Nvidia", "AMD", "Roku", "Ring"],
  brand2: ["Samsung", "Apple", "Google", "Sony", "OnePlus", "Xiaomi", "ASUS", "Lenovo", "Bose", "Sennheiser", "JBL", "Logitech", "Razer", "Garmin", "Fitbit"],
  model: ["Galaxy S25 Ultra", "iPhone 16 Pro", "Pixel 10 Pro", "WH-1000XM6", "Nord 5", "14 Pro", "ROG Phone 9", "ThinkPad X1", "XPS 15", "Spectre x360", "QuietComfort Ultra", "HD 660S2", "Charge 6", "G Pro X", "Viper V3", "K100 RGB", "Fenix 8", "Sense 2", "Echo Show 15", "Hue Bridge 3"],
  model2: ["Galaxy S25", "iPhone 16", "Pixel 10", "WF-1000XM6", "13T Pro", "15 Air", "ROG Strix", "Yoga 9i", "Inspiron 16", "EliteBook 840", "AirPods Pro 3", "IE 600", "Flip 7", "G915 X", "DeathAdder V4", "Sabre Pro", "Forerunner 975", "Charge 6", "Nest Hub 3", "Aqara M3"],
  use_case: ["photography", "gaming", "productivity", "travel", "fitness", "content creation", "remote work", "students", "professionals", "outdoor enthusiasts", "audiophiles", "home theater", "streaming", "competitive esports", "casual listeners"],
  feature: ["AI-powered", "neural processing", "spatial audio", "Matter-compatible", "LiDAR", "haptic feedback", "ray tracing", "adaptive ANC", "titanium build", "graphene battery", "quantum dot", "mesh networking", "health sensor", "holographic display", "solar charging"],
  device: ["speaker", "thermostat", "lock", "camera", "hub", "display", "vacuum", "doorbell", "light", "plug", "monitor", "keyboard", "mouse", "headset", "controller"],
  number: ["3", "5", "7", "8", "10", "12", "15", "20"],
  price: ["100", "200", "300", "500", "750", "1000", "1500"],
  year: ["2025", "2026"],
  adjective: ["exceptional", "impressive", "outstanding", "remarkable", "superb", "phenomenal", "stellar", "unmatched", "brilliant"],
  adjective2: ["sleek", "compact", "premium", "elegant", "portable", "lightweight", "versatile", "refined"],
  resolution: ["1080p", "1440p", "4K", "ultrawide"],
};

// ─── CONTENT BLOCKS ───
function makeIntro(topic: string): string {
  const intros: Record<string, string[]> = {
    smartphones: [
      "The smartphone market moves at breakneck speed, and choosing the right device can feel overwhelming. With dozens of new models launching each year, each promising revolutionary features, it's essential to cut through the marketing noise and focus on what truly matters for your daily usage.",
      "Whether you're upgrading from an aging device or switching ecosystems entirely, today's smartphones offer capabilities that would have seemed science fiction just five years ago. From computational photography to on-device AI, the technology packed into these pocket-sized powerhouses continues to astound.",
      "Finding the perfect smartphone isn't just about specs and benchmarks — it's about how a device fits into your life. Camera quality, battery endurance, software support, and ecosystem integration all play crucial roles in determining which phone is right for you.",
    ],
    "laptopspcs": [
      "In an era where remote work and digital creativity are the norm, choosing the right laptop or computer has never been more important. The lines between work machines, creative workstations, and entertainment devices continue to blur.",
      "The computing landscape has shifted dramatically in recent years. ARM-based processors now compete head-to-head with traditional x86 chips, displays have reached levels of color accuracy that satisfy professional creators, and battery life has finally caught up with our demands.",
      "Whether you're a developer, designer, student, or business professional, the right computer can transform your productivity. But with so many form factors, processors, and configurations available, making the right choice requires careful consideration.",
    ],
    "audio": [
      "Audio quality can transform your daily experience — from morning commutes to late-night listening sessions. The personal audio market has exploded with options, from tiny true wireless earbuds to audiophile-grade over-ear headphones.",
      "The way we consume audio has fundamentally changed. Streaming services now offer lossless and spatial audio, wireless codecs continue to improve, and noise cancellation technology has reached levels that were once exclusive to professional environments.",
      "Great audio gear doesn't just reproduce sound — it reveals details you've never heard before, creates immersive soundstages, and adapts to your environment. Whether you're a casual listener or a dedicated audiophile, there's never been a better time to invest in quality audio equipment.",
    ],
    "smarthome": [
      "Smart home technology has matured from a novelty for tech enthusiasts to a practical solution for everyday homeowners. With interoperability standards like Matter finally gaining traction, building a connected home has never been more accessible.",
      "The promise of a smart home — lights that adjust to your mood, thermostats that learn your schedule, security systems you can monitor from anywhere — is no longer a futuristic dream. Today's smart home devices are reliable, affordable, and increasingly easy to set up.",
      "Building a smart home doesn't mean replacing everything at once. The most successful smart home setups grow organically, starting with a few key devices and expanding as you discover what works best for your lifestyle and living situation.",
    ],
    wearables: [
      "Wearable technology has evolved from simple step counters to sophisticated health monitoring platforms. Today's smartwatches and fitness trackers can measure blood oxygen, detect irregular heart rhythms, and even predict potential health issues before they become serious.",
      "The line between fashion accessory and health device has blurred in the wearable space. Modern smartwatches look as good in a boardroom as they do on a running trail, while offering health insights that rival dedicated medical devices.",
      "Whether you're training for a marathon, trying to improve your sleep, or simply want to stay connected without reaching for your phone, today's wearables offer solutions tailored to virtually every lifestyle and fitness goal.",
    ],
    gaming: [
      "Gaming hardware has entered a golden age of performance and accessibility. From powerful consoles that deliver 4K gaming to affordable peripherals that rival professional esports equipment, there's never been a better time to be a gamer.",
      "The gaming ecosystem spans consoles, PCs, cloud services, and mobile devices, each offering unique advantages. Understanding the trade-offs between platforms and choosing the right hardware can significantly enhance your gaming experience.",
      "Whether you're a competitive esports player chasing every frame, a casual gamer looking for immersive single-player experiences, or a content creator streaming to thousands, the right gaming setup makes all the difference.",
    ],
  };
  const pool = intros[topic] || intros.smartphones;
  return pool[Math.floor(Math.random() * pool.length)];
}

function makeSections(topic: string): string[] {
  const sectionPools: Record<string, {h: string; p: string}[]> = {
    smartphones: [
      {h: "Display Technology Deep Dive", p: "Modern smartphone displays have reached extraordinary levels of quality. LTPO OLED panels now offer adaptive refresh rates from 1Hz to 120Hz, delivering both buttery-smooth scrolling and exceptional battery efficiency. Peak brightness levels exceeding 2,000 nits ensure outdoor visibility even in direct sunlight, while always-on display features consume minimal power thanks to these advanced panel technologies."},
      {h: "Camera System Analysis", p: "The camera remains the single most important feature for most smartphone buyers. Today's multi-lens setups combine main sensors with ultrawide, telephoto, and macro capabilities. Computational photography algorithms handle HDR, night mode, and portrait effects with increasing sophistication. The gap between dedicated cameras and smartphones continues to narrow, especially for everyday shooting scenarios."},
      {h: "Performance and Efficiency", p: "Modern mobile processors balance raw performance with thermal efficiency in remarkable ways. The latest chipsets feature dedicated AI accelerators, improved GPU cores for gaming, and power-efficient cores for background tasks. Real-world performance differences between flagship chips have narrowed, making software optimization and thermal management the key differentiators."},
      {h: "Battery Life and Charging", p: "Battery technology and charging speeds have improved significantly. Fast charging now routinely delivers 50% capacity in under 20 minutes, while wireless charging has become more efficient and widely adopted. Battery health management features help extend the overall lifespan of your device, and some manufacturers now promise four or more years of software updates."},
      {h: "Software and Ecosystem", p: "The software experience often matters more than hardware specifications. Clean, well-maintained operating systems with regular security updates provide better long-term value than raw specs alone. Ecosystem integration — how well your phone works with your other devices, smart home products, and services — is increasingly a deciding factor for many buyers."},
      {h: "Build Quality and Durability", p: "Premium smartphones now feature aerospace-grade materials including titanium frames, ceramic backs, and the latest generation of scratch-resistant glass. IP68 water and dust resistance is standard on flagship devices, and many mid-range phones now offer respectable durability as well. Drop resistance has improved dramatically with newer glass formulations."},
    ],
    "laptopspcs": [
      {h: "Processor Performance Benchmarks", p: "The CPU landscape has diversified significantly. Apple's M-series chips continue to push the boundaries of performance-per-watt, while Intel and AMD battle for supremacy in the x86 space. For most users, any current-generation processor will handle daily tasks effortlessly — the real differences emerge in sustained workloads like video rendering, code compilation, and scientific computing."},
      {h: "Display Quality for Professionals", p: "Laptop displays have improved dramatically in recent years. Mini-LED and OLED panels offer exceptional contrast ratios, wide color gamuts covering 100% DCI-P3, and factory calibration accurate enough for professional color grading. High refresh rates (120Hz+) are no longer exclusive to gaming laptops, appearing in ultrabooks and creative workstations alike."},
      {h: "Keyboard and Trackpad Experience", p: "The input devices you interact with every day deserve careful consideration. Modern laptop keyboards offer improved key travel, better tactile feedback, and more reliable mechanisms than previous generations. Trackpads have grown larger and more responsive, with haptic feedback replacing mechanical clicks on premium models."},
      {h: "Thermal Management and Noise", p: "How a laptop handles heat directly impacts both performance and user comfort. Advanced cooling solutions — vapor chambers, liquid metal thermal compounds, and intelligent fan curves — allow thin laptops to sustain high performance without becoming uncomfortably hot or loud. The best designs are virtually silent during light tasks."},
      {h: "Port Selection and Connectivity", p: "Despite the trend toward thinner designs, port selection remains crucial for productivity. Thunderbolt 4, USB-C with Power Delivery, HDMI 2.1, and SD card readers each serve important roles. The best laptops balance modern connectivity standards with practical legacy ports, reducing the need for dongles and adapters."},
      {h: "Storage Speed and Capacity", p: "NVMe SSDs have become the universal standard, but not all solid-state drives are created equal. PCIe Gen 4 drives offer sequential read speeds exceeding 7,000 MB/s, dramatically improving boot times, application loading, and file transfer operations. For creative professionals working with large files, storage speed can be as important as CPU performance."},
    ],
    "audio": [
      {h: "Sound Signature and Frequency Response", p: "Every headphone and speaker has a unique sound signature — the way it emphasizes or de-emphasizes different frequency ranges. Neutral signatures aim for accuracy, while V-shaped signatures boost bass and treble for a more exciting listen. Understanding your preference helps narrow the vast field of options to those that will truly satisfy your ears."},
      {h: "Active Noise Cancellation Technology", p: "Modern ANC systems use multiple microphones and sophisticated algorithms to counteract ambient noise in real-time. The best implementations adapt to your environment automatically, offering stronger cancellation on planes and commutes while remaining transparent when you need awareness. Some models now offer adjustable ANC levels and transparency modes."},
      {h: "Wireless Codec Comparison", p: "Bluetooth audio quality depends heavily on the codec used. SBC provides baseline quality, AAC excels on Apple devices, aptX Adaptive and LDAC offer near-lossless quality on compatible Android devices, and LC3 promises improvements with Bluetooth LE Audio. Understanding codec compatibility ensures you get the best possible wireless audio quality from your devices."},
      {h: "Driver Technology Explained", p: "The driver — the component that converts electrical signals into sound — is the heart of any headphone or speaker. Dynamic drivers excel at bass reproduction, balanced armature drivers offer precision in the mids and highs, and planar magnetic drivers deliver exceptional detail across the spectrum. Hybrid designs combine multiple driver types for comprehensive coverage."},
      {h: "Comfort and Ergonomics", p: "The most technically impressive headphones are worthless if they're uncomfortable. Clamping force, ear pad material, headband pressure distribution, and overall weight all affect long-term comfort. Memory foam pads with breathable fabrics suit extended listening sessions, while lighter designs reduce fatigue during commutes and travel."},
      {h: "Amplification and DAC Considerations", p: "High-impedance headphones often benefit from dedicated amplification to reach their full potential. Portable DAC/amp combinations can dramatically improve sound quality from phones and laptops, offering cleaner power delivery and better digital-to-analog conversion. Understanding impedance and sensitivity ratings helps you determine whether additional amplification is necessary."},
    ],
    "smarthome": [
      {h: "Protocol Compatibility and Interoperability", p: "The smart home landscape features multiple communication protocols — Wi-Fi, Bluetooth, Zigbee, Z-Wave, Thread, and the new Matter standard. Each has trade-offs in range, power consumption, bandwidth, and reliability. The best smart home setups use a combination of protocols, with a central hub bridging between them for seamless operation."},
      {h: "Smart Lighting Systems", p: "Smart lighting is often the entry point for home automation. Modern smart bulbs offer millions of colors, tunable white temperatures, and smooth dimming. Light strips add ambient accent lighting, while smart switches provide whole-room control. Scheduling, motion triggers, and scene automation transform static lighting into a dynamic, responsive system."},
      {h: "Home Security Integration", p: "Smart security encompasses cameras, doorbells, locks, sensors, and alarm systems that work together to protect your home. Modern systems offer AI-powered person detection, package alerts, facial recognition, and remote monitoring. Local processing options address privacy concerns while maintaining rapid response times and reducing cloud dependency."},
      {h: "Energy Management and Savings", p: "Smart thermostats, plugs, and energy monitors help reduce utility bills while maintaining comfort. Learning thermostats adapt to your schedule, smart plugs eliminate phantom power draw, and whole-home energy monitors provide detailed consumption insights. Many devices pay for themselves within a year through energy savings alone."},
      {h: "Voice Assistant Integration", p: "Voice control remains one of the most intuitive ways to interact with smart home devices. Amazon Alexa, Google Assistant, and Apple Siri each offer unique strengths in natural language understanding, third-party integrations, and multi-room audio. Choosing your primary voice ecosystem early helps ensure compatibility as your smart home grows."},
      {h: "Automation and Routines", p: "The true power of smart home technology emerges through automation. Geofencing triggers actions based on your location, time-based schedules handle daily routines, sensor-driven automations respond to environmental changes, and conditional logic chains create sophisticated multi-device sequences that adapt to your lifestyle."},
    ],
    wearables: [
      {h: "Health Monitoring Capabilities", p: "Modern wearables track an impressive array of health metrics: heart rate, blood oxygen saturation, heart rate variability, skin temperature, stress levels, and sleep stages. Some devices now offer ECG readings, blood pressure estimation, and continuous glucose monitoring. The accuracy of these sensors has improved dramatically, with many achieving medical-grade certification."},
      {h: "GPS Accuracy and Fitness Tracking", p: "For outdoor athletes, GPS accuracy is paramount. Dual-band GPS receivers offer improved precision in challenging environments like dense cities and forest trails. Advanced running dynamics — cadence, ground contact time, vertical oscillation — help serious runners optimize their form and reduce injury risk."},
      {h: "Battery Life Optimization", p: "Battery life remains a key differentiator in the wearable market. Always-on displays, continuous health monitoring, and GPS tracking all consume significant power. The best devices balance feature richness with multi-day battery life, while some outdoor-focused models offer solar charging for virtually unlimited runtime in good conditions."},
      {h: "Smartphone Integration and Notifications", p: "A smartwatch's value extends beyond fitness tracking. Smart notifications, quick replies, contactless payments, music control, and app integrations transform your wrist into a convenient command center. The depth and quality of smartphone integration varies significantly between platforms and manufacturers."},
      {h: "Design and Customization", p: "Today's wearables are fashion statements as much as tech devices. Interchangeable bands, customizable watch faces, and premium materials like titanium, sapphire crystal, and ceramic allow personal expression. Size options accommodate different wrist sizes, and slim profiles ensure comfort during all-day wear."},
      {h: "Water Resistance and Durability", p: "Water resistance ratings vary from splash-proof to dive-ready. For swimmers and water sports enthusiasts, proper water resistance (5ATM or higher) combined with swim-tracking features is essential. Durability also extends to scratch-resistant displays, reinforced cases, and MIL-STD-810 military standard certifications for extreme conditions."},
    ],
    gaming: [
      {h: "Graphics Performance and Frame Rates", p: "Modern gaming hardware delivers extraordinary visual fidelity. Ray tracing simulates realistic lighting, DLSS and FSR use AI to boost frame rates while maintaining image quality, and high refresh rate displays (144Hz, 240Hz, even 360Hz) provide the smoothness competitive gamers demand. The balance between resolution, settings, and frame rate defines the gaming experience."},
      {h: "Peripheral Precision and Response", p: "Gaming peripherals — mice, keyboards, controllers, and headsets — directly impact performance. Low-latency wireless technology now matches wired responsiveness, mechanical switches offer customizable actuation points, and high-DPI sensors track movements with sub-micron precision. The right peripherals translate your intentions into in-game actions without delay."},
      {h: "Display Technology for Gaming", p: "Gaming monitors have evolved rapidly. OLED panels deliver near-instant response times and perfect blacks, Mini-LED provides excellent HDR brightness, and IPS panels offer wide viewing angles with good color accuracy. Variable refresh rate technologies (G-Sync, FreeSync) eliminate screen tearing, while HDR standards like DisplayHDR 1000 bring cinematic quality to gaming."},
      {h: "Console Ecosystem Comparison", p: "Each gaming console offers a unique ecosystem of exclusive titles, online services, and backward compatibility. PlayStation's first-party studios, Xbox's Game Pass library, and Nintendo's innovative hardware each appeal to different gaming preferences. Cloud gaming services add another dimension, allowing high-end gaming on modest hardware."},
      {h: "Streaming and Content Creation", p: "Gaming content creation requires hardware that handles both gaming and encoding simultaneously. Capture cards, streaming microphones, webcams, and lighting setups transform a gaming station into a broadcast studio. Modern GPUs include dedicated encoding hardware that minimizes the performance impact of simultaneous streaming."},
      {h: "Ergonomics and Gaming Furniture", p: "Extended gaming sessions demand proper ergonomics. Gaming chairs with lumbar support, adjustable desks for sit-stand flexibility, monitor arms for optimal positioning, and cable management solutions all contribute to comfort and focus. Investing in ergonomic furniture prevents strain and enhances long-term gaming enjoyment."},
    ],
  };
  const pool = sectionPools[topic] || sectionPools.smartphones;
  // Shuffle and pick 4 sections
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4).map(s => `<h2>${s.h}</h2>\n<p>${s.p}</p>`);
}

function makeList(topic: string): string {
  const lists: Record<string, string[]> = {
    smartphones: [
      "<h2>Key Takeaways</h2><ul><li>Always test the phone's camera in various lighting conditions before purchasing</li><li>Consider the total cost of ownership, including accessories and insurance</li><li>Check software update commitments — longer support means better long-term value</li><li>Evaluate ecosystem lock-in before switching between Android and iOS</li><li>Read professional reviews that include real-world battery tests, not just spec sheets</li></ul>",
      "<h2>Common Mistakes to Avoid</h2><ul><li>Prioritizing megapixel count over sensor size and image processing quality</li><li>Ignoring the importance of software optimization for overall performance</li><li>Overlooking carrier compatibility and 5G band support</li><li>Choosing based on brand loyalty rather than current product merit</li><li>Forgetting to check trade-in values and promotional deals before purchasing</li></ul>",
    ],
    "laptopspcs": [
      "<h2>Key Takeaways</h2><ul><li>Match the processor tier to your actual workload — over-specifying wastes money</li><li>Invest in a quality display since you'll look at it every day</li><li>16GB RAM is the new minimum for comfortable multitasking</li><li>Prioritize SSD speed over capacity — external storage is cheap, slow boot drives are not</li><li>Check the warranty terms and repair options before committing</li></ul>",
      "<h2>Common Mistakes to Avoid</h2><ul><li>Choosing a laptop based solely on processor model without considering thermal design</li><li>Ignoring port selection and relying on dongles for daily connectivity</li><li>Buying more storage than needed instead of investing in cloud solutions</li><li>Overlooking keyboard and trackpad quality during brief in-store testing</li><li>Neglecting to check compatibility with your existing peripherals and accessories</li></ul>",
    ],
    "audio": [
      "<h2>Key Takeaways</h2><ul><li>Sound preference is subjective — try before you buy when possible</li><li>ANC performance varies significantly between price tiers and brands</li><li>Wireless convenience often involves a trade-off with absolute sound quality</li><li>Proper fit and seal dramatically affect bass response and noise isolation</li><li>Consider your primary listening environment when choosing between open and closed designs</li></ul>",
      "<h2>Common Mistakes to Avoid</h2><ul><li>Judging headphones by frequency response numbers alone without listening</li><li>Ignoring the importance of a good source and amplification chain</li><li>Overlooking comfort during extended listening sessions</li><li>Assuming more expensive always means better for your specific use case</li><li>Neglecting to check codec compatibility with your primary devices</li></ul>",
    ],
    "smarthome": [
      "<h2>Key Takeaways</h2><ul><li>Start with a clear plan for your smart home ecosystem before buying devices</li><li>Choose a primary platform (Alexa, Google, HomeKit) and verify compatibility</li><li>Invest in a reliable mesh Wi-Fi system as the foundation of your smart home</li><li>Local processing options improve reliability and protect your privacy</li><li>Automate gradually — complex routines are harder to troubleshoot</li></ul>",
      "<h2>Common Mistakes to Avoid</h2><ul><li>Buying devices from too many different ecosystems that don't communicate well</li><li>Ignoring network security when connecting dozens of IoT devices</li><li>Overcomplicating automations that family members can't easily override</li><li>Choosing Wi-Fi devices when low-power protocols like Zigbee would be more reliable</li><li>Forgetting to consider what happens when the internet goes down</li></ul>",
    ],
    wearables: [
      "<h2>Key Takeaways</h2><ul><li>Prioritize the health metrics most relevant to your fitness goals</li><li>Battery life should match your charging habits — daily charging isn't for everyone</li><li>Smartphone compatibility determines which features you can actually use</li><li>Comfort during 24/7 wear is essential for continuous health monitoring</li><li>Consider the total ecosystem cost including subscription services for advanced features</li></ul>",
      "<h2>Common Mistakes to Avoid</h2><ul><li>Choosing a smartwatch based on fitness features you'll never actually use</li><li>Ignoring the importance of display visibility in outdoor conditions</li><li>Overlooking water resistance requirements for swimming and water sports</li><li>Assuming all heart rate monitors are equally accurate during high-intensity exercise</li><li>Neglecting to check third-party app support for your preferred fitness platforms</li></ul>",
    ],
    gaming: [
      "<h2>Key Takeaways</h2><ul><li>Match your hardware investment to the games you actually play</li><li>Monitor quality impacts the gaming experience as much as GPU power</li><li>Peripheral quality matters more than most gamers initially realize</li><li>Consider the total platform cost including games, subscriptions, and accessories</li><li>Ergonomics and comfort directly affect gaming performance during long sessions</li></ul>",
      "<h2>Common Mistakes to Avoid</h2><ul><li>Overspending on GPU power for a monitor that can't display the extra frames</li><li>Ignoring input lag when choosing a gaming display</li><li>Buying peripherals based on RGB aesthetics rather than build quality and switches</li><li>Overlooking the importance of a stable internet connection for online gaming</li><li>Neglecting audio quality — a good headset provides competitive advantages</li></ul>",
    ],
  };
  const pool = lists[topic] || lists.smartphones;
  return pool[Math.floor(Math.random() * pool.length)];
}

function makeQuote(topic: string): string {
  const quotes: Record<string, {q: string; a: string}[]> = {
    smartphones: [
      {q: "The best smartphone is the one that disappears into your life — it just works when you need it.", a: "Alex Chen, Senior Reviewer"},
      {q: "Camera quality has become the primary differentiator in the flagship smartphone market.", a: "Mike Russo, Tech Analyst"},
    ],
    "laptopspcs": [
      {q: "A great laptop should enhance your creativity, not constrain it.", a: "David Kumar, Computing Expert"},
      {q: "The best productivity machine is one that stays out of your way.", a: "Mike Russo, Tech Analyst"},
    ],
    "audio": [
      {q: "Great audio reveals layers of music you never knew existed.", a: "Sarah Mitchell, Audio Specialist"},
      {q: "The right headphones don't just play music — they transport you inside it.", a: "Alex Chen, Senior Reviewer"},
    ],
    "smarthome": [
      {q: "The best smart home is one where the technology fades into the background.", a: "Emma Wilson, Smart Home Expert"},
      {q: "Start simple, grow gradually, and always prioritize reliability over novelty.", a: "Mike Russo, Tech Analyst"},
    ],
    wearables: [
      {q: "The best wearable is one you forget you're wearing until you need it.", a: "Lisa Tanaka, Wearables Expert"},
      {q: "Health data is only useful if it leads to actionable insights.", a: "Sarah Mitchell, Audio & Health Tech"},
    ],
    gaming: [
      {q: "Great gaming hardware doesn't just improve performance — it removes barriers between you and the game.", a: "James Park, Gaming Reviewer"},
      {q: "The best gaming setup is one where you never think about the hardware.", a: "David Kumar, Computing Expert"},
    ],
  };
  const pool = quotes[topic] || quotes.smartphones;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return `<blockquote><p>"${pick.q}"</p><cite>— ${pick.a}</cite></blockquote>`;
}

function makeTable(topic: string): string {
  const tables: Record<string, string> = {
    smartphones: "<h2>Quick Comparison Table</h2><table><thead><tr><th>Feature</th><th>Budget ($200-400)</th><th>Mid-Range ($400-700)</th><th>Flagship ($700+)</th></tr></thead><tbody><tr><td>Display</td><td>LCD/OLED, 90Hz</td><td>OLED, 120Hz</td><td>LTPO OLED, 120Hz+</td></tr><tr><td>Camera</td><td>Dual lens, basic OIS</td><td>Triple lens, good OIS</td><td>Multi-lens, advanced OIS</td></tr><tr><td>Processor</td><td>Mid-tier Snapdragon/Dimensity</td><td>Upper mid-range</td><td>Flagship chipset</td></tr><tr><td>Battery</td><td>5000mAh, 25W</td><td>5000mAh, 45W</td><td>5000mAh, 65W+</td></tr><tr><td>Software Support</td><td>2 years</td><td>3-4 years</td><td>5-7 years</td></tr></tbody></table>",
    "laptopspcs": "<h2>Quick Comparison Table</h2><table><thead><tr><th>Feature</th><th>Budget ($300-600)</th><th>Mid-Range ($600-1200)</th><th>Premium ($1200+)</th></tr></thead><tbody><tr><td>Processor</td><td>Intel i3/AMD Ryzen 3</td><td>i5/Ryzen 5/M2</td><td>i7-i9/Ryzen 7-9/M3 Pro</td></tr><tr><td>RAM</td><td>8GB DDR4</td><td>16GB DDR5</td><td>32GB+ DDR5/LPDDR5</td></tr><tr><td>Storage</td><td>256GB NVMe</td><td>512GB NVMe</td><td>1TB+ Gen4 NVMe</td></tr><tr><td>Display</td><td>FHD IPS</td><td>QHD IPS/OLED</td><td>QHD+ OLED/Mini-LED</td></tr><tr><td>Build</td><td>Plastic</td><td>Aluminum</td><td>CNC Aluminum/Titanium</td></tr></tbody></table>",
    "audio": "<h2>Quick Comparison Table</h2><table><thead><tr><th>Feature</th><th>Budget (Under $100)</th><th>Mid-Range ($100-300)</th><th>Premium ($300+)</th></tr></thead><tbody><tr><td>Driver Type</td><td>Dynamic</td><td>Dynamic/BA Hybrid</td><td>Planar Magnetic/Dynamic</td></tr><tr><td>ANC</td><td>Basic</td><td>Adaptive</td><td>Multi-mode, AI-enhanced</td></tr><tr><td>Codec Support</td><td>SBC, AAC</td><td>aptX, LDAC</td><td>All codecs + LC3</td></tr><tr><td>Battery</td><td>6-8 hours</td><td>8-12 hours</td><td>20-30+ hours</td></tr><tr><td>Build Quality</td><td>Plastic</td><td>Mixed materials</td><td>Premium metals/leather</td></tr></tbody></table>",
    "smarthome": "<h2>Quick Comparison Table</h2><table><thead><tr><th>Category</th><th>Entry Level</th><th>Mid-Range</th><th>Premium</th></tr></thead><tbody><tr><td>Smart Speaker</td><td>Echo Dot/Nest Mini</td><td>Echo/HomePod Mini</td><td>HomePod/Sonos Era</td></tr><tr><td>Smart Thermostat</td><td>Basic Wi-Fi ($50-80)</td><td>Learning ($100-180)</td><td>Multi-zone ($200+)</td></tr><tr><td>Security Camera</td><td>1080p indoor ($30-50)</td><td>2K with AI ($80-150)</td><td>4K Pro ($200+)</td></tr><tr><td>Smart Lock</td><td>Keypad ($100-150)</td><td>Wi-Fi + biometric ($180-250)</td><td>Full integration ($300+)</td></tr><tr><td>Hub</td><td>Basic bridge ($30-50)</td><td>Multi-protocol ($80-130)</td><td>Pro hub with local ($150+)</td></tr></tbody></table>",
    wearables: "<h2>Quick Comparison Table</h2><table><thead><tr><th>Feature</th><th>Fitness Band ($30-80)</th><th>Smartwatch ($150-350)</th><th>Premium ($350+)</th></tr></thead><tbody><tr><td>Display</td><td>Monochrome OLED</td><td>Color AMOLED</td><td>LTPO AMOLED/Sapphire</td></tr><tr><td>GPS</td><td>Connected GPS</td><td>Built-in GPS</td><td>Dual-band GPS</td></tr><tr><td>Health Sensors</td><td>HR, SpO2</td><td>HR, SpO2, ECG, Temp</td><td>All + blood pressure</td></tr><tr><td>Battery</td><td>7-14 days</td><td>2-5 days</td><td>3-7 days / solar</td></tr><tr><td>Smart Features</td><td>Notifications only</td><td>Apps, payments, LTE</td><td>Full smartphone features</td></tr></tbody></table>",
    gaming: "<h2>Quick Comparison Table</h2><table><thead><tr><th>Feature</th><th>Budget Setup</th><th>Mid-Range</th><th>High-End</th></tr></thead><tbody><tr><td>GPU/Console</td><td>RTX 4060 / PS5</td><td>RTX 4070 / PS5 Pro</td><td>RTX 4090 / Custom PC</td></tr><tr><td>Monitor</td><td>1080p 144Hz IPS</td><td>1440p 165Hz IPS</td><td>4K OLED 240Hz</td></tr><tr><td>Keyboard</td><td>Membrane ($20-40)</td><td>Mechanical ($60-120)</td><td>Custom/Hot-swap ($150+)</td></tr><tr><td>Mouse</td><td>Basic optical ($15-30)</td><td>Gaming sensor ($40-80)</td><td>Pro wireless ($80-150)</td></tr><tr><td>Headset</td><td>Stereo ($30-50)</td><td>7.1 Surround ($60-120)</td><td>Wireless ANC ($150+)</td></tr></tbody></table>",
  };
  return tables[topic] || tables.smartphones;
}

function makeEnding(topic: string): string {
  const endings: Record<string, string[]> = {
    smartphones: [
      "The smartphone you choose will be your most-used device for the next two to three years. Take your time, consider your priorities, and remember that the best phone isn't always the most expensive one — it's the one that best fits your lifestyle and needs.",
      "As technology continues to evolve, staying informed helps you make better purchasing decisions. Bookmark our smartphone section for the latest reviews, comparisons, and buying guides updated throughout the year.",
    ],
    "laptopspcs": [
      "Investing in the right computer is one of the most impactful technology decisions you can make. Consider your workflow, prioritize the features that matter most to you, and remember that the best machine is one that enhances your productivity without getting in the way.",
      "The computing landscape will continue to evolve with new processors, form factors, and capabilities. Stay up to date with our latest reviews and guides to ensure your next purchase delivers lasting value.",
    ],
    "audio": [
      "Great audio is a deeply personal experience. What sounds perfect to one listener may not resonate with another. Trust your ears, try before you buy when possible, and remember that the best audio gear is the kind that lets you forget about the technology and simply enjoy the music.",
      "The audio industry continues to innovate at a remarkable pace. From new driver technologies to advances in wireless codecs, there's always something new on the horizon. Keep checking our audio section for the latest reviews and recommendations.",
    ],
    "smarthome": [
      "Building a smart home is a journey, not a destination. Start with the basics, expand thoughtfully, and prioritize reliability and compatibility over flashy features. The best smart home is one that works seamlessly in the background, making your daily life easier without demanding constant attention.",
      "As the Matter standard matures and more manufacturers embrace interoperability, the smart home will only become more accessible and powerful. Follow our smart home guides for ongoing advice on building and expanding your connected home.",
    ],
    wearables: [
      "The right wearable can genuinely improve your health and fitness outcomes. Choose based on the features you'll actually use daily, prioritize comfort for all-day wear, and remember that data is only valuable when it leads to positive action.",
      "Wearable technology is advancing rapidly, with new health sensors and capabilities arriving regularly. Stay informed with our latest reviews and comparisons to find the perfect wearable companion for your health and fitness journey.",
    ],
    gaming: [
      "The best gaming setup is one that lets you focus entirely on the experience. Whether you're a competitive player or casual gamer, investing in quality hardware that matches your needs will enhance every gaming session for years to come.",
      "Gaming hardware continues to push the boundaries of performance and immersion. From ray-traced visuals to haptic feedback controllers, the future of gaming has never looked brighter. Stay current with our gaming section for the latest hardware reviews and recommendations.",
    ],
  };
  const pool = endings[topic] || endings.smartphones;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── ASSEMBLY ───
function fillTitle(template: string): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const words = fillWords[key];
    return words ? words[Math.floor(Math.random() * words.length)] : key;
  });
}

function slugify(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

function generateArticle(topic: string): { title: string; slug: string; description: string; body: string } {
  const templates = titleTemplates[topic];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const title = fillTitle(template);
  const slug = slugify(title);

  const intro = makeIntro(topic);
  const sections = makeSections(topic);
  const list = makeList(topic);
  const quote = makeQuote(topic);
  const table = makeTable(topic);
  const ending = makeEnding(topic);

  const body = [
    `<p>${intro}</p>`,
    ...sections.slice(0, 2),
    quote,
    ...sections.slice(2),
    table,
    list,
    `<p>${ending}</p>`,
  ].join("\n\n");

  const description = intro.substring(0, 155).replace(/<[^>]+>/g, "") + "...";

  return { title, slug, description, body };
}

// ─── MAIN ───
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }
  const sql = neon(url);

  const perTopic = Math.ceil(TARGET / topics.length);
  let total = 0;
  const startTime = Date.now();

  for (const topic of topics) {
    const authors = authorsByTopic[topic];
    for (let i = 0; i < perTopic; i++) {
      const article = generateArticle(topic);
      const author = authors[Math.floor(Math.random() * authors.length)];
      const daysAgo = Math.floor(Math.random() * 365);
      const pubDate = new Date(Date.now() - daysAgo * 86400000).toISOString();

      try {
        await sql(
          `INSERT INTO articles (site, type, title, short_title, description, body, author, published_time, is_online, language)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Y', 'en')
           ON CONFLICT DO NOTHING`,
          [SITE, topic, article.title, article.slug, article.description, article.body, author, pubDate]
        );
        total++;
        if (total % 50 === 0) console.log(`Progress: ${total} articles...`);
      } catch (e: any) {
        // skip duplicates silently
      }
    }
    console.log(`Topic "${topic}" done (${perTopic} articles)`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone! ${total} articles generated in ${elapsed}s`);
}

main().catch(console.error);
