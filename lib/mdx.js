import { bundleMDX } from 'mdx-bundler'
import fs from 'fs'
import matter from 'gray-matter'
import path from 'path'
import readingTime from 'reading-time'
import { visit } from 'unist-util-visit'
import getAllFilesRecursively from './utils/files'
// Remark packages
import remarkGfm from 'remark-gfm'
import remarkFootnotes from 'remark-footnotes'
import remarkMath from 'remark-math'
import remarkExtractFrontmatter from './remark-extract-frontmatter'
import remarkCodeTitles from './remark-code-title'
import remarkTocHeadings from './remark-toc-headings'
import remarkImgToJsx from './remark-img-to-jsx'
// Rehype packages
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import rehypeCitation from 'rehype-citation'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypePresetMinify from 'rehype-preset-minify'

const root = process.cwd()

// Filtering Files by Language
function filterLocaleFiles(files, locale, defaultLocale, locales) {
  let filterFiles = files

  if (locales && defaultLocale && locales) {
    filterFiles =
      locale !== defaultLocale
        ? files.filter((path) => path.includes(`.${locale}.`))
        : files.filter((path) => !locales.some((locale) => path.includes(`.${locale}.`)))
  }

  return filterFiles
}

export function getFiles(type, locale, defaultLocale, locales) {
  const prefixPaths = path.join(root, 'data', type)
  const files = getAllFilesRecursively(prefixPaths)

  const filterFiles = filterLocaleFiles(files, locale, defaultLocale, locales)

  // Only want to return blog/path and ignore root, replace is needed to work on Windows
  return filterFiles.map((file) => file.slice(prefixPaths.length + 1).replace(/\\/g, '/'))
}

export function formatSlug(slug, locales = null) {
  let result = slug.replace(/\.(mdx|md)/, '')

  // Added: Removing the locale from the Slug
  if (locales && locales.length > 0) {
    locales.forEach((locale) => {
      result = result.replace(`.${locale}`, '')
    })
  }

  return result
}

export function dateSortDesc(a, b) {
  if (a > b) return -1
  if (a < b) return 1
  return 0
}

export async function getFileBySlug(type, slug, locale = null, defaultLocale = null) {
  // Modify it to fetch the files for the selected language if it's not the default locale.
  const mdxPath =
    locale === defaultLocale
      ? path.join(root, 'data', type, `${slug}.mdx`)
      : path.join(root, 'data', type, `${slug}.${locale}.mdx`)
  const mdPath =
    locale === defaultLocale
      ? path.join(root, 'data', type, `${slug}.md`)
      : path.join(root, 'data', type, `${slug}.${locale}.md`)
  const source = fs.existsSync(mdxPath)
    ? fs.readFileSync(mdxPath, 'utf8')
    : fs.readFileSync(mdPath, 'utf8')

  // https://github.com/kentcdodds/mdx-bundler#nextjs-esbuild-enoent
  if (process.platform === 'win32') {
    process.env.ESBUILD_BINARY_PATH = path.join(root, 'node_modules', 'esbuild', 'esbuild.exe')
  } else {
    process.env.ESBUILD_BINARY_PATH = path.join(root, 'node_modules', 'esbuild', 'bin', 'esbuild')
  }

  let toc = []

  const { code, frontmatter } = await bundleMDX({
    source,
    // mdx imports can be automatically source from the components directory
    cwd: path.join(root, 'components'),
    xdmOptions(options, frontmatter) {
      // this is the recommended way to add custom remark/rehype plugins:
      // The syntax might look weird, but it protects you in case we add/remove
      // plugins in the future.
      options.remarkPlugins = [
        ...(options.remarkPlugins ?? []),
        remarkExtractFrontmatter,
        [remarkTocHeadings, { exportRef: toc }],
        remarkGfm,
        remarkCodeTitles,
        [remarkFootnotes, { inlineNotes: true }],
        remarkMath,
        remarkImgToJsx,
      ]
      options.rehypePlugins = [
        ...(options.rehypePlugins ?? []),
        rehypeSlug,
        rehypeAutolinkHeadings,
        rehypeKatex,
        [rehypeCitation, { path: path.join(root, 'data') }],
        [rehypePrismPlus, { ignoreMissing: true }],
        rehypePresetMinify,
      ]
      return options
    },
    esbuildOptions: (options) => {
      options.loader = {
        ...options.loader,
        '.js': 'jsx',
      }
      return options
    },
  })

  return {
    mdxSource: code,
    toc,
    frontMatter: {
      readingTime: readingTime(code),
      slug: slug || null,
      fileName: fs.existsSync(mdxPath) ? `${slug}.mdx` : `${slug}.md`,
      ...frontmatter,
      date: frontmatter.date ? new Date(frontmatter.date).toISOString() : null,
    },
  }
}

export async function getAllFilesFrontMatter(folder, locale, defaultLocale, locales) {
  const prefixPaths = path.join(root, 'data', folder)

  const files = getAllFilesRecursively(prefixPaths)

  const filterFiles = filterLocaleFiles(files, locale, defaultLocale, locales) // Add

  const allFrontMatter = []

  filterFiles.forEach((file) => {
    // Replace is needed to work on Windows
    const fileName = file.slice(prefixPaths.length + 1).replace(/\\/g, '/')
    // Remove Unexpected File
    if (path.extname(fileName) !== '.md' && path.extname(fileName) !== '.mdx') {
      return
    }
    const source = fs.readFileSync(file, 'utf8')
    const { data: frontmatter } = matter(source)
    if (frontmatter.draft !== true) {
      allFrontMatter.push({
        ...frontmatter,
        slug: formatSlug(fileName, locales),
        date: frontmatter.date ? new Date(frontmatter.date).toISOString() : null,
      })
    }
  })

  return allFrontMatter.sort((a, b) => dateSortDesc(a.date, b.date))
}

export async function getAvailableLocalesBySlug(
  type,
  slug,
  locale = null,
  defaultLocale = null,
  locales = null
) {
  return locales
    .map((locale) => {
      const localeExtention = locale === defaultLocale ? '' : `.${locale}`
      const mdxPath = path.join(root, 'data', type, `${slug}${localeExtention}.mdx`)
      const mdPath = path.join(root, 'data', type, `${slug}${localeExtention}.md`)
      if (fs.existsSync(mdxPath) || fs.existsSync(mdPath)) {
        return locale
      }
    })
    .filter((locale) => locale !== undefined)
}
