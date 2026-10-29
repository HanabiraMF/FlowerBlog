import { Link } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { FlowerMark } from '../components/Brand'
import { usePageTitle } from '../lib/usePageTitle'

export function NotFoundPage() {
  usePageTitle('页面不存在')
  return (
    <div className="not-found container">
      <div className="not-found__art">
        <FlowerMark size={150} />
        <span>404</span>
      </div>
      <span className="eyebrow">
        <span className="eyebrow__line" />
        A PATH THAT DOESN'T BLOOM
      </span>
      <h1>这条小径，还没有开花。</h1>
      <p>你寻找的页面可能已经被移走，或者从来不存在。不如换一条路，在花园里继续走走。</p>
      <div className="not-found__actions">
        <Link to="/" className="btn btn--primary">
          <ArrowLeft size={16} />
          回到首页
        </Link>
        <Link to="/explore" className="btn btn--ghost">
          <Search size={16} />
          去寻找文章
        </Link>
      </div>
    </div>
  )
}
