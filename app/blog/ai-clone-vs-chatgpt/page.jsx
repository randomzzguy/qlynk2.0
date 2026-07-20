import ResourceArticle from '@/components/ResourceArticle';
import { resourceArticles } from '@/lib/resource-articles';
import { createMetadata } from '@/lib/seo';

const slug = 'ai-clone-vs-chatgpt';
const article = resourceArticles[slug];

export const metadata = createMetadata({ title: `${article.shortTitle} | Qlynk AI`, description: article.description, path: `/blog/${slug}`, type: 'article' });

export default function AICloneVsChatGPTPage() {
  return <ResourceArticle article={article} slug={slug} />;
}
