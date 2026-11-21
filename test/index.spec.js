import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:workers';
import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../_worker.js';

describe('Cloudflare DoH worker', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('forwards Google JSON API queries to /resolve', async () => {
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response('ok', { status: 200 }));
		const request = new Request(
			'https://proxy.example.com/google/query-dns?name=example.com&type=A',
			{
				headers: {
					accept: 'application/dns-json',
				},
			}
		);
		const ctx = createExecutionContext();

		const response = await worker.fetch(request, env, ctx);

		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		expect(fetchSpy.mock.calls[0][0].url).toBe(
			'https://dns.google/resolve?name=example.com&type=A'
		);
	});

	it('forwards Google RFC 8484 queries to /dns-query', async () => {
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response('ok', { status: 200 }));
		const request = new Request(
			'https://proxy.example.com/google-rfc/query-dns?dns=AAABAAABAAAAAAAAB2V4YW1wbGUDY29tAAABAAE',
			{
				headers: {
					accept: 'application/dns-message',
				},
			}
		);
		const ctx = createExecutionContext();

		const response = await worker.fetch(request, env, ctx);

		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		expect(fetchSpy.mock.calls[0][0].url).toBe(
			'https://dns.google/dns-query?dns=AAABAAABAAAAAAAAB2V4YW1wbGUDY29tAAABAAE'
		);
	});
});
