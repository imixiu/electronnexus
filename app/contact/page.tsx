import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

const domain = siteConfig.url.replace(/^https?:\/\//, "");

export const metadata: Metadata = {
  title: `Contact Us — ${siteConfig.name || siteConfig.title}`,
  description: `Get in touch with the ${siteConfig.name || siteConfig.title} team.`,
};

export default function ContactPage() {
  return (
    <div className="static-page">
      <div className="static-page-inner">
        <h1>Contact Us</h1>
        <p>We&apos;d love to hear from you.</p>
        <section>
          <h2>General Inquiries</h2>
          <p>Email us at <a href={`mailto:hello@${domain}`}>hello@{domain}</a></p>
        </section>
        <section>
          <h2>Response Time</h2>
          <p>We typically respond within 2-3 business days.</p>
        </section>
      </div>
    </div>
  );
}
