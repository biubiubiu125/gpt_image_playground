import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  loadPromptLibrary,
  loadPromptLibraryPrompt,
  mergePromptLibraryChunk,
  preloadPromptLibraryChunks,
  PROMPT_LIBRARY_CATEGORIES,
  type PromptLibraryManifest,
  type PromptLibraryPrompt,
} from '../lib/promptLibrary'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'
import { usePreventBackgroundScroll } from '../hooks/usePreventBackgroundScroll'
import { BookOpenIcon, CloseIcon } from './icons'

type PromptLibraryModalProps = {
  onClose: () => void
  onUsePrompt: (prompt: string) => void
}

const PAGE_SIZE = 80

function getPromptSearchText(prompt: PromptLibraryPrompt) {
  return [
    prompt.title,
    prompt.category,
    prompt.tags.join(' '),
    prompt.prompt ?? prompt.preview,
  ].join('\n').toLocaleLowerCase()
}

function getCategoryCount(prompts: PromptLibraryPrompt[], category: string) {
  if (category === '全部') return prompts.length
  return prompts.filter((prompt) => prompt.category === category).length
}

export default function PromptLibraryModal({ onClose, onUsePrompt }: PromptLibraryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const isMountedRef = useRef(true)
  const [library, setLibrary] = useState<PromptLibraryManifest | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const [selectedTag, setSelectedTag] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loadingPromptId, setLoadingPromptId] = useState('')

  useCloseOnEscape(true, onClose)
  usePreventBackgroundScroll(true, modalRef)

  useEffect(() => () => {
    isMountedRef.current = false
  }, [])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    loadPromptLibrary()
      .then((data) => {
        if (cancelled) return
        setLibrary(data)
        void preloadPromptLibraryChunks(data, (chunkPrompts) => {
          if (cancelled || controller.signal.aborted) return
          setLibrary((current) => current ? mergePromptLibraryChunk(current, chunkPrompts) : current)
        }, controller.signal).catch((err) => {
          if (!controller.signal.aborted) console.warn('Prompt library preload failed', err)
        })
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [])

  const prompts = library?.prompts ?? []
  const tags = useMemo(() => {
    const counts = new Map<string, number>()
    prompts.forEach((prompt) => {
      prompt.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      })
    })
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
      .slice(0, 32)
  }, [prompts])

  const filteredPrompts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return prompts.filter((prompt) => {
      if (category !== '全部' && prompt.category !== category) return false
      if (selectedTag && !prompt.tags.includes(selectedTag)) return false
      if (!normalizedQuery) return true
      return getPromptSearchText(prompt).includes(normalizedQuery)
    })
  }, [category, prompts, query, selectedTag])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [category, query, selectedTag])

  const visiblePrompts = filteredPrompts.slice(0, visibleCount)
  const hasMorePrompts = visibleCount < filteredPrompts.length

  const handleUsePrompt = async (item: PromptLibraryPrompt) => {
    if (!library || loadingPromptId) return
    setLoadingPromptId(item.id)
    try {
      const fullPrompt = await loadPromptLibraryPrompt(library, item)
      if (!isMountedRef.current) return
      setLibrary((current) => current ? mergePromptLibraryChunk(current, [fullPrompt]) : current)
      onUsePrompt(fullPrompt.prompt)
      setLoadingPromptId('')
      onClose()
    } catch (err) {
      if (!isMountedRef.current) return
      setError(err instanceof Error ? err.message : String(err))
      setLoadingPromptId('')
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-3 py-4 backdrop-blur-sm sm:px-6">
      <div
        ref={modalRef}
        className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl ring-1 ring-black/5 dark:border-white/[0.08] dark:bg-gray-950 dark:ring-white/10"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/[0.08] sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-300">
              <BookOpenIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">提示词库</h2>
              <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                {library ? `${library.prompts.length} 条文生图提示词` : '内置官方文生图提示词'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.08] dark:hover:text-gray-200"
            aria-label="关闭提示词库"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-[220px_1fr]">
          <aside className="border-b border-gray-100 bg-gray-50/60 p-3 dark:border-white/[0.08] dark:bg-white/[0.03] sm:border-b-0 sm:border-r">
            <div className="mb-3">
              <label className="relative block">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索标题、标签、内容"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:border-white/[0.08] dark:bg-gray-900 dark:text-gray-100"
                />
              </label>
            </div>

            <div className="custom-scrollbar max-h-[24vh] overflow-y-auto pr-1 sm:max-h-[calc(88vh-170px)]">
              <div className="mb-4">
                <div className="mb-1.5 px-1 text-[11px] font-medium text-gray-400 dark:text-gray-500">分类</div>
                <div className="space-y-1">
                  {PROMPT_LIBRARY_CATEGORIES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setCategory(item)
                        setSelectedTag('')
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition ${
                        category === item
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300'
                          : 'text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-gray-100'
                      }`}
                    >
                      <span className="truncate">{item}</span>
                      <span className="shrink-0 rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] text-gray-400 dark:bg-white/[0.06] dark:text-gray-500">
                        {getCategoryCount(prompts, item)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {tags.length > 0 && (
                <div>
                  <div className="mb-1.5 px-1 text-[11px] font-medium text-gray-400 dark:text-gray-500">热门标签</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(([tag, count]) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag((current) => current === tag ? '' : tag)}
                        className={`rounded-full px-2.5 py-1 text-[11px] transition ${
                          selectedTag === tag
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:bg-white/[0.06] dark:text-gray-400 dark:hover:bg-white/[0.1] dark:hover:text-gray-200'
                        }`}
                      >
                        {tag} {count}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          <main className="min-h-0 overflow-hidden">
            <div className="flex h-full flex-col">
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-2.5 text-xs text-gray-400 dark:border-white/[0.08] dark:text-gray-500">
                <span>{error ? '加载失败' : `匹配 ${filteredPrompts.length} 条`}</span>
                {(selectedTag || category !== '全部' || query.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setCategory('全部')
                      setSelectedTag('')
                    }}
                    className="rounded-lg px-2 py-1 text-blue-500 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10"
                  >
                    重置筛选
                  </button>
                )}
              </div>

              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                {!library && !error && (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                    正在加载提示词库...
                  </div>
                )}

                {error && (
                  <div className="flex h-full items-center justify-center text-sm text-red-500">
                    {error}
                  </div>
                )}

                {library && filteredPrompts.length === 0 && (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                    没有匹配的提示词
                  </div>
                )}

                {filteredPrompts.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {visiblePrompts.map((item) => (
                        <article
                          key={item.id}
                          className="flex min-h-[190px] flex-col rounded-lg border border-gray-200/70 bg-white p-3 shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-blue-400/40"
                        >
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                                  {item.category}
                                </span>
                                {item.tags.slice(0, 4).map((tag) => (
                                  <span key={tag} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-500 dark:bg-blue-500/10 dark:text-blue-300">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="line-clamp-[7] min-h-0 flex-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                            {item.prompt ?? item.preview}
                          </p>
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => void handleUsePrompt(item)}
                              disabled={Boolean(loadingPromptId)}
                              className="rounded-xl bg-blue-500 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-wait disabled:opacity-70"
                            >
                              {loadingPromptId === item.id ? '加载中...' : '使用此提示词'}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                    {hasMorePrompts && (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
                          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:border-blue-400/40 dark:hover:text-blue-300"
                        >
                          加载更多
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
