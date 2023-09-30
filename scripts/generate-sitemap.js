const fs = require('fs')
const globby = require('globby')
const matter = require('gray-matter')
const prettier = require('prettier')
const siteMetadata = require('../data/siteMetadata')
// Added: Importing the i18n configuration.
const { i18n } = require('../next-i18next.config')

;(async () => {
  const prettierConfig = await prettier.resolveConfig('./.prettierrc.js')
  const pages = await globby([
    'pages/*.js',
    'pages/*.tsx',
    'data/blog/**/*.mdx',
    'data/blog/**/*.md',
    'public/tags/**/*.xml',
    '!pages/_*.js',
    '!pages/_*.tsx',
    '!pages/api',
  ])

  // Added: Loading the list of locales and the default locale from the i18n configuration.
  const { locales, defaultLocale } = i18n

  // Added: routeMap = { path: ['en', ''] } format with the default locale set to ''.
  const routeMap = new Map()

  // Keep the existing part for filtering as it is, and add the part for adding locales to routeMap.
  pages.forEach((page) => {
    // Exclude drafts from the sitemap
    if (page.search('.md') >= 1 && fs.existsSync(page)) {
      const source = fs.readFileSync(page, 'utf8')
      const fm = matter(source)
      if (fm.data.draft) {
        return
      }
      if (fm.data.canonicalUrl) {
        return
      }
    }

    if (page.search('pages/404.') > -1 || page.search(`pages/blog/[...slug].`) > -1) {
      return
    }

    const path = page
      .replace('pages/', '/')
      .replace('data/blog', '/blog')
      .replace('public/', '/')
      .replace('.js', '')
      .replace('.tsx', '')
      .replace('.mdx', '')
      .replace('.md', '')
      // Modify the replace part to find the locale for the feed.
      .replace('/feed', '')
      .replace('.xml', '')
    const route = path === '/index' ? '' : path

    // Dynamic content under /blog and /tags should be added after checking the locale.
    if (/^\/(blog|tags)\/[^/]+/.test(route)) {
      // Regular expression to check for the presence of .{locale}.
      const regex = new RegExp(`\\.(${locales.join('|')})$`, 'i')
      const findLocale = route.match(regex)

      if (findLocale) {
        const locale = findLocale[1]
        const newRoute = route.replace(regex, '') // Remove the locale from the route
        routeMap.set(
          newRoute,
          routeMap.has(newRoute) ? [...routeMap.get(newRoute), locale] : [locale] // Add the locale included in the path to an array
        )
      } else {
        routeMap.set(
          route,
          routeMap.has(route) ? [...routeMap.get(route), defaultLocale] : [defaultLocale]
        )
      }
    }
    // For non-dynamic content pages, add all locales.
    else {
      routeMap.set(
        route,
        locales.map((locale) => (locale === defaultLocale ? '' : locale))
      )
    }
  })

  // Generate a list of URLs using routeMap.
  // If there are more than two included locales, add xhtml:link; otherwise, add only the URL.
  let sitemapUrls = ''
  routeMap.forEach((value, key) => {
    if (value.length > 1) {
      sitemapUrls += `
    <url>
        <loc>${siteMetadata.siteUrl}${key}</loc>
        ${value
          .map((locale) => {
            return `<xhtml:link rel="alternate" hreflang="${
              locale === '' ? defaultLocale : locale
            }" href="${siteMetadata.siteUrl}${locale === '' ? '' : '/' + locale}${key}" />`
          })
          .join('')}
    </url>`
    } else {
      sitemapUrls += `
    <url>
        <loc>${siteMetadata.siteUrl}${key}</loc>
    </url>`
    }
  })

  // Generate the sitemap
  const sitemap = `
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
    ${sitemapUrls}
  </urlset>`

  /* const sitemap = `
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${pages
              .map((page) => {
                // Exclude drafts from the sitemap
                if (page.search('.md') >= 1 && fs.existsSync(page)) {
                  const source = fs.readFileSync(page, 'utf8')
                  const fm = matter(source)
                  if (fm.data.draft) {
                    return
                  }
                  if (fm.data.canonicalUrl) {
                    return
                  }
                }
                const path = page
                  .replace('pages/', '/')
                  .replace('data/blog', '/blog')
                  .replace('public/', '/')
                  .replace('.js', '')
                  .replace('.tsx', '')
                  .replace('.mdx', '')
                  .replace('.md', '')
                  .replace('/feed.xml', '')
                const route = path === '/index' ? '' : path

                if (page.search('pages/404.') > -1 || page.search(`pages/blog/[...slug].`) > -1) {
                  return
                }
                return `
                        <url>
                            <loc>${siteMetadata.siteUrl}${route}</loc>
                        </url>
                    `
              })
              .join('')}
        </urlset>
    `*/

  const formatted = prettier.format(sitemap, {
    ...prettierConfig,
    parser: 'html',
  })

  // eslint-disable-next-line no-sync
  fs.writeFileSync('public/sitemap.xml', formatted)
})()
