/** Realistic, local-only sample evidence used only by the isolated /demo mode. */
export function sampleFiles(): File[] {
  return [
    new File(['<x:ContentIdentifier>F3A36F10-8F34-4CB2-B6B9-FA1342D1B901</x:ContentIdentifier><x:DateTimeOriginal>2026-08-24T09:42:11Z</x:DateTimeOriginal>'], 'IMG_6042.xmp', { type: 'application/xml' }),
    new File(['{"ContentIdentifier":"F3A36F10-8F34-4CB2-B6B9-FA1342D1B901","DateTimeOriginal":"2026-08-24T09:42:11Z"}'], 'IMG_6042.json', { type: 'application/json' }),
    new File(['<x:ContentIdentifier>6386E9D3-E7DD-4A13-8B45-4A5ABE2B8B53</x:ContentIdentifier>'], 'IMG_6043.xmp', { type: 'application/xml' }),
    new File(['{"ContentIdentifier":"11D67190-1EBA-4051-A050-081DEBA3D7C5"}'], 'IMG_6043.json', { type: 'application/json' }),
    new File(['<x:DateTimeOriginal>2026-08-25T16:03:00Z</x:DateTimeOriginal>'], 'IMG_6044.xmp', { type: 'application/xml' }),
    new File(['{"DateTimeOriginal":"2026-08-25T16:03:02Z"}'], 'IMG_6044.json', { type: 'application/json' }),
  ]
}
