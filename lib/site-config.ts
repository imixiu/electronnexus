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
    { key: "smartphones", label: "Smartphones", description: "Latest smartphone reviews, comparisons, and buying guides for every budget." },
    { key: "laptopspcs", label: "Laptops & Computers", description: "In-depth laptop and desktop reviews for work, creativity, and everyday use." },
    { key: "audio", label: "Audio & Headphones", description: "Headphones, earbuds, speakers, and audio equipment reviews and recommendations." },
    { key: "smarthome", label: "Smart Home", description: "Smart home devices, IoT gadgets, and home automation guides." },
    { key: "wearables", label: "Wearables", description: "Smartwatch, fitness tracker, and wearable technology reviews and news." },
    { key: "gaming", label: "Gaming & Entertainment", description: "Gaming consoles, accessories, monitors, and entertainment tech coverage." },
  ] as { key: string; label: string; description: string }[],
};
