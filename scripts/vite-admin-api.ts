import type { Connect, Plugin } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import {
  loadRatingOverrides,
  saveRatingOverrides,
  type RatingOverridesFile,
} from './rating-overrides'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

function readBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function sendJson(res: import('http').ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function attachAdminApi(middlewares: Connect.Server) {
  middlewares.use(async (req, res, next) => {
    if (!req.url?.startsWith('/api/admin')) {
      next()
      return
    }

    const url = new URL(req.url, 'http://localhost')

    try {
      if (req.method === 'GET' && url.pathname === '/api/admin/overrides') {
        sendJson(res, 200, loadRatingOverrides())
        return
      }

      if (req.method === 'PUT' && url.pathname === '/api/admin/overrides') {
        const body = JSON.parse(await readBody(req)) as RatingOverridesFile
        saveRatingOverrides(body)
        sendJson(res, 200, { ok: true })
        return
      }

      if (req.method === 'POST' && url.pathname === '/api/admin/overrides/item') {
        const body = JSON.parse(await readBody(req)) as {
          key: string
          rating: number
          note?: string
        }
        const data = loadRatingOverrides()
        data.overrides[body.key] = {
          rating: body.rating,
          note: body.note,
          updatedAt: new Date().toISOString(),
        }
        saveRatingOverrides(data)
        sendJson(res, 200, { ok: true, override: data.overrides[body.key] })
        return
      }

      if (req.method === 'DELETE' && url.pathname.startsWith('/api/admin/overrides/item/')) {
        const key = decodeURIComponent(url.pathname.replace('/api/admin/overrides/item/', ''))
        const data = loadRatingOverrides()
        delete data.overrides[key]
        saveRatingOverrides(data)
        sendJson(res, 200, { ok: true })
        return
      }

      if (req.method === 'POST' && url.pathname === '/api/admin/rebuild') {
        execSync('npm run build:data', { cwd: ROOT, stdio: 'inherit' })
        sendJson(res, 200, { ok: true })
        return
      }

      sendJson(res, 404, { error: 'Not found' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      sendJson(res, 500, { error: message })
    }
  })
}

export function adminApiPlugin(): Plugin {
  return {
    name: 'f1-admin-api',
    configureServer(server) {
      attachAdminApi(server.middlewares)
    },
    configurePreviewServer(server) {
      attachAdminApi(server.middlewares)
    },
  }
}
