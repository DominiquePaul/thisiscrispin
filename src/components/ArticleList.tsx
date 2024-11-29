import Link from 'next/link';
import { Article } from '@/lib/types';

export default function ArticleList({ tag, articles }: { tag: string; articles: Article[] }) {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <main>
        <h2 className="text-3xl font-bold mb-6">All essays and guides</h2>
        <ul className="space-y-6">
          {articles.map(article => (
            <li key={article.id} className="pb-4">
              <Link href={`/posts/${article.slug}`} className="block">
                <h3 className="text-xl font-semibold text-blue-600 hover:text-blue-800 mb-2">{article.title}</h3>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <footer className="fixed bottom-0 border-t left-0 right-0 py-4 text-center text-sm text-gray-600">
        <p>© {new Date().getFullYear()} Dominique Paul. All rights reserved.</p>
      </footer>
    </div>
  );
}