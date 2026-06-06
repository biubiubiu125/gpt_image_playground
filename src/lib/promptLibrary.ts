export const PROMPT_LIBRARY_CATEGORIES = [
  '全部',
  '人像摄影',
  '产品电商',
  '海报广告',
  '品牌包装',
  '社媒封面',
  '插画角色',
  '3D 与潮玩',
  '建筑室内',
  'UI 图标',
  '信息图表',
  '艺术风格',
  '通用模板',
] as const

export type PromptLibraryCategory = Exclude<(typeof PROMPT_LIBRARY_CATEGORIES)[number], '全部'>

export interface PromptLibraryPrompt {
  id: string
  title: string
  preview: string
  prompt?: string
  category: PromptLibraryCategory
  tags: string[]
  chunkId: string
  chunkIndex: number
  source?: string
  sourceUrl?: string
  coverUrl?: string
}

export interface PromptLibraryFullPrompt extends PromptLibraryPrompt {
  prompt: string
}

export interface PromptLibraryChunkDescriptor {
  id: string
  path: string
  count: number
}

export interface PromptLibraryManifest {
  manifestVersion: 2
  id: string
  name: string
  version: string
  updatedAt: string
  totalCount: number
  chunkSize: number
  chunks: PromptLibraryChunkDescriptor[]
  prompts: PromptLibraryPrompt[]
}

const PROMPT_LIBRARY_FILE = 'prompts/rk-text-image-prompts.json'
const PROMPT_LIBRARY_FETCH_OPTIONS: RequestInit = { cache: 'no-cache' }
const PROMPT_CHUNK_FETCH_OPTIONS: RequestInit = { cache: 'force-cache' }
const MAX_PROMPTS = 5000
const MAX_CHUNKS = 100
const MAX_TITLE_LENGTH = 80
const MAX_PROMPT_LENGTH = 4000
const MAX_PREVIEW_LENGTH = 260
const MAX_TAGS = 8
const MAX_TAG_LENGTH = 24
const DEFAULT_CHUNK_ID = 'legacy'
const VALID_CATEGORIES = new Set<string>(PROMPT_LIBRARY_CATEGORIES.filter((category) => category !== '全部'))
const TEXT_TO_IMAGE_BLOCKLIST = /uploaded image|reference image|reference photo|attached image|based on this image|based on.*photo|use this image|using this image|edit this|edit the image|change this image|turn this image|convert this image|transform this image|image[- ]?to[- ]?image|inpaint|masked area|\bmask\b|same person|same face|same hair identity|keep.*identity|retain.*identity|局部重绘|遮罩|参考图|参考照片|上传的图片|基于这张图|使用这张图|用此图|把这张|将这张图片|这张照片|图生图|保持原图|保持人物|保持.*一致|同一人物|この画像|この写真|この.*使って|画像.*使って|写真.*使って|入力画像|元画像/i
const CONTEXT_BLOCKLIST = /based on what you know about me|what you know about me|according to your knowledge of me|you know about me|my profile|diagnose|palm reading|fortune telling|根据你对我|你认识的我|我的认知|诊断|鉴定书|占卜|手相|生命线|智慧线|感情线|命运线/i
const SAFETY_BLOCKLIST = /porn|pornographic|explicit sex|sexualized|underage|minor girl|minor boy|schoolgirl|schoolboy|\bnude\b|\bnaked\b|nsfw|erotic|fetish|lingerie|bikini|gore|bloody gore|dismember|dead body|corpse|decapitat|suicide|self[- ]harm|尸体|肢解|血腥|色情|裸露|裸体|未成年|幼女|幼童|校服少女|情趣|内衣|比基尼|自残|自杀/i

let cachedPromptLibrary: Promise<PromptLibraryManifest> | null = null
const cachedChunks = new Map<string, Promise<PromptLibraryFullPrompt[]>>()
const cachedPrompts = new Map<string, PromptLibraryFullPrompt>()

function getPromptAssetUrl(path: string, version?: string) {
  const base = import.meta.env.BASE_URL || '/'
  const url = `${base.endsWith('/') ? base : `${base}/`}${path.replace(/^\/+/, '')}`
  return version ? `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}` : url
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return ''
  return value.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim().slice(0, maxLength)
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : fallback
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const tags: string[] = []
  for (const item of value) {
    const tag = normalizeString(item, MAX_TAG_LENGTH)
    if (!tag || seen.has(tag)) continue
    seen.add(tag)
    tags.push(tag)
    if (tags.length >= MAX_TAGS) break
  }
  return tags
}

function getPromptKey(prompt: string) {
  return prompt.replace(/\s+/g, ' ').toLocaleLowerCase()
}

