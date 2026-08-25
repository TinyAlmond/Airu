import type { Context } from '@deepseek-ai/cordis'

// Extend Context with DSH-provided services
declare module '@deepseek-ai/cordis' {
  interface Context {
    webServer: {
      register(opts: { kind: string; path: string; handler: (req: any, res: any) => void }): () => void
    }
  }
  interface Events {
    'session/event': (session: any, event: { type: string }) => void
    'dispose': () => void
  }
}
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

export const name = 'airu-pet'
export const inject = ['webServer']

interface PetConfig {
  x: number
  y: number
  scale: number
}

function configPath(): string {
  const dir = join(homedir(), '.dsh')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'airu-pet.json')
}

function loadConfig(): PetConfig {
  const p = configPath()
  if (existsSync(p)) {
    try { return JSON.parse(readFileSync(p, 'utf-8')) } catch { /* fall through */ }
  }
  return { x: -1, y: -1, scale: 3 }
}

function saveConfig(cfg: PetConfig): void {
  writeFileSync(configPath(), JSON.stringify(cfg))
}

export function apply(ctx: Context) {
  let state = 'idle'
  const config = loadConfig()

  // Register routes directly (not via ctx.effect)
  const disposeState = ctx.webServer.register({
    kind: 'exact',
    path: '/api/pet/state',
    handler: (_req, res) => {
      const body = JSON.stringify({ state, ...config })
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(body)
    },
  })

  const disposeConfig = ctx.webServer.register({
    kind: 'exact',
    path: '/api/pet/set-config',
    handler: (req, res) => {
      let body = ''
      req.on('data', (c: Buffer) => { body += c.toString() })
      req.on('end', () => {
        try {
          const patch = JSON.parse(body) as Partial<PetConfig>
          if (patch.x !== undefined) config.x = patch.x
          if (patch.y !== undefined) config.y = patch.y
          if (patch.scale !== undefined) config.scale = patch.scale
          saveConfig(config)
          res.writeHead(200, { 'content-type': 'application/json' })
          res.end('{"ok":true}')
        } catch {
          res.writeHead(400)
          res.end('{"error":"bad json"}')
        }
      })
    },
  })

  // Clean up on unload
  ctx.on('dispose', () => {
    disposeState()
    disposeConfig()
  })

  // React to session events — update pet state
  ctx.on('session/event', (_session, event) => {
    if (event.type === 'assistant-start') state = 'talk'
    else if (event.type === 'assistant-end') state = 'idle'
  })
}
