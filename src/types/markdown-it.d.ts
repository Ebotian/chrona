declare module 'markdown-it' {
  export interface MarkdownItOptions {
    html?: boolean
    linkify?: boolean
    typographer?: boolean
    highlight?: (str: string, lang: string) => string
  }

  export interface MarkdownItStatic {
    utils: { escapeHtml: (input: string) => string }
    render: (source: string) => string
    use: (plugin: (md: MarkdownItStatic, options?: Record<string, unknown>) => void, options?: Record<string, unknown>) => MarkdownItStatic
  }

  export default class MarkdownIt implements MarkdownItStatic {
    constructor(options?: MarkdownItOptions)
    utils: { escapeHtml: (input: string) => string }
    render: (source: string) => string
    use: (plugin: (md: MarkdownItStatic, options?: Record<string, unknown>) => void, options?: Record<string, unknown>) => MarkdownItStatic
  }
}