function getPreview(value: unknown, fallback = '') {
  const preview = normalizeString(value, MAX_PREVIEW_LENGTH)
  if (preview) return preview
  return normalizeString(fallback, MAX_PREVIEW_LENGTH)
}

function passesPromptFilters(title: string, text: string, tags: string[]) {
  if (TEXT_TO_IMAGE_BLOCKLIST.test(text)) return false
  if (CONTEXT_BLOCKLIST.test(text)) return false
  if (SAFETY_BLOCKLIST.test([title, text, tags.join(' ')].join('\n'))) return false
  return true
}

function normalizePromptSummary(value: unknown): PromptLibraryPrompt | null {
  if (!isRecord(value)) return null

  const id = normalizeString(value.id, 64)
  const title = normalizeString(value.title, MAX_TITLE_LENGTH)
  const prompt = normalizeString(value.prompt, MAX_PROMPT_LENGTH)
  const preview = getPreview(value.preview, prompt)
  const category = normalizeString(value.category, 32)
  const tags = normalizeTags(value.tags)
  const chunkId = normalizeString(value.chunkId, 64) || DEFAULT_CHUNK_ID
  const chunkIndex = normalizePositiveInteger(value.chunkIndex, 0)
  const source = normalizeString(value.source, 40)
  const sourceUrl = normalizeString(value.sourceUrl, 300)
  const coverUrl = normalizeString(value.coverUrl, 300)
  const filterText = prompt || preview

  if (!id || !title || preview.length < 20) return null
  if (!VALID_CATEGORIES.has(category)) return null
  if (!passesPromptFilters(title, filterText, tags)) return null

  const item: PromptLibraryPrompt = {
    id,
    title,
    preview,
    ...(prompt ? { prompt } : {}),
    category: category as PromptLibraryCategory,
    tags,
    chunkId,
    chunkIndex,
    ...(source ? { source } : {}),
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(coverUrl ? { coverUrl } : {}),
  }

  if (prompt) cachedPrompts.set(id, item as PromptLibraryFullPrompt)
  return item
}

function normalizeFullPrompt(value: unknown, chunkId: string, chunkIndex: number): PromptLibraryFullPrompt | null {
  if (!isRecord(value)) return null

  const prompt = normalizeString(value.prompt, MAX_PROMPT_LENGTH)
  const summary = normalizePromptSummary({
    ...value,
    prompt,
    preview: getPreview(value.preview, prompt),
    chunkId,
    chunkIndex,
  })

  if (!summary?.prompt) return null
  return summary as PromptLibraryFullPrompt
}

function normalizeChunkDescriptor(value: unknown): PromptLibraryChunkDescriptor | null {
  if (!isRecord(value)) return null
  const id = normalizeString(value.id, 64)
  const path = normalizeString(value.path, 200)
  const count = normalizePositiveInteger(value.count, 0)
  if (!id || !path || count < 1) return null
  return { id, path, count }
}

function attachCachedPrompt(prompt: PromptLibraryPrompt) {
  const cached = cachedPrompts.get(prompt.id)
  return cached ? { ...prompt, prompt: cached.prompt } : prompt
}

function normalizeManifest(value: unknown): PromptLibraryManifest {
  if (!isRecord(value)) throw new Error('提示词库格式无效')

  const rawPrompts = Array.isArray(value.prompts) ? value.prompts : []
  const chunks = (Array.isArray(value.chunks) ? value.chunks : [])
    .map(normalizeChunkDescriptor)
    .filter((chunk): chunk is PromptLibraryChunkDescriptor => Boolean(chunk))
    .slice(0, MAX_CHUNKS)

  const seenIds = new Set<string>()
  const seenPrompts = new Set<string>()
  const prompts: PromptLibraryPrompt[] = []

  for (const item of rawPrompts) {
    const prompt = normalizePromptSummary(item)
    if (!prompt) continue

    const promptKey = prompt.prompt ? getPromptKey(prompt.prompt) : prompt.id
    if (seenIds.has(prompt.id) || seenPrompts.has(promptKey)) continue
    seenIds.add(prompt.id)
    seenPrompts.add(promptKey)
    prompts.push(attachCachedPrompt(prompt))
    if (prompts.length >= MAX_PROMPTS) break
  }

  if (chunks.length === 0 && prompts.some((prompt) => prompt.prompt)) {
    const fullPrompts = prompts.filter((prompt): prompt is PromptLibraryFullPrompt => Boolean(prompt.prompt))
    cachedChunks.set(DEFAULT_CHUNK_ID, Promise.resolve(fullPrompts))
    chunks.push({ id: DEFAULT_CHUNK_ID, path: PROMPT_LIBRARY_FILE, count: prompts.length })
  }

  return {
    manifestVersion: 2,
    id: normalizeString(value.id, 64) || 'rk-text-image-prompts',
    name: normalizeString(value.name, 64) || 'RK 文生图提示词库',
    version: normalizeString(value.version, 32) || 'local',
    updatedAt: normalizeString(value.updatedAt, 64) || '',
    totalCount: normalizePositiveInteger(value.totalCount, prompts.length),
    chunkSize: normalizePositiveInteger(value.chunkSize, 0),
    chunks,
    prompts,
  }
}

