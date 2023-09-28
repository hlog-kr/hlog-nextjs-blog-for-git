import { useEffect } from 'react'
import tocbot from 'tocbot'

const TocSide = () => {
  useEffect(() => {
    tocbot.init({
      tocSelector: '.toc',
      contentSelector: 'article',
      headingSelector: 'h2, h3',
      ignoreSelector: '.toc-ignore',
    })
    return () => tocbot.destroy()
  }, [])

  return (
    <div>
      <div className="lg-block hidden pt-6 pb-10 text-gray-500 dark:text-gray-400 xl:border-b xl:border-gray-200 xl:pt-11 xl:dark:border-gray-700">
        <span className="font-bold text-gray-600  dark:text-gray-300">Table of Contents</span>
        <div className="toc"></div>
      </div>
    </div>
  )
}

export default TocSide
