import { PageSEO } from '@/components/SEO'
import siteMetadata from '@/data/siteMetadata'
import { getAllFilesFrontMatter, getFiles } from '@/lib/mdx'
import ListLayout from '@/layouts/ListLayout'
import { POSTS_PER_PAGE } from '../../blog'

export async function getStaticPaths({ defaultLocale, locales }) {
  // Generate paths for all languages
  const localePaths = (
    await Promise.all(
      locales.map(async (locale) => {
        // Change getAllFilesFrontMatter -> getFiles, Add locale, defaultLocale, locales
        const posts = await getFiles('blog', locale, defaultLocale, locales)
        const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
        return Array.from({ length: totalPages }, (_, i) => ({
          params: { page: (i + 1).toString() },
          locale,
        }))
      })
    )
  ).flat()

  return {
    paths: localePaths.map(({ params, locale }) => ({
      params,
      locale,
    })),
    fallback: false,
  }
}

export async function getStaticProps(context) {
  const {
    params: { page },
    locale,
    defaultLocale,
    locales,
  } = context
  const posts = await getAllFilesFrontMatter('blog', locale, defaultLocale, locales)
  const pageNumber = parseInt(page)
  const initialDisplayPosts = posts.slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )
  const pagination = {
    currentPage: pageNumber,
    totalPages: Math.ceil(posts.length / POSTS_PER_PAGE),
  }

  return {
    props: {
      posts,
      initialDisplayPosts,
      pagination,
    },
  }
}

export default function PostPage({ posts, initialDisplayPosts, pagination }) {
  return (
    <>
      <PageSEO title={siteMetadata.title} description={siteMetadata.description} />
      <ListLayout
        posts={posts}
        initialDisplayPosts={initialDisplayPosts}
        pagination={pagination}
        title="All Posts"
      />
    </>
  )
}
