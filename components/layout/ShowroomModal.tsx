"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const CATEGORY_MAP: Record<string, string> = {
  smartphones: "smartphones",
  laptopspcs: "laptops",
  audio: "audio",
  smarthome: "smarthome",
  wearables: "wearables",
  gaming: "gaming",
  more: "consumer-electronics",
};

function getShowroomUrl(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    const cat = CATEGORY_MAP[segments[0]];
    if (cat) return `https://www.alibaba.com/showroom/${cat}.html?outsite=1`;
  }
  return "https://www.alibaba.com/showroom/consumer-electronics.html?outsite=1";
}

export function ShowroomModal() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();
  const url = getShowroomUrl(pathname);

  useEffect(() => {
    if (sessionStorage.getItem("_en_modal_shown")) return;
    const timer = setTimeout(() => {
      setShow(true);
      sessionStorage.setItem("_en_modal_shown", "1");
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="sr-modal-overlay" onClick={() => setShow(false)}>
      <div className="sr-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="sr-modal-close"
          onClick={() => setShow(false)}
          aria-label="Close"
        >
          ✕
        </button>
        <div className="sr-modal-icon">🔌</div>
        <h2 className="sr-modal-title">Discover Top Electronics Deals</h2>
        <p className="sr-modal-desc">
          Browse wholesale prices and verified suppliers on Alibaba — the
          world's largest B2B marketplace for consumer electronics.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="sr-modal-cta"
        >
          Browse Products →
        </a>
        <button
          className="sr-modal-skip"
          onClick={() => setShow(false)}
        >
          No thanks, continue reading
        </button>
      </div>
    </div>
  );
}
