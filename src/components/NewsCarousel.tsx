import React, { useState, useEffect, useCallback } from 'react'
import { media } from 'components/modals/Misc'
import { RedditBreakingChange } from 'components/modals/RedditBreakingChange'
import { SocialLinks } from 'components/Misc'

// Define the carousel items in display order
const CAROUSEL_ITEMS = [
  {
    key: 'reddit_breaking_change',
    component: RedditBreakingChange,
    title: 'Reddit Breaking Change',
  },
  { key: 'ofh', title: 'Shadow Bans Only Fool Humans' },
  { key: 'fe', title: 'Faithfully Engaged Podcast' },
  { key: 'yt', title: 'YouTube Shadow Removals' },
  { key: 'cw', title: 'Censorship Worse' },
  { key: 'csa', title: 'Coup Save America' },
]

export const NewsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goPrev = useCallback(() => {
    setCurrentIndex(i => (i === 0 ? CAROUSEL_ITEMS.length - 1 : i - 1))
  }, [])

  const goNext = useCallback(() => {
    setCurrentIndex(i => (i === CAROUSEL_ITEMS.length - 1 ? 0 : i + 1))
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'ArrowLeft') {
        goPrev()
      } else if (e.key === 'ArrowRight') {
        goNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goPrev, goNext])

  const currentItem = CAROUSEL_ITEMS[currentIndex]

  // Get the component to render - either from explicit component or from media object
  let ContentComponent
  if (currentItem.component) {
    ContentComponent = currentItem.component
  } else if (media[currentItem.key]) {
    ContentComponent = media[currentItem.key].content
  }

  return (
    <>
      <div className="carousel-nav">
        <a onClick={goPrev} className="collapseToggle prev active">
          &lt;- previous
        </a>
        <span className="carousel-position">
          {currentIndex + 1} / {CAROUSEL_ITEMS.length}
        </span>
        <a onClick={goNext} className="collapseToggle next active">
          next -&gt;
        </a>
      </div>
      <div className="carousel-title">{currentItem.title}</div>
      {ContentComponent && <ContentComponent topMessage="" />}
      <SocialLinks />
    </>
  )
}

export default NewsCarousel
