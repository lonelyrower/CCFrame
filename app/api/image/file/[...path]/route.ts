import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { NextRequest, NextResponse } from 'next/server'

const MIME_BY_EXT: Record<string, string> = {
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
}

const UPLOADS_DIR = path.resolve('./uploads')
const fsPromises = fs.promises

function resolveContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_BY_EXT[ext] || 'application/octet-stream'
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const relativePath = params.path.join('/')
  const fullPath = path.resolve(UPLOADS_DIR, relativePath)
  const withinUploads = path.relative(UPLOADS_DIR, fullPath)

  if (withinUploads.startsWith('..') || path.isAbsolute(withinUploads)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  try {
    const stat = await fsPromises.stat(fullPath)
    if (!stat.isFile()) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const stream = fs.createReadStream(fullPath)
    const headers = new Headers({
      'Content-Type': resolveContentType(relativePath),
      'Cache-Control': 'public, max-age=31536000, immutable',
    })
    headers.set('Content-Length', stat.size.toString())

    return new NextResponse(Readable.toWeb(stream), { headers })
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code !== 'ENOENT') {
      console.error(`Local image stream failed: ${err.message || err}`)
    }
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
