import { createServer } from 'node:http'

const port = Number(process.env.PORT || 3001)
const maxImageBytes = 5 * 1024 * 1024
const maxMetadataBytes = 32 * 1024
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const allowedOrigins = new Set((process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean))

class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function sendJson(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(value))
}

function readBody(request, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    let tooLarge = false

    request.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) tooLarge = true
      else if (!tooLarge) chunks.push(chunk)
    })
    request.on('end', () => {
      if (tooLarge) reject(new ApiError(413, 'El archivo supera el límite permitido.'))
      else resolve(Buffer.concat(chunks))
    })
    request.on('error', reject)
  })
}

function requirePinataToken() {
  if (!process.env.PINATA_JWT) throw new ApiError(503, 'El almacenamiento IPFS no está configurado en el servidor.')
  return process.env.PINATA_JWT
}

async function pinataRequest(path, options) {
  const response = await fetch(`https://api.pinata.cloud/pinning/${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${requirePinataToken()}`, ...options.headers },
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(502, result.error?.details || result.error || 'El proveedor IPFS rechazó la solicitud.')
  return result
}

async function handleRequest(request, response) {
  const url = new URL(request.url, 'http://localhost')

  if (request.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(response, 200, { ok: true, storageConfigured: Boolean(process.env.PINATA_JWT) })
  }

  if (request.method === 'POST' && url.pathname === '/api/upload/file') {
    const contentType = request.headers['content-type']?.split(';')[0]
    if (!allowedImageTypes.has(contentType)) throw new ApiError(415, 'Usa una imagen PNG, JPG o WEBP.')
    const bytes = await readBody(request, maxImageBytes)
    if (bytes.length === 0) throw new ApiError(400, 'El archivo está vacío.')

    const encodedName = request.headers['x-file-name'] || 'certificado'
    let originalName
    try { originalName = decodeURIComponent(encodedName) } catch { throw new ApiError(400, 'El nombre del archivo no es válido.') }
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'certificado'
    const form = new FormData()
    form.append('file', new Blob([bytes], { type: contentType }), safeName)
    const result = await pinataRequest('pinFileToIPFS', { method: 'POST', body: form })
    return sendJson(response, 201, { cid: result.IpfsHash, uri: `ipfs://${result.IpfsHash}` })
  }

  if (request.method === 'POST' && url.pathname === '/api/upload/metadata') {
    const bytes = await readBody(request, maxMetadataBytes)
    let metadata
    try { metadata = JSON.parse(bytes.toString('utf8')) } catch { throw new ApiError(400, 'Los metadatos no contienen JSON válido.') }
    if (typeof metadata.name !== 'string' || !metadata.name.trim() || metadata.name.length > 80) {
      throw new ApiError(400, 'El nombre del certificado es obligatorio y admite hasta 80 caracteres.')
    }
    if (typeof metadata.image !== 'string' || !/^ipfs:\/\/[a-zA-Z0-9]+$/.test(metadata.image)) {
      throw new ApiError(400, 'La imagen debe estar almacenada en IPFS.')
    }
    if (typeof metadata.description !== 'string' || metadata.description.length > 280) {
      throw new ApiError(400, 'La descripción admite hasta 280 caracteres.')
    }

    const result = await pinataRequest('pinJSONToIPFS', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pinataContent: { name: metadata.name.trim(), description: metadata.description.trim(), image: metadata.image },
        pinataMetadata: { name: `CertiTest - ${metadata.name.trim()}` },
      }),
    })
    return sendJson(response, 201, { cid: result.IpfsHash, uri: `ipfs://${result.IpfsHash}` })
  }

  return sendJson(response, 404, { error: 'Ruta no encontrada.' })
}

const server = createServer((request, response) => {
  const origin = request.headers.origin
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Vary', 'Origin')
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-File-Name')
  }

  if (request.method === 'OPTIONS') {
    if (origin && !allowedOrigins.has(origin)) return sendJson(response, 403, { error: 'Origen no autorizado.' })
    response.writeHead(204)
    return response.end()
  }

  handleRequest(request, response).catch((error) => {
    if (!response.headersSent) sendJson(response, error.status || 500, { error: error.status ? error.message : 'Error interno del servidor.' })
    else response.destroy()
    if (!error.status) console.error(error)
  })
})

server.listen(port, process.env.HOST || '0.0.0.0', () => {
  console.log(`CertiTest API escuchando en http://127.0.0.1:${port}`)
})