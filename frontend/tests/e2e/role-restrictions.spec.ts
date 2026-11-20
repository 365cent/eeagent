import { expect, test } from '@playwright/test'

const API = process.env.EEA_API_URL ?? 'http://127.0.0.1:8000'

test.describe('role restrictions (OPS-03)', () => {
  test('the dev operator cannot issue capture tokens when not an admin', async ({ request }) => {
    const whoami = await request.get(`${API}/api/v1/capture/whoami`)
    expect(whoami.ok(), 'whoami must answer so the role is server-reported').toBeTruthy()
    const actor = await whoami.json()
    test.skip(actor.role === 'platform_admin', 'development operator is a platform admin; not a negative case')

    const issued = await request.post(`${API}/api/v1/capture/tokens`, {
      data: { subject: 'pw-should-be-denied', label: 'playwright' },
    })
    expect(issued.status(), 'non-admin token issuance must be rejected').toBe(403)

    const listed = await request.get(`${API}/api/v1/capture/tokens`)
    expect(listed.status(), 'non-admin token listing must be rejected').toBe(403)
  })

  test('a caller cannot promote itself through a request body role field', async ({ request }) => {
    const issued = await request.post(`${API}/api/v1/capture/tokens`, {
      data: { subject: 'pw-should-be-denied', label: 'playwright', role: 'platform_admin' },
    })
    // A body field must not widen authority: either ignored as an unknown field (4xx)
    // or still forbidden by the server identity (403).
    expect([403, 422], 'body-supplied role must never grant access').toContain(issued.status())
  })

  test('a direct identity header is ignored unless the peer is a trusted proxy', async ({ request }) => {
    const whoami = await request.get(`${API}/api/v1/capture/whoami`, {
      headers: { 'x-eea-authenticated-user': 'someone-else', 'x-eea-authenticated-role': 'platform_admin' },
    })
    expect(whoami.ok(), 'whoami must answer').toBeTruthy()
    const actor = await whoami.json()
    // Development ignores proxy headers entirely. In production the peer must be a
    // trusted proxy or the request is 401; either way a direct call must not become
    // the spoofed subject or gain platform_admin.
    expect(actor.subject, 'spoofed subject must not be adopted').not.toBe('someone-else')
    expect(actor.role, 'spoofed admin must not be adopted').not.toBe('platform_admin')

    const created = await request.post(`${API}/api/v1/agent/sessions`, { data: { title: 'pw owner check' } })
    expect(created.ok(), created.status().toString()).toBeTruthy()
    const session = await created.json()
    const listed = await request.get(`${API}/api/v1/agent/sessions`)
    const ids = (await listed.json()).map((row: { id: string }) => row.id)
    expect(ids, 'own session must be listed under the server identity').toContain(session.id)
  })
})
