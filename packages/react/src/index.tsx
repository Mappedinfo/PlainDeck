import type { CSSProperties, FocusEvent, ReactEventHandler, ReactNode } from 'react'
import {
  elementFrameStyle,
  footerPresentation,
  imageContentStyle,
  lineContentStyle,
  shapeContentStyle,
  shapeLabelStyle,
  slideStyle,
  textContentStyle,
} from 'plaindeck/render'
import type { DeckDocument, SlideElement } from 'plaindeck/core'

const css = (value: Record<string, string | number | undefined>): CSSProperties => value as CSSProperties

export interface PlainDeckElementContentProps {
  element: SlideElement
  theme: DeckDocument['theme']
  resolveAsset?: (src: string, element: Extract<SlideElement, { type: 'image' }>) => string
  editable?: boolean
  onTextCommit?: (text: string) => void
  onImageError?: ReactEventHandler<HTMLImageElement>
  placeholder?: ReactNode
}

export function PlainDeckElementContent({ element, theme, resolveAsset = src => src, editable = false, onTextCommit, onImageError, placeholder }: PlainDeckElementContentProps) {
  const commit = (event: FocusEvent<HTMLElement>, current: string) => {
    const next = event.currentTarget.innerText
    if (next !== current) onTextCommit?.(next)
  }
  if (element.type === 'text') return <div className={`text-content editable-content ${element.styleRef ?? ''}`} style={css(textContentStyle(element, theme))} contentEditable={editable} suppressContentEditableWarning onBlur={event => commit(event, element.text)}><span>{element.text}</span></div>
  if (element.type === 'image') {
    if (element.src === 'placeholder:image') return <div className="image-placeholder" style={{ width: '100%', height: '100%', display: 'grid', placeContent: 'center', justifyItems: 'center', gap: 12, border: '3px dashed currentColor', color: theme.colors.text, opacity: .52 }}>{placeholder ?? <><strong>IMAGE</strong><span>图片占位</span></>}</div>
    return <img src={resolveAsset(element.src, element)} alt={element.alt ?? ''} draggable={false} style={css(imageContentStyle(element))} onError={onImageError} />
  }
  if (element.type === 'shape') return <div className="shape-content" style={css(shapeContentStyle(element))}><div className="shape-label editable-content" style={css(shapeLabelStyle(element, theme))} contentEditable={editable} suppressContentEditableWarning onBlur={event => commit(event, element.text ?? '')}><span>{element.text ?? ''}</span></div></div>
  return <div className="line-content" style={css(lineContentStyle(element))}>{element.arrowEnd && <span aria-hidden style={{ position: 'absolute', right: -1, top: -element.strokeWidth * 2 - 3, width: 0, height: 0, borderLeft: `${element.strokeWidth * 4}px solid ${element.color}`, borderTop: `${element.strokeWidth * 2 + 3}px solid transparent`, borderBottom: `${element.strokeWidth * 2 + 3}px solid transparent` }} />}</div>
}

export interface PlainDeckElementProps extends PlainDeckElementContentProps {
  className?: string
  style?: CSSProperties
}

export function PlainDeckElement({ element, className = '', style, ...contentProps }: PlainDeckElementProps) {
  return <div className={`slide-element ${className}`.trim()} data-element-id={element.id} data-element-type={element.type} style={{ ...css(elementFrameStyle(element)), ...style }}><PlainDeckElementContent element={element} {...contentProps} /></div>
}

export function PlainDeckFooter({ document, slidePath, date }: { document: DeckDocument; slidePath: string; date?: Date | string }) {
  const footer = footerPresentation(document, slidePath, date)
  if (!footer) return null
  return <footer className="slide-footer" style={css(footer.style)}><span>{footer.values[0]}</span><span style={{ textAlign: 'center' }}>{footer.values[1]}</span><span style={{ textAlign: 'right' }}>{footer.values[2]}</span></footer>
}

export interface PlainDeckSlideProps {
  document: DeckDocument
  slidePath: string
  resolveAsset?: PlainDeckElementContentProps['resolveAsset']
  className?: string
  style?: CSSProperties
  elementStyle?: (element: SlideElement) => CSSProperties | undefined
  date?: Date | string
}

export function PlainDeckSlide({ document, slidePath, resolveAsset, className = '', style, elementStyle, date }: PlainDeckSlideProps) {
  const slide = document.slides[slidePath]
  if (!slide) throw new Error(`页面不存在：${slidePath}`)
  return <section className={`plaindeck-slide slide ${className}`.trim()} data-slide-path={slidePath} aria-label={slide.name ?? slide.id} style={{ ...css(slideStyle(document, slidePath)), ...style }}>
    {slide.elements.map(element => <PlainDeckElement key={element.id} element={element} theme={document.theme} resolveAsset={resolveAsset} style={elementStyle?.(element)} />)}
    <PlainDeckFooter document={document} slidePath={slidePath} date={date} />
  </section>
}
