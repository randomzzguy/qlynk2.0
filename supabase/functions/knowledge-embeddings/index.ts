import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const MODEL_NAME = 'gte-small@1'
const MODEL_DIMENSIONS = 384
const MAX_INPUTS = 16
const MAX_INPUT_CHARS = 4_000

const model = new Supabase.ai.Session('gte-small')

function json(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const embeddingSecret = Deno.env.get('KNOWLEDGE_EMBEDDINGS_SECRET')
  const apiKey = request.headers.get('apikey')
  if (!embeddingSecret || apiKey !== embeddingSecret) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let body: { inputs?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (!Array.isArray(body.inputs) || body.inputs.length < 1 || body.inputs.length > MAX_INPUTS) {
    return json({ error: `Provide 1-${MAX_INPUTS} text inputs` }, 400)
  }

  const inputs = body.inputs.map((value) => typeof value === 'string' ? value.trim() : '')
  if (inputs.some((value) => !value || value.length > MAX_INPUT_CHARS)) {
    return json({ error: `Each input must contain 1-${MAX_INPUT_CHARS} characters` }, 400)
  }

  try {
    const embeddings: number[][] = []
    for (const input of inputs) {
      const output = await model.run(input, { mean_pool: true, normalize: true })
      if (!Array.isArray(output) || output.length !== MODEL_DIMENSIONS) {
        throw new Error('Embedding model returned an unexpected dimension')
      }
      embeddings.push(output as number[])
    }

    return json({
      model: MODEL_NAME,
      dimensions: MODEL_DIMENSIONS,
      embeddings,
    })
  } catch (error) {
    console.error('[Knowledge Embeddings] Inference failed:', error)
    return json({ error: 'Embedding generation failed' }, 503)
  }
})
