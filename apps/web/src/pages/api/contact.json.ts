import type { APIRoute } from 'astro'

export const prerender = false

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_EMAIL_LENGTH = 254
const MAX_MESSAGE_LENGTH = 2000
const RATE_WINDOW_MS = 60_000
const RATE_MAX_REQUESTS = 5
const MAX_BODY_BYTES = 8192
const MAX_IPS_TRACKED = 1000

const hitsByIp = new Map<string, number[]>()

const json = (body: unknown, status: number, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  })

const getClientIp = (request: Request, clientAddress?: string): string => {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || clientAddress || 'unknown'
}

const pruneHitsByIp = () => {
  const now = Date.now()
  for (const [ip, hits] of hitsByIp) {
    const fresh = hits.filter((t) => now - t < RATE_WINDOW_MS)
    if (fresh.length === 0) hitsByIp.delete(ip)
    else if (fresh.length !== hits.length) hitsByIp.set(ip, fresh)
  }
  while (hitsByIp.size > MAX_IPS_TRACKED) {
    const oldest = hitsByIp.keys().next().value as string | undefined
    if (oldest === undefined) break
    hitsByIp.delete(oldest)
  }
}

const isRateLimited = (ip: string): boolean => {
  const now = Date.now()
  const hits = (hitsByIp.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  if (hits.length >= RATE_MAX_REQUESTS) {
    hitsByIp.set(ip, hits)
    return true
  }
  hits.push(now)
  hitsByIp.set(ip, hits)
  if (hitsByIp.size > MAX_IPS_TRACKED) pruneHitsByIp()
  return false
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return json({ error: 'Content-Type must be application/json' }, 400)
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ error: 'Payload too large' }, 413)
  }

  if (isRateLimited(getClientIp(request, clientAddress))) {
    return json({ error: 'Too many requests, try again later' }, 429, { 'Retry-After': '60' })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { email, message, honeypot } = (body ?? {}) as {
    email?: unknown
    message?: unknown
    honeypot?: unknown
  }

  const honeypotValue = honeypot == null ? '' : String(honeypot)
  if (honeypotValue.length > 0) {
    return json({ error: 'Invalid submission' }, 400)
  }

  if (typeof email !== 'string') {
    return json({ error: 'Invalid email address' }, 400)
  }
  const trimmedEmail = email.trim()
  if (
    trimmedEmail.length === 0 ||
    trimmedEmail.length > MAX_EMAIL_LENGTH ||
    !EMAIL_RE.test(trimmedEmail)
  ) {
    return json({ error: 'Invalid email address' }, 400)
  }

  if (typeof message !== 'string') {
    return json({ error: 'Message must be 1..2000 characters' }, 400)
  }
  const trimmedMessage = message.trim()
  if (trimmedMessage.length === 0 || trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return json({ error: 'Message must be 1..2000 characters' }, 400)
  }

  // TODO: send via mail provider (v1 prefers mailto:, backend is a minimal placeholder).
  console.log(`[contact] message received (${trimmedMessage.length} chars)`)
  return json({ ok: true }, 200)
}
