import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { Brand, FlowerMark } from './Brand'

export function Footer() {
  const { site } = useSite()
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <FlowerMark size={340} className="site-footer__watermark" />
      <div className="container">
        <div className="footer__top">
          <div className="footer__intro">
            <Brand light />
            <p>{site.footerText}</p>
            <span className="footer__badge">种花 · 写字 · 慢慢生活</span>
          </div>

          <div className="footer__columns">
            <div className="footer__column">
              <h4>漫游</h4>
              <Link to="/">首页</Link>
              <Link to="/explore">发现文章</Link>
              <Link to="/about">关于花园</Link>
            </div>
            <div className="footer__column">
              <h4>书写</h4>
              <Link to="/write">开始写作</Link>
              <Link to="/dashboard">创作台</Link>
              <Link to="/register">成为作者</Link>
            </div>
            <div className="footer__column">
              <h4>主题</h4>
              <Link to="/explore?tag=生活">生活方式</Link>
              <Link to="/explore?tag=植物">植物手记</Link>
              <Link to="/explore?tag=阅读">阅读与书</Link>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span>
            © {year} {site.siteName}. 文字都有归处。
          </span>
          <span className="footer__tech">
            Built with care on Cloudflare
            <ArrowUpRight size={13} />
          </span>
        </div>
      </div>
    </footer>
  )
}
