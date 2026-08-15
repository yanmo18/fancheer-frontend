const SITE_NAME = 'Fancheer'
const DEFAULT_DESCRIPTION = 'Fancheer 博主个人展示站 — 作品展示、音乐、活动与轻量社区互动。'

function upsertMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  if (!content) return
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.content = content
}

export function setPageMeta(options: {
  title?: string
  description?: string
  path?: string
}) {
  const pageTitle = options.title
    ? options.title.includes(SITE_NAME)
      ? options.title
      : `${options.title} · ${SITE_NAME}`
    : `${SITE_NAME} · 博主个人展示站`

  const description = options.description || DEFAULT_DESCRIPTION

  document.title = pageTitle
  upsertMeta('description', description)
  upsertMeta('og:title', pageTitle, 'property')
  upsertMeta('og:description', description, 'property')
  upsertMeta('og:type', 'website', 'property')

  if (options.path) {
    const url = `${window.location.origin}${options.path}`
    upsertMeta('og:url', url, 'property')
  }
}

export { DEFAULT_DESCRIPTION, SITE_NAME }
