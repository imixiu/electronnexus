"use client";

import { usePathname } from "next/navigation";

const CATEGORY_MAP: Record<string, string> = {
  smartphones: "smartphones",
  laptopspcs: "laptops",
  audio: "audio",
  smarthome: "smarthome",
  wearables: "wearables",
  gaming: "gaming",
};

function getShowroomUrl(pathname: string): string {
  // Extract first segment: /smartphones/xxx → smartphones
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    const category = CATEGORY_MAP[segments[0]];
    if (category) {
      return `https://www.alibaba.com/showroom/${category}.html?outsite=1`;
    }
  }
  // Default: consumer-electronics
  return "https://www.alibaba.com/showroom/consumer-electronics.html?outsite=1";
}

export function RecommendedProducts() {
  const pathname = usePathname();
  const url = getShowroomUrl(pathname);

  return (
    <section className="recommended-products">
      <div className="recommended-inner">
        <h2 className="recommended-title">Recommended Products</h2>
        <iframe
          src={url}
          className="recommended-iframe"
          title="Recommended Products"
        />
      </div>
    </section>
  );
}
