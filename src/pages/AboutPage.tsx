import { Link } from 'react-router-dom'
import { ArrowUpRight, Feather, Flower2, Heart, Leaf, PenTool } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSite } from '../context/SiteContext'
import { Markdown } from '../components/Markdown'
import { FlowerMark } from '../components/Brand'
import { usePageTitle } from '../lib/usePageTitle'

const values = [
  {
    icon: <Feather size={22} />,
    title: '真诚地写',
    text: '不追逐热点，不表演生活。只写那些真正经过心里的事，哪怕它很小、很慢。',
  },
  {
    icon: <Leaf size={22} />,
    title: '慢慢地长',
    text: '允许一篇文章写很久，允许一个想法暂时没有答案。生长本来就急不得。',
  },
  {
    icon: <Heart size={22} />,
    title: '温柔地回应',
    text: '每一次评论都是一次相遇。尊重不同的声音，也保护彼此表达的空间。',
  },
]

export function AboutPage() {
  const { site } = useSite()
  const { user } = useAuth()
  usePageTitle('关于')

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container about-hero__inner">
          <div className="about-hero__copy">
            <span className="eyebrow">
              <span className="eyebrow__dot" />
              ABOUT THE GARDEN
            </span>
            <h1>
              一座为文字
              <br />
              留出的<em>花园</em>。
            </h1>
            <p>{site.description}</p>
            <div className="about-hero__meta">
              <span>
                <Flower2 size={15} /> {site.siteName}
              </span>
              <span>
                <PenTool size={15} /> 由文字与耐心浇灌
              </span>
            </div>
          </div>
          <div className="about-hero__art">
            <div className="about-hero__frame">
              <img src="/demo/cover-room.svg" alt="窗边的植物与花" />
            </div>
            <span className="about-hero__stamp">
              <FlowerMark size={42} />
              <em>est. 2026</em>
            </span>
            <span className="about-hero__caption">a room for flowers & words</span>
          </div>
        </div>
      </section>

      <section className="container about-body">
        <aside className="about-aside">
          <span className="eyebrow">OUR LITTLE RULES</span>
          <h2>花园里的<br />三件小事</h2>
          <p>如果你愿意在这里停留，希望这些小小的默契，能让彼此都更自在一点。</p>
          {user?.role === 'admin' && (
            <Link to="/admin/settings" className="text-link">
              编辑关于页面
              <ArrowUpRight size={14} />
            </Link>
          )}
          <div className="about-aside__flower">
            <FlowerMark size={110} />
          </div>
        </aside>

        <div className="about-content">
          {site.aboutBody ? (
            <Markdown content={site.aboutBody} />
          ) : (
            <div className="prose">
              <h2>这是一座怎样的花园？</h2>
              <p>
                {site.siteName} 是一个为写作者准备的小小花园。我们相信，好的文字不必喧哗，它更像一粒种子，在合适的时候，安静地长出枝叶。
              </p>
              <p>你可以读一篇短文，留下一句回应，或者注册一个账号，在这里种下属于自己的第一朵花。</p>
              <blockquote>慢一点也没关系，花有花的时间。</blockquote>
            </div>
          )}

          <div className="about-values">
            {values.map((value) => (
              <div className="about-value" key={value.title}>
                <span className="about-value__icon">{value.icon}</span>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </div>
            ))}
          </div>

          <div className="about-quote">
            <FlowerMark size={44} />
            <p>
              “愿你在这里，读到喜欢的句子，
              <br />
              也写下属于自己的那一段。”
            </p>
            <span>— {site.siteName}</span>
          </div>

          <div className="about-cta">
            <div>
              <h3>准备好了吗？</h3>
              <p>带着你的故事，来花园里坐坐。</p>
            </div>
            <div className="about-cta__actions">
              <Link to="/explore" className="btn btn--ghost btn--sm">
                先随便看看
              </Link>
              <Link to={user ? '/write' : '/register'} className="btn btn--primary btn--sm">
                {user ? '开始写作' : '成为作者'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
