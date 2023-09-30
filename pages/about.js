import { MDXLayoutRenderer } from '@/components/MDXComponents'
import { getFileBySlug } from '@/lib/mdx'

const DEFAULT_LAYOUT = 'AuthorLayout'

export async function getStaticProps({ locale, defaultLocale, locales }) {
  const authorDetails = await getFileBySlug('authors', ['default'], locale, defaultLocale)
  return { props: { authorDetails, availableLocales: locales } }
}

export default function About({ authorDetails, availableLocales }) {
  const { mdxSource, frontMatter } = authorDetails

  return (
    <MDXLayoutRenderer
      layout={frontMatter.layout || DEFAULT_LAYOUT}
      mdxSource={mdxSource}
      frontMatter={frontMatter}
      availableLocales={availableLocales}
    />
  )
}
