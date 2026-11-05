'use client'

import { DownOutlined } from '@ant-design/icons'

const DESAY_BRAND_LOGO = '/desay-sv-logo.png'

type BrandBlockProps = {
  collapsed: boolean
}

export function BrandBlock({ collapsed }: BrandBlockProps) {
  if (collapsed) {
    return (
      <div className="brand brand--collapsed">
        <img
          src={DESAY_BRAND_LOGO}
          alt="DESAY SV"
          className="brand-logo-mark"
          decoding="async"
        />
      </div>
    )
  }

  return (
    <div className="brand">
      <div className="brand-grid">
        <div className="brand-stack">
          <div className="brand-title-row">
            <div className="brand-logo-wrap">
              <img
                src={DESAY_BRAND_LOGO}
                alt="DESAY SV"
                className="brand-logo"
                width={186}
                height={40}
                decoding="async"
              />
            </div>
            <span className="brand-product-cn">前瞻技术扫描平台</span>
          </div>
          <div className="brand-product-row">
            <span className="brand-product">EEA Foresight Agent Platform</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function WorkspacePill({ collapsed }: BrandBlockProps) {
  return (
    <div
      className={`workspace-pill${collapsed ? ' is-collapsed' : ''}`}
      aria-label="当前工作空间：技术战略研究组"
    >
      {collapsed ? (
        <span className="workspace-initials" aria-hidden>研</span>
      ) : (
        <>
          <div className="workspace-pill-copy">
            <span className="workspace-label">当前工作空间</span>
            <span className="workspace-name">技术战略研究组</span>
          </div>
          <DownOutlined className="workspace-chevron" aria-hidden />
        </>
      )}
    </div>
  )
}
