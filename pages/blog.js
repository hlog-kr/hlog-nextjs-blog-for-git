import { getAllFilesFrontMatter } from '@/lib/mdx'
import siteMetadata from '@/data/siteMetadata'
import ListLayout from '@/layouts/ListLayout'
import { PageSEO } from '@/components/SEO'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'

export const POSTS_PER_PAGE = 5

export async function getStaticProps({ locale, defaultLocale, locales }) {
  const posts = await getAllFilesFrontMatter('blog', locale, defaultLocale, locales)
  const initialDisplayPosts = posts.slice(0, POSTS_PER_PAGE)
  const pagination = {
    currentPage: 1,
    totalPages: Math.ceil(posts.length / POSTS_PER_PAGE),
  }

  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      initialDisplayPosts,
      posts,
      pagination,
      locale,
    },
  }
}

export default function Blog({ posts, initialDisplayPosts, pagination, locale }) {
  const { t } = useTranslation('common')
  return (
    <>
      <PageSEO
        title={`Blog - ${siteMetadata.author}`}
        description={siteMetadata.description[locale]}
      />
      <ListLayout
        posts={posts}
        initialDisplayPosts={initialDisplayPosts}
        pagination={pagination}
        title={t('all')}
      />
    </>
  )
}