function normalizeChunk(value: unknown, chunk: PromptLibraryChunkDescriptor) {
  if (!isRecord(value)) throw new Error('提示词分片格式无效')
  const rawPrompts = Array.isArray(value.prompts) ? value.prompts : []
  const prompts: PromptLibraryFullPrompt[] = []

  for (const [index, item] of rawPrompts.entries()) {
    const prompt = normalizeFullPrompt(item, chunk.id, index)
    if (!prompt) continue
    cachedPrompts.set(prompt.id, prompt)
    prompts.push(prompt)
  }

  return prompts
}

function findPromptChunk(library: PromptLibraryManifest, item: PromptLibraryPrompt) {
  const chunk = library.chunks.find((candidate) => candidate.id === item.chunkId)
  if (!chunk) throw new Error('提示词分片不存在')
  return chunk
}

function getChunkCacheKey(library: PromptLibraryManifest, chunk: PromptLibraryChunkDescriptor) {
  return `${library.id}:${library.version}:${chunk.id}`
}

function waitForNextPreloadTurn() {
  return new Promise((resolve) => window.setTimeout(resolve, 80))
}

export async function loadPromptLibrary() {
  cachedPromptLibrary ??= fetch(getPromptAssetUrl(PROMPT_LIBRARY_FILE), PROMPT_LIBRARY_FETCH_OPTIONS)
    .then((response) => {
      if (!response.ok) throw new Error(`提示词库加载失败：${response.status}`)
      return response.json()
    })
    .then(normalizeManifest)
    .catch((err) => {
      cachedPromptLibrary = null
      throw err
    })

  const library = await cachedPromptLibrary
  const prompts = library.prompts.map(attachCachedPrompt)
  return prompts.some((prompt, index) => prompt !== library.prompts[index])
    ? { ...library, prompts }
    : library
}

export function mergePromptLibraryChunk(library: PromptLibraryManifest, prompts: PromptLibraryFullPrompt[]) {
  if (prompts.length === 0) return library

  const promptById = new Map(prompts.map((prompt) => [prompt.id, prompt]))
  let changed = false
  const mergedPrompts = library.prompts.map((prompt) => {
    const fullPrompt = promptById.get(prompt.id)
    if (!fullPrompt || prompt.prompt === fullPrompt.prompt) return prompt
    changed = true
    return { ...prompt, prompt: fullPrompt.prompt }
  })

  return changed ? { ...library, prompts: mergedPrompts } : library
}

export async function loadPromptLibraryChunk(library: PromptLibraryManifest, chunkId: string) {
  const chunk = library.chunks.find((candidate) => candidate.id === chunkId)
  if (!chunk) throw new Error('提示词分片不存在')

  const cacheKey = getChunkCacheKey(library, chunk)
  let promise = cachedChunks.get(cacheKey)
  if (!promise) {
    promise = fetch(getPromptAssetUrl(chunk.path, library.version), PROMPT_CHUNK_FETCH_OPTIONS)
      .then((response) => {
        if (!response.ok) throw new Error(`提示词分片加载失败：${response.status}`)
        return response.json()
      })
      .then((value) => normalizeChunk(value, chunk))
      .catch((err) => {
        cachedChunks.delete(cacheKey)
        throw err
      })
    cachedChunks.set(cacheKey, promise)
  }

  return promise
}

export async function loadPromptLibraryPrompt(library: PromptLibraryManifest, item: PromptLibraryPrompt) {
  if (item.prompt) return item as PromptLibraryFullPrompt

  const cached = cachedPrompts.get(item.id)
  if (cached) return cached

  const chunk = findPromptChunk(library, item)
  const prompts = await loadPromptLibraryChunk(library, chunk.id)
  const prompt = prompts.find((candidate) => candidate.id === item.id)
  if (!prompt) throw new Error('提示词内容不存在')
  return prompt
}

export async function preloadPromptLibraryChunks(
  library: PromptLibraryManifest,
  onChunk: (prompts: PromptLibraryFullPrompt[]) => void,
  signal?: AbortSignal,
) {
  for (const chunk of library.chunks) {
    if (signal?.aborted) return
    const prompts = await loadPromptLibraryChunk(library, chunk.id)
    if (signal?.aborted) return
    onChunk(prompts)
    await waitForNextPreloadTurn()
  }
}
