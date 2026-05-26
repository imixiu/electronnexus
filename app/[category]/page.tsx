import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticlesByCategory } from "@/lib/queries";
import { siteConfig } from "@/lib/site-config";
import { ArticleCard } from "@/components/article/ArticleCard";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const cat = siteConfig.categories.find((c) => c.key === category);
  if (!cat) return { title: "Category Not Found" };
  return {
    title: `${cat.label} - ${siteConfig.title}`,
    description: cat.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const cat = siteConfig.categories.find((c) => c.key === category);
  if (!cat) notFound();

  const articles = await getArticlesByCategory(category);

  return (
    <div className="category-page">
      <section className="category-banner">
        <h1>{cat.label}</h1>
        <p>{cat.description}</p>
        <span className="article-count">{articles.length} articles</span>
      </section>
      <section className="article-grid">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </section>
    </div>
  );
}
