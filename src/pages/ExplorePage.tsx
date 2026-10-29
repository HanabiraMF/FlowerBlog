import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDown, Loader2, Search, SlidersHorizontal, X } from 'lucide-react'
import type { HomeData, Paginated, PostSummary, TagCount } from '../../shared/types'
import { api, errorMessage } from '../api'
import { FlowerMark } from '../components/Brand'
import { EmptyState } from '../components/Loading'
import { PostCard, PostCardSkeleton } from '../components/PostCard'
import { useToast } from '../context/ToastContext'
import { usePageTitle } from '../lib/usePageTitle'

export function ExplorePage() {
  usePageTitle('发现')
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const tag = params.get('tag') ?? ''
  const sort = params.get('sort') === 'popular' ? 'popular' : 'latest'
  const [search, setSearch] = useState(q)
  const [items, setItems] = useState<PostSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [tags, setTags] = useState<TagCount[]>([])
  const requestId = useRef(0)
  const { toast } = useToast()

  useEffect(() => {
    setSearch(q)
  }, [q])

  useEffect(() => {
    api
      .get<HomeData>('/api/home')
      .then((data) => setTags(data.tags))
      .catch(() => undefined)
  }, [])

  const fetchPage = useCallback(
    async (targetPage: number, append: boolean) => {
      const id = ++requestId.current
      if (append) setLoadingMore(true)
      else setLoading(true)
      try {
        const query = new URLSearchParams()
        query.set('page', String(targetPage))
        query.set('pageSize', '9')
        if (q) query.set('q', q)
        if (tag) query.set('tag', tag)
        if (sort === 'popular') query.set('sort', 'popular')
        const data = await api.get<Paginated<PostSummary>>(`/api/posts?${query.toString()}`)
        if (id !== requestId.current) return
        setItems((current) => (append ? [...current, ...data.items] : data.items))
        setTotal(data.total)
        setPage(data.page)
        setHasMore(data.hasMore)
      } catch (error) {
        if (id === requestId.current) toast(errorMessage(error), 'error')
      } finally {
        if (id === requestId.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [q, tag, sort, toast],
  )

  useEffect(() => {
    void fetchPage(1, false)
  }, [fetchPage])

  function updateParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace: false })
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    updateParams({ q: search.trim() || null })
  }

  function clearFilters() {
    setSearch('')
    setParams({}, { replace: false })
  }

  const hasFilters = Boolean(q || tag || sort === 'popular')

  return (
    <div className="explore-page">
      <section className="page-hero">
        <FlowerMark size={420} className="page-hero__flower" />
        <div className="container page-hero__inner">
          <span className="eyebrow">
            <span className="eyebrow__line" />
            WANDER & WONDER
          </span>
          <h1>在花园里，<em>随意走走</em>。</h1>
          <p>读一点生活，一点植物，一点关于如何把日子过得更慢的思考。</p>

          <form className="search-bar" onSubmit={submitSearch} role="search">
            <Search size={20} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索标题、内容或作者…"
              aria-label="搜索文章"
            />
            {search && (
              <button
                type="button"
                className="search-bar__clear"
                onClick={() => setSearch('')}
                aria-label="清空搜索"
              >
                <X size={16} />
              </button>
            )}
            <button type="submit" className="btn btn--primary btn--sm">
              寻找
            </button>
          </form>
        </div>
      </section>

      <section className="container explore-content">
        <div className="filter-row">
          <div className="tag-filter" aria-label="按主题筛选">
            <button
              type="button"
              className={`filter-chip ${!tag ? 'is-active' : ''}`}
              onClick={() => updateParams({ tag: null })}
            >
              全部
            </button>
            {tags.map((item) => (
              <button
                type="button"
                key={item.tag}
                className={`filter-chip ${tag === item.tag ? 'is-active' : ''}`}
                onClick={() => updateParams({ tag: tag === item.tag ? null : item.tag })}
              >
                {item.tag}
                <span>{item.count}</span>
              </button>
            ))}
          </div>
          <label className="sort-select">
            <SlidersHorizontal size={15} />
            <span className="sr-only">排序方式</span>
            <select
              value={sort}
              onChange={(event) =>
                updateParams({ sort: event.target.value === 'popular' ? 'popular' : null })
              }
            >
              <option value="latest">最新发布</option>
              <option value="popular">最多阅读</option>
            </select>
          </label>
        </div>

        <div className="results-head">
          <p>
            {loading ? '正在寻找…' : `找到 ${total} 篇文章`}
            {q && <>，关于「<strong>{q}</strong>」</>}
            {tag && <>，主题「<strong>#{tag}</strong>」</>}
          </p>
          {hasFilters && (
            <button type="button" className="text-link" onClick={clearFilters}>
              清除筛选
              <X size={14} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="post-grid">
            {Array.from({ length: 6 }, (_, index) => (
              <PostCardSkeleton key={index} />
            ))}
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="post-grid">
              {items.map((post, index) => (
                <PostCard key={post.id} post={post} index={index % 9} />
              ))}
            </div>
            {hasMore && (
              <div className="load-more">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => void fetchPage(page + 1, true)}
                  disabled={loadingMore}
                >
                  {loadingMore ? <Loader2 size={17} className="spin" /> : <ArrowDown size={17} />}
                  {loadingMore ? '正在生长…' : '让花园再展开一点'}
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="没有找到对应的花"
            description={
              hasFilters
                ? '换一个关键词或主题试试，也许有另一朵花正在等你。'
                : '花园里还没有公开的文章，成为第一个写作者吧。'
            }
            actionLabel={hasFilters ? '清除筛选' : '开始写作'}
            {...(hasFilters ? { onAction: clearFilters } : { actionTo: '/write' })}
          />
        )}

        <div className="explore-cta">
          <div>
            <span className="eyebrow eyebrow--light">HAVE SOMETHING TO SAY?</span>
            <h2>你的故事，也值得被看见。</h2>
          </div>
          <Link to="/write" className="btn btn--cream">
            写下此刻
          </Link>
        </div>
      </section>
    </div>
  )
}
