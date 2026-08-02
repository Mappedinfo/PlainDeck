// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { initializeAnalytics } from './analytics'

afterEach(() => {
  document.getElementById('plaindeck-google-analytics')?.remove()
  document.getElementById('plaindeck-baidu-analytics')?.remove()
  delete (window as typeof window & { dataLayer?: unknown }).dataLayer
  delete (window as typeof window & { gtag?: unknown }).gtag
  delete (window as typeof window & { _hmt?: unknown })._hmt
})

describe('analytics', () => {
  it('does not load third-party scripts without configured IDs', () => {
    initializeAnalytics()

    expect(document.querySelectorAll('script[src]')).toHaveLength(0)
  })

  it('loads Google Analytics for a valid GA4 measurement ID', () => {
    initializeAnalytics({ googleMeasurementId: 'G-ABC1234567' })

    const script = document.getElementById('plaindeck-google-analytics') as HTMLScriptElement
    expect(script.src).toBe('https://www.googletagmanager.com/gtag/js?id=G-ABC1234567')
    expect((window as typeof window & { dataLayer: unknown[] }).dataLayer).toHaveLength(2)
  })

  it('loads Baidu Analytics for a valid site ID', () => {
    const siteId = '0123456789abcdef0123456789abcdef'
    initializeAnalytics({ baiduSiteId: siteId })

    const script = document.getElementById('plaindeck-baidu-analytics') as HTMLScriptElement
    expect(script.src).toBe(`https://hm.baidu.com/hm.js?${siteId}`)
  })

  it('ignores invalid IDs and disabled analytics', () => {
    initializeAnalytics({ googleMeasurementId: 'UA-OLD-ID', baiduSiteId: 'invalid' })
    initializeAnalytics({ googleMeasurementId: 'G-ABC1234567', enabled: false })

    expect(document.querySelectorAll('script[src]')).toHaveLength(0)
  })
})
