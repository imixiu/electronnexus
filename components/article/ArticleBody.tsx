import { marked } from "marked";

interface ArticleBodyProps {
  body: string;
}

function renderBody(body: string): string {
  // If body already contains HTML tags, use it directly; otherwise parse as markdown
  const isHtml = /<(h[1-6]|p|ul|ol|table|div|strong|em)\b/i.test(body);
  const html = isHtml ? body : (marked.parse(body) as string);
  return html.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (_match, attrs, content) => {
    const text = content.replace(/<[^>]+>/g, "").trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `<h2${attrs} id="${id}">${content}</h2>`;
  });
}

export function ArticleBody({ body }: ArticleBodyProps) {
  return (
    <div
      className="article-content"
      dangerouslySetInnerHTML={{ __html: renderBody(body) }}
    />
  );
}
