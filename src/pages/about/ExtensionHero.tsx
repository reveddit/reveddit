import React, { useEffect, useRef, useState } from 'react'
import { ext_urls, get } from 'utils'
import { browserStore, isMobileDevice } from 'components/ui/Extensions'
import { NewWindowLink } from 'components/ui/Links'
import { useExtensionVersion } from 'hooks/useExtensionVersion'

// The explainer's source (HTML animation + render scripts) lives outside this
// repo; these are its web encode (~10 MB) and poster frame.
const VIDEO_SRC = '/media/reveddit-real-time.mp4'
const POSTER_SRC = '/media/reveddit-real-time-poster.jpg'
const ORIGIN = 'https://www.reveddit.com'

const STORE_NAMES = { c: 'Chrome', f: 'Firefox', e: 'Edge' }

const StoreLink = ({ store }) => (
  <NewWindowLink href={ext_urls.rt[store]}>{STORE_NAMES[store]}</NewWindowLink>
)

// Joins store links as "Chrome, Firefox and Edge"
const StoreList = ({ stores }) => (
  <>
    {stores.map((store, i) => (
      <React.Fragment key={store}>
        {i === 0 ? '' : i === stores.length - 1 ? ' and ' : ', '}
        <StoreLink store={store} />
      </React.Fragment>
    ))}
  </>
)

const InstallButtons = () => {
  if (isMobileDevice || !browserStore) {
    return (
      <p className="rt-other">
        {isMobileDevice ? 'Install it on your computer: ' : 'Available for '}
        <StoreList stores={['c', 'f', 'e']} />
      </p>
    )
  }
  const others = ['c', 'f', 'e'].filter(s => s !== browserStore)
  return (
    <div className="rt-cta">
      <a
        className="rt-button"
        href={ext_urls.rt[browserStore]}
        target="_blank"
        rel="noopener"
      >
        Add to {STORE_NAMES[browserStore]} — it's free
      </a>
      <span className="rt-other">
        Also for <StoreList stores={others} />
      </span>
    </div>
  )
}

const ExplainerVideo = () => {
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const play = () => {
    video.current?.play().catch(() => setPlaying(false))
  }
  return (
    <div className="rt-video">
      <video
        ref={video}
        controls={playing}
        playsInline
        preload="none"
        width="1920"
        height="1080"
        poster={POSTER_SRC}
        aria-describedby="rt-video-note"
        onPlay={() => setPlaying(true)}
        onEnded={() => {
          // back to the poster frame
          video.current?.load()
          setPlaying(false)
        }}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
        <a href={VIDEO_SRC}>Download the video (MP4, 10 MB)</a>
      </video>
      {!playing && (
        <button
          className="rt-play"
          type="button"
          onClick={play}
          aria-label="Play the 80-second Reveddit Real-Time video"
        >
          <span className="rt-play-pill">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />
            </svg>
            Watch the demo <span className="rt-play-len">1:20</span>
          </span>
        </button>
      )}
    </div>
  )
}

// VideoObject structured data for the home page only
const useVideoJsonLd = () => {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: 'Reveddit Real-Time in 80 seconds',
      description:
        'What a secret removal on Reddit looks like to you versus everyone else, and how the Reveddit Real-Time extension alerts you, keeps a history, and flags removed comments and posts on Reddit.',
      thumbnailUrl: ORIGIN + POSTER_SRC,
      uploadDate: '2026-09-25',
      duration: 'PT1M20S',
      contentUrl: ORIGIN + VIDEO_SRC,
    })
    document.head.appendChild(script)
    return () => script.remove()
  }, [])
}

const ExtensionHero = () => {
  const version = useExtensionVersion()
  const installed = Boolean(version) || get('hasNotifierExtension', false)
  useVideoJsonLd()
  return (
    <section className="rt-hero" aria-labelledby="rt-hero-title">
      <h1 id="rt-hero-title">
        Know when your Reddit comments are secretly removed
      </h1>
      <p className="rt-lede">
        Moderators can remove your comments and posts without telling you. They
        still look normal to you, but everyone else sees them removed, and they
        disappear from your public profile. <b>Reveddit Real-Time</b>, a free
        browser extension, watches your account and notifies you when it
        happens.
      </p>
      {installed ? (
        <p className="rt-installed">
          ✓ Reveddit Real-Time is installed. Click its toolbar icon to see your
          history.
        </p>
      ) : (
        <InstallButtons />
      )}
      <ExplainerVideo />
      <p className="rt-video-note" id="rt-video-note">
        What a secret removal looks like from both sides, and what the extension
        does about it. No sound needed.
      </p>
      <details className="rt-transcript">
        <summary>Read the on-screen text</summary>
        <ol>
          <li>
            You comment on Reddit. It looks fine to you. Everyone else sees
            "Comment removed by moderator." No notification. No warning. No way
            to tell.
          </li>
          <li>
            It happens quietly. Moderators and automatic filters remove comments
            and posts without telling the author, and they vanish from your
            public profile, too. You'd never know unless you logged out and
            checked.
          </li>
          <li>
            Reveddit Real-Time gets you notified when your Reddit content is
            secretly removed. Free for Chrome, Firefox and Edge.
          </li>
          <li>
            Alerts: a desktop notification and a toolbar badge when your comment
            or post is removed, locked, or reapproved.
          </li>
          <li>
            History: what was removed, locked, or reapproved, and how long it
            took, with your original text, kept in your browser.
          </li>
          <li>
            On your profile: removed items are flagged. They look normal to you,
            but no one else can see them.
          </li>
          <li>
            In threads: your removed comments get a red edge, and removed posts
            get a note saying the subreddit can't see them.
          </li>
          <li>
            Watch anything: subscribe to any post or comment from the toolbar or
            by right-clicking a link to it, and get the same alerts.
          </li>
          <li>
            Simple and private: it starts watching your account automatically,
            uses your Reddit login with no sign-up, keeps your history in your
            browser, and is free and open source.
          </li>
          <li>Moderation is fine. Secret moderation is the problem.</li>
        </ol>
      </details>
    </section>
  )
}

export default ExtensionHero
