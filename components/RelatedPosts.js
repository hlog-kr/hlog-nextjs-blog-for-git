import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

const RelatedPosts = ({ posts }) => {
  const { t } = useTranslation('common')
  const { locale } = useRouter()

  if (!posts || posts.length === 0) return null

  return (
    <div className="my-2 rounded-lg bg-gray-100 py-4 pl-4 pr-4 dark:bg-gray-800 xl:py-8">
      <h2 className="toc-ignore mb-2 text-base font-bold uppercase tracking-wide text-gray-800 dark:text-gray-200">
        {t('related_tags')}
      </h2>
      {posts.map((post, index) => (
        <div key={post.slug} className="py-2">
          <div className="flex flex-row content-center justify-start space-x-6">
            <div className="min-w-[80px] text-xs font-semibold text-rose-400">
              {new Date(post.date).toLocaleDateString(locale, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })}
            </div>
            <Link key={index} href={`/blog/${post.slug}`}>
              <a className="truncate text-sm font-semibold text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
                {post.title}
              </a>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

export default RelatedPosts
