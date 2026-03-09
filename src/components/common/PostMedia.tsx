import React from 'react'
import { parse, replaceAmpGTLT } from 'utils'

const redditPreview_regexpString_base = 'https://preview\\.redd\\.it/'
const redditPreview_regexpString_withParen =
  redditPreview_regexpString_base + '[^\\s]+'
const redditPreview_regexpString_noParen =
  redditPreview_regexpString_base + '([^.]+)\\.[^)\\s]+'
const splitOnPreview_regexp = new RegExp(
  '((?:\\[[^\\]]*\\]\\()?' + redditPreview_regexpString_withParen + ')'
)
const maxWidthInsideSelftextBox = 835
const calculateMaxImageSizeForScreen = () => window.innerWidth - 40

export const Selftext = ({ selftext, media_metadata }) => {
  if (media_metadata) {
    return <SelftextInParts {...{ selftext, media_metadata }} />
  } else {
    return <SelftextPart selftext={selftext} />
  }
}

const SelftextPart = ({ selftext, ..._rest }: any) => (
  <div dangerouslySetInnerHTML={{ __html: parse(selftext) }} />
)

const SelftextInParts = ({ selftext, media_metadata }) => {
  const selftextParts = selftext.split(splitOnPreview_regexp)
  const result = []
  const maxImageSizeForScreen = calculateMaxImageSizeForScreen()
  const maxWidth = Math.min(maxImageSizeForScreen, maxWidthInsideSelftextBox)
  for (const [i, part] of selftextParts.entries()) {
    const match = part.match(
      new RegExp(
        '(?:\\[([^\\]]*)\\]\\()?(' + redditPreview_regexpString_noParen + ')'
      )
    )
    if (match) {
      const [, caption, _url, id] = match
      const list = getImageList({ media_metadata, id })
      if (list) {
        const marginTop = caption ? '' : '5px'
        result.push(
          <div key={i} style={{ textAlign: 'center', marginTop }}>
            {caption && <h4>{caption}</h4>}
            <BestImage key={i} list={list} maxWidth={maxWidth} />
          </div>
        )
      }
      continue
    }
    result.push(<SelftextPart key={i} selftext={part} />)
  }
  return result
}

export const getImageList = ({ media_metadata, id }) => {
  if (media_metadata && id) {
    const imageData = media_metadata[id]
    if (imageData) {
      const list = imageData.p
      if (list && imageData.s) {
        list.push(imageData.s)
      }
      return list
    }
  }
  return undefined
}

export const Image = ({ x, y, u, onClick }) => {
  return (
    <img
      className={onClick ? 'pointer' : ''}
      width={x}
      height={y}
      src={replaceAmpGTLT(u)}
      onClick={onClick}
    />
  )
}

export const BestImage = ({
  list,
  onClick = undefined,
  maxWidth = calculateMaxImageSizeForScreen(),
  ..._rest
}: any) => {
  for (const preview of list.slice().reverse()) {
    if (preview.x < maxWidth) {
      return <Image {...preview} onClick={onClick} />
    }
  }
  return <Image {...list[0]} onClick={onClick} />
}
