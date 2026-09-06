import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Static Web Apps delivery policy', () => {
  const config = JSON.parse(readFileSync(resolve(process.cwd(), 'public/staticwebapp.config.json'), 'utf8')) as {
    globalHeaders: Record<string, string>
    routes: Array<{ route: string; headers: Record<string, string> }>
    mimeTypes: Record<string, string>
    responseOverrides: Record<string, { rewrite: string }>
  }

  it('keeps documents fresh and gives immutable lifetime to built assets', () => {
    expect(config.globalHeaders['Cache-Control']).toBe('no-cache, max-age=0, must-revalidate')
    expect(config.routes).toContainEqual({ route: '/assets/*', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } })
  })

  it('ships CSP, permission, clickjacking, and manifest MIME policies', () => {
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'")
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()')
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY')
    expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json')
  })

  it('rewrites only known app routes and sends unknown paths to the designed 404 document', () => {
    expect(config.routes.map((route) => route.route)).toEqual(expect.arrayContaining(['/demo', '/privacy', '/terms']))
    expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html' })
  })
})
