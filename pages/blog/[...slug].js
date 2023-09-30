import fs from 'fs'
import PageTitle from '@/components/PageTitle'
import generateRss from '@/lib/generate-rss'
import { MDXLayoutRenderer } from '@/components/MDXComponents'
import {
  formatSlug,
  getAllFilesFrontMatter,
  getAvailableLocalesBySlug,
  getFileBySlug,
  getFiles,
} from '@/lib/mdx'
import kebabCase from '@/lib/utils/kebabCase'

const DEFAULT_LAYOUT = 'PostToc'

function getRelatedPosts(allPosts, currentPost) {
  const defaultCount = 5

  return allPosts
    .filter(
      (item) =>
        item.draft !== true &&
        item.slug !== currentPost.frontMatter.slug &&
        item.tags.filter((tag) =>
          currentPost.frontMatter.tags.map((m) => kebabCase(m)).includes(kebabCase(tag))
        ).length > 0
    )
    .slice(0, defaultCount)
}

export async function getStaticPaths({ locales, defaultLocale }) {
  // Generate paths for all languages
  const localePosts = (
    await Promise.all(
      locales.map(async (locale) => {
        const posts = getFiles('blog', locale, defaultLocale, locales)
        return posts.map((post) => ({
          params: {
            slug: formatSlug(post, locales).split('/'), // Add locales
          },
          locale,
        }))
      })
    )
  ).flat()

  return {
    paths: localePosts.map(({ params, locale }) => ({
      params,
      locale,
    })),
    fallback: false,
  }
}

export async function getStaticProps({ params, locale, defaultLocale, locales }) {
  const allPosts = await getAllFilesFrontMatter('blog', locale, defaultLocale, locales)
  const postIndex = allPosts.findIndex(
    (post) => formatSlug(post.slug, locales) === params.slug.join('/')
  )
  const prev = allPosts[postIndex + 1] || null
  const next = allPosts[postIndex - 1] || null
  const post = await getFileBySlug('blog', params.slug.join('/'), locale, defaultLocale)
  const authorList = post.frontMatter.authors || ['default']
  const authorPromise = authorList.map(async (author) => {
    const authorResults = await getFileBySlug('authors', [author])
    return authorResults.frontMatter
  })
  const authorDetails = await Promise.all(authorPromise)

  const relatedPosts = getRelatedPosts(allPosts, post)

  // Call the function for filtering available languages.
  const availableLocales = await getAvailableLocalesBySlug(
    'blog',
    params.slug.join('/'),
    locale,
    defaultLocale,
    locales
  )

  // rss
  if (allPosts.length > 0) {
    const feedName = locale === defaultLocale ? 'feed.xml' : `feed.${locale}.xml`
    const rss = generateRss(allPosts, feedName, locale)
    fs.writeFileSync(`./public/${feedName}`, rss)
  }

  return { props: { post, authorDetails, prev, next, relatedPosts, availableLocales } }
}

export default function Blog({ post, authorDetails, prev, next, relatedPosts, availableLocales }) {
  const { mdxSource, toc, frontMatter } = post

  return (
    <>
      {frontMatter.draft !== true ? (
        <MDXLayoutRenderer
          layout={frontMatter.layout || DEFAULT_LAYOUT}
          toc={toc}
          mdxSource={mdxSource}
          frontMatter={frontMatter}
          authorDetails={authorDetails}
          prev={prev}
          next={next}
          relatedPosts={relatedPosts}
          availableLocales={availableLocales}
        />
      ) : (
        <div className="mt-24 text-center">
          <PageTitle>
            Under Construction{' '}
            <span role="img" aria-label="roadwork sign">
              🚧
            </span>
          </PageTitle>
        </div>
      )}
    </>
  )
}
