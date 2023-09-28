import { useEffect } from 'react'
import siteMetadata from '@/data/siteMetadata'

const GAdsBanner = ({ slot }) => {
  const isProduction = process.env.NODE_ENV === 'production'

  useEffect(() => {
    if (!isProduction) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (err) {
      console.log(err)
    }
  }, [])

  return (
    isProduction && (
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={siteMetadata.ads.googleAdsenseId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    )
  )
}

export default GAdsBanner
