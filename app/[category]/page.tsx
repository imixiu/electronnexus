import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getArticlesByCategory } from "@/lib/queries";
import { siteConfig } from "@/lib/site-config";
import { ArticleCard } from "@/components/article/ArticleCard";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const cat = siteConfig.categories.find((c) => c.key === category);
  if (!cat) return { title: "Category Not Found" };
  return {
    title: `${cat.label} - ${siteConfig.title}`,
    description: cat.description,
    alternates: {
      canonical: `${siteConfig.url}/${category}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  const { page: pageStr } = await searchParams;
  const cat = siteConfig.categories.find((c) => c.key === category);
  if (!cat) notFound();

  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const { articles, total } = await getArticlesByCategory(category, page, PAGE_SIZE);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="category-page">
      <section className="category-banner">
        <h1>{cat.label}</h1>
        <p>{cat.description}</p>
        <span className="article-count">{total} articles</span>
      </section>
      <section className="article-grid">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </section>

      {totalPages > 1 && (
        <nav className="pagination">
          {page > 1 && (
            <Link href={`/${category}?page=${page - 1}`} className="pagination-btn">
              ← Prev
            </Link>
          )}
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/${category}?page=${page + 1}`} className="pagination-btn">
              Next →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
