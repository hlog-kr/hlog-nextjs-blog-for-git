import { useRouter } from 'next/router'
import Link from 'next/link'

const LanguageSwitch = ({ availableLocales }) => {
  const { locales, locale, asPath } = useRouter()

  if (!locales) {
    return null
  }

  //console.log('availableLocales', availableLocales)

  return (
    <div className="rounded bg-gray-200 py-2 dark:bg-gray-800">
      {locales.map((item) =>
        (availableLocales || []).includes(item) ? (
          <Link key={item} locale={item} href={asPath}>
            <a
              className={`p-2 font-medium text-gray-900 dark:text-gray-100 ${
                item === locale ? 'rounded bg-gray-400 dark:bg-gray-600' : ''
              }`}
            >
              {item}
            </a>
          </Link>
        ) : (
          <span
            key={item}
            className="p-2 font-medium text-gray-400 dark:text-gray-500"
            style={{ cursor: 'not-allowed' }}
          >
            {item}
          </span>
        )
      )}
    </div>
  )
}

export default LanguageSwitch
