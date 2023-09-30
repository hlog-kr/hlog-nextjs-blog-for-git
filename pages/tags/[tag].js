import { TagSEO } from '@/components/SEO'
import siteMetadata from '@/data/siteMetadata'
import ListLayout from '@/layouts/ListLayout'
import generateRss from '@/lib/generate-rss'
import { getAllFilesFrontMatter } from '@/lib/mdx'
import { getAllTags } from '@/lib/tags'
import kebabCase from '@/lib/utils/kebabCase'
import fs from 'fs'
import path from 'path'

const root = process.cwd()

export async function getStaticPaths({ locales, defaultLocale }) {
  // Generate paths for all languages
  const localeTags = (
    await Promise.all(
      locales.map(async (locale) => {
        const tags = await getAllTags('blog', locale, defaultLocale, locales)
        return Object.keys(tags).map((tag) => ({
          params: { tag },
          locale,
        }))
      })
    )
  ).flat()

  return {
    paths: localeTags.map(({ params, locale }) => ({
      params,
      locale,
    })),
    fallback: false,
  }
}

export async function getStaticProps({ params, locale, defaultLocale, locales }) {
  const allPosts = await getAllFilesFrontMatter('blog', locale, defaultLocale, locales)
  const filteredPosts = allPosts.filter(
    (post) => post.draft !== true && post.tags.map((t) => kebabCase(t)).includes(params.tag)
  )

  // Find the list of available languages.
  const availableLocales = []
  await Promise.all(
    locales.map(async (local) => {
      const tags = await getAllTags('blog', local, defaultLocale, locales)
      if (tags[params.tag] !== undefined) availableLocales.push(local)
    })
  )

  // rss
  if (filteredPosts.length > 0) {
    const feedName = locale === defaultLocale ? 'feed.xml' : `feed.${locale}.xml`
    const rss = generateRss(filteredPosts, `tags/${params.tag}/${feedName}`, locale)
    const rssPath = path.join(root, 'public', 'tags', params.tag)
    fs.mkdirSync(rssPath, { recursive: true })
    fs.writeFileSync(path.join(rssPath, feedName), rss)
  }

  return { props: { posts: filteredPosts, tag: params.tag, availableLocales } }
}

export default function Tag({ posts, tag, availableLocales }) {
  // Capitalize first letter and convert space to dash
  const title = tag[0].toUpperCase() + tag.split(' ').join('-').slice(1)
  return (
    <>
      <TagSEO
        title={`${tag} - ${siteMetadata.author}`}
        description={`${tag} tags - ${siteMetadata.author}`}
        availableLocales={availableLocales}
      />
      <ListLayout posts={posts} title={title} />
    </>
  )
}
