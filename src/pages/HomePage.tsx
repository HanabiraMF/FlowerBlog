import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BookOpen, Feather, MessageCircle, Sparkles } from 'lucide-react'
import type { HomeData } from '../../shared/types'
import { api, errorMessage } from '../api'
import { Avatar } from '../components/Avatar'
import { FlowerMark } from '../components/Brand'
import { EmptyState, InlineLoader } from '../components/Loading'
import { PostCard, PostCardSkeleton } from '../components/PostCard'
import { useAuth } from '../context/AuthContext'
import { useSite } from '../context/SiteContext'
import { useToast } from '../context/ToastContext'
import { formatNumber } from '../lib/format'
import { usePageTitle } from '../lib/usePageTitle'

export function HomePage() {
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { site } = useSite()
  const { toast } = useToast()
  usePageTitle()

  useEffect(() => {
    let alive = true
    api
      .get<HomeData>('/api/home')
      .then((result) => {
        if (alive) setData(result)
      })
      .catch((error) => toast(errorMessage(error), 'error'))
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [toast])

  const featured = data?.featured ?? null
  const authors = Array.from(
    new Map((data?.latest ?? []).map((post) => [post.author.id, post.author])).values(),
  ).slice(0, 4)

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__grain" aria-hidden="true" />
        <FlowerMark size={560} className="hero__botanical" />
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="eyebrow">
              <span className="eyebrow__dot" />
              A GARDEN OF WORDS
            </span>
            <h1>
              把日子写成
              <br />
              <em>一朵花</em>的形状。
            </h1>
            <p className="hero__lead">{site.description}</p>
            <div className="hero__actions">
              <Link to="/explore" className="btn btn--primary">
                <BookOpen size={17} />
                去花园走走
              </Link>
              <Link to={user ? '/write' : '/register'} className="btn btn--ghost">
                <Feather size={17} />
                {user ? '写下此刻' : '成为作者'}
              </Link>
            </div>
            <div className="hero__proof">
              <div className="avatar-stack" aria-hidden="true">
                {authors.map((author) => (
                  <Avatar
                    key={author.id}
                    name={author.username}
                    src={author.avatarUrl}
                    size="sm"
                  />
                ))}
                {authors.length === 0 && <Avatar name="花" size="sm" />}
              </div>
              <p>
                <strong>{formatNumber(data?.stats.posts ?? 0)}</strong> 篇文字，来自{' '}
                <strong>{formatNumber(data?.stats.writers ?? 0)}</strong> 位写作者
                <span className="hero__proof-sub">
                  <MessageCircle size={13} /> {formatNumber(data?.stats.comments ?? 0)} 次温柔回应
                </span>
              </p>
            </div>
          </div>

          <div className="hero__visual">
            <span className="hero__halo" aria-hidden="true" />
            {featured ? (
              <Link to={`/post/${featured.slug}`} className="hero-feature">
                <div className="hero-feature__image">
                  {featured.coverUrl ? (
                    <img src={featured.coverUrl} alt="" />
                  ) : (
                    <div className="cover-fallback">
                      <FlowerMark size={70} />
                    </div>
                  )}
                  <span className="hero-feature__chip">
                    <Sparkles size={13} />
                    本周精选
                  </span>
                </div>
                <div className="hero-feature__body">
                  <div className="hero-feature__tags">
                    {featured.tags.slice(0, 2).map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                    <span className="hero-feature__read">{featured.readingMinutes} min</span>
                  </div>
                  <h2>{featured.title}</h2>
                  <p>{featured.excerpt}</p>
                  <div className="hero-feature__foot">
                    <span className="byline">
                      <Avatar
                        name={featured.author.username}
                        src={featured.author.avatarUrl}
                        size="sm"
                      />
                      {featured.author.username}
                    </span>
                    <span className="circle-arrow">
                      <ArrowUpRight size={17} />
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="hero-feature hero-feature--empty">
                <FlowerMark size={64} />
                <h2>第一朵花，等你来种</h2>
                <p>注册账号，写下 FlowerBlog 的第一篇文章。</p>
                <Link to={user ? '/write' : '/register'} className="btn btn--primary btn--sm">
                  开始写作
                </Link>
              </div>
            )}
            <div className="hero__note">
              <span className="hero__note-flower">
                <FlowerMark size={25} />
              </span>
              <p>“慢一点也没关系，花有花的时间。”</p>
            </div>
            <div className="hero__scribble" aria-hidden="true">
              <svg viewBox="0 0 140 70" fill="none">
                <path
                  d="M4 48C32 16 55 12 63 34c8 22 17 17 29 2 10-13 25-17 44-8"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
                <path d="M126 17l10 11-14 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {data && data.tags.length > 0 && (
          <div className="hero__ticker">
            <div className="container hero__ticker-inner">
              <span className="hero__ticker-label">此刻开花</span>
              <div className="hero__ticker-tags">
                {data.tags.slice(0, 8).map((tag) => (
                  <Link key={tag.tag} to={`/explore?tag=${encodeURIComponent(tag.tag)}`}>
                    #{tag.tag}
                    <span>{tag.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="section container latest-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">
              <span className="eyebrow__line" />
              FRESH FROM THE GARDEN
            </span>
            <h2>最近的花信</h2>
          </div>
          <Link to="/explore" className="text-link">
            浏览全部
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="post-grid">
            {Array.from({ length: 3 }, (_, index) => (
              <PostCardSkeleton key={index} />
            ))}
          </div>
        ) : data && data.latest.length > 0 ? (
          <div className="post-grid">
            {data.latest.map((post, index) => (
              <PostCard post={post} key={post.id} index={index} />
            ))}
            {data.latest.length < 6 && (
              <Link to="/explore" className="latest-cta-tile">
                <FlowerMark size={44} />
                <span className="eyebrow">KEEP WANDERING</span>
                <h3>
                  还有更多，
                  <br />
                  在花园深处。
                </h3>
                <span className="latest-cta-tile__link">
                  浏览全部文章
                  <ArrowRight size={16} />
                </span>
              </Link>
            )}
          </div>
        ) : (
          <EmptyState
            icon={<Feather size={28} />}
            title="花园正在等待第一颗种子"
            description="这里还没有公开的文章。成为第一个写作者，让这片园地开始生长。"
            actionLabel={user ? '写第一篇文章' : '注册成为作者'}
            actionTo={user ? '/write' : '/register'}
          />
        )}
      </section>

      <section className="section container notes-section">
        <div className="notes-quote">
          <FlowerMark size={80} className="notes-quote__flower" />
          <span className="eyebrow eyebrow--light">A NOTE FROM THE GARDEN</span>
          <blockquote>
            我们相信，好的文字不必喧哗。它更像一粒种子，在合适的时候，
            <em>安静地长出枝叶。</em>
          </blockquote>
          <div className="notes-quote__sign">
            <span className="notes-quote__line" />
            <span>{site.siteName} · 写给每一位路过的人</span>
          </div>
          <div className="notes-quote__petals" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="notes-side">
          <div className="notes-side__head">
            <div>
              <span className="eyebrow">
                <span className="eyebrow__line" />
                MOST READ
              </span>
              <h2>被反复翻开的文字</h2>
            </div>
            <Link to="/explore?sort=popular" className="text-link">
              更多
              <ArrowRight size={15} />
            </Link>
          </div>
          {loading ? (
            <InlineLoader />
          ) : data && data.trending.length > 0 ? (
            <ol className="trending-list">
              {data.trending.map((post, index) => (
                <li key={post.id}>
                  <span className="trending-list__index">0{index + 1}</span>
                  <div>
                    <Link to={`/post/${post.slug}`}>{post.title}</Link>
                    <span>
                      {post.author.username} · {formatNumber(post.views)} 次阅读
                    </span>
                  </div>
                  <ArrowUpRight size={16} />
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">还没有阅读记录，先去种下一篇文章吧。</p>
          )}
        </div>
      </section>

      {data && data.tags.length > 0 && (
        <section className="section container tag-section">
          <div className="tag-section__head">
            <span className="eyebrow">
              <span className="eyebrow__line" />
              WANDER BY TOPIC
            </span>
            <h2>循着喜欢的方向，走进花园深处</h2>
          </div>
          <div className="tag-cloud">
            {data.tags.map((tag, index) => (
              <Link
                key={tag.tag}
                to={`/explore?tag=${encodeURIComponent(tag.tag)}`}
                className="tag-cloud__item"
                style={{ ['--tag-size' as string]: `${index % 3 === 0 ? 1.35 : index % 2 === 0 ? 1.08 : 0.92}` }}
              >
                <span>#</span>
                {tag.tag}
                <small>{tag.count}</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container join-section">
        <div className="join-card">
          <div className="join-card__copy">
            <span className="eyebrow eyebrow--light">YOUR PATCH OF SOIL</span>
            <h2>
              也在这里，
              <br />
              种下你的<em>第一朵花</em>。
            </h2>
            <p>注册一个账号，写下第一篇文字。不一定要写得很好，真诚就足够。</p>
            <div className="join-card__actions">
              <Link to={user ? '/write' : '/register'} className="btn btn--cream">
                <Feather size={17} />
                {user ? '开始写作' : '创建我的账号'}
              </Link>
              <Link to="/about" className="btn btn--outline-cream">
                了解这座花园
              </Link>
            </div>
          </div>
          <div className="join-card__visual" aria-hidden="true">
            <FlowerMark size={300} />
            <span className="join-card__ring" />
            <span className="join-card__ring join-card__ring--2" />
          </div>
        </div>
      </section>
    </div>
  )
}
