import { describe, expect, it, vi } from 'vitest'
import { downloadImage } from '../../server/lib/image-download'
import { PNG_BYTES, streamResponse } from '../helpers/png'

const options = { allowedHosts: ['images.ygoprodeck.com'], maxBytes: 1024 }

describe('downloadImage', () => {
  it('downloads from an allowed HTTPS host', async () => {
    const fetchFn = vi.fn().mockResolvedValue(streamResponse(PNG_BYTES))
    const bytes = await downloadImage('https://images.ygoprodeck.com/images/cards/1.jpg', { ...options, fetchFn })
    expect(new Uint8Array(bytes)).toEqual(PNG_BYTES)
    expect(fetchFn).toHaveBeenCalledOnce()
    expect(fetchFn.mock.calls[0]![1]).toMatchObject({ redirect: 'error' })
  })

  it.each([
    'http://images.ygoprodeck.com/a.jpg',
    'https://evil.example.com/a.jpg',
    'https://images.ygoprodeck.com.evil.example.com/a.jpg',
    'https://169.254.169.254/latest/meta-data',
  ])('refuses %s without fetching', async (url) => {
    const fetchFn = vi.fn()
    await expect(downloadImage(url, { ...options, fetchFn })).rejects.toThrow(/not allowed/)
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('fails on error responses', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('nope', { status: 404 }))
    await expect(downloadImage('https://images.ygoprodeck.com/a.jpg', { ...options, fetchFn })).rejects.toThrow(/404/)
  })

  it('rejects bodies larger than the limit, declared or streamed', async () => {
    const declared = vi.fn().mockResolvedValue(streamResponse(PNG_BYTES, { headers: { 'content-length': '999999' } }))
    await expect(downloadImage('https://images.ygoprodeck.com/a.jpg', { ...options, fetchFn: declared })).rejects.toThrow(/too large/)

    const streamed = vi.fn().mockResolvedValue(streamResponse(new Uint8Array(2048)))
    await expect(downloadImage('https://images.ygoprodeck.com/a.jpg', { ...options, fetchFn: streamed })).rejects.toThrow(/too large/)
  })
})
