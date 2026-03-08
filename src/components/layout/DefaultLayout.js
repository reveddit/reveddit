import React, { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Modal from 'react-modal'
import { connect } from 'state'
import Header from 'components/common/Header'
import Welcome from 'components/modals/Welcome'
import Settings from 'components/modals/Settings'
import ActionHelp from 'components/modals/ActionHelp'
import {
  Banned,
  SpreadWord,
  hasSeenSpreadWord,
  SubredditViewUnavailable,
  CensorshipWorse,
  FaithfullyEngaged,
  YoutubeShadowRemovals,
  OnlyFoolHumans,
  CoupSaveAmerica,
} from 'components/modals/Misc'
import { RedditBreakingChange } from 'components/modals/RedditBreakingChange'
import { NewsCarousel } from 'components/NewsCarousel'
import { ModalProvider } from 'contexts/modal'
import { SocialLinks } from 'components/Misc'
import { RedditChangeBanner } from 'components/RedditChangeBanner'
import { put } from 'utils'

Modal.setAppElement('#app')

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: 0,
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
}

export const pageTypes = {
  aggregations: 'aggregations',
  subreddit_posts: 'subreddit_posts',
  subreddit_comments: 'subreddit_comments',
  missing_comments: 'missing_comments',
}



const getContentForHash = hash => {
  const action = hash.match(/^action_(.+)_help$/)
  if (action) {
    return <ActionHelp action={action[1]} />
  }
  switch (hash) {
    case 'welcome':
      return <Welcome />
    case 'settings':
      return <Settings />
    case 'action_help':
      return <ActionHelp />
    case 'banned':
      return <Banned />
    case 'reddit_breaking_change':
      return <RedditBreakingChange />
    case 'faithfully_engaged':
      return (
        <>
          <FaithfullyEngaged />
          <SocialLinks />
        </>
      )
    case 'spread_word':
      return (
        <>
          <SpreadWord />
          <SocialLinks />
        </>
      )
    case 'youtube_shadow':
      return (
        <>
          <YoutubeShadowRemovals />
          <SocialLinks />
        </>
      )
    case 'news_ribbon':
      return <NewsCarousel />
    case 'csa':
      return (
        <>
          <CoupSaveAmerica />
          <SocialLinks />
        </>
      )
    case 'only_fool_humans':
      return (
        <>
          <OnlyFoolHumans />
        </>
      )
    case 'censorship_worse':
      return (
        <>
          <CensorshipWorse />
        </>
      )
    case 'subreddit_unavailable':
      return <SubredditViewUnavailable />
  }
  return undefined
}

export const clearHashFromURL = () => {
  const url = window.location.pathname + window.location.search
  history.replaceState({}, '', url)
}

const setHashInURL = hash => {
  const url = window.location.pathname + window.location.search + `#${hash}`
  history.replaceState({ [hash]: true }, hash, url)
}



const existingHash = () => window.location.hash.replace('#', '')

const DefaultLayout = props => {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const match = { params }
  const history = {
    push: (to, state) => navigate(to, { state }),
    replace: (to, state) => navigate(to, { replace: true, state }),
  }
  const routeProps = { match, location, history }

  const [layoutState, setLayoutState] = useState({
    genericModalIsOpen: false,
    content: '',
    hash: '',
  })
  const [pendingModals, setPendingModals] = useState([])
  useEffect(() => {
    // Skip modal logic during react-snap prerendering
    if (
      navigator.userAgent.includes('ReactSnap') ||
      navigator.userAgent.includes('HeadlessChrome')
    ) {
      return
    }
    const hash = existingHash()
    const content = getContentForHash(hash)
    if (content) {
      openGenericModal({ content, hash })
    }
    const newSearch = window.location.search.replace(/amp;/g, '')
    if (window.location.search !== newSearch) {
      const url = newSearch + window.location.hash
      window.history.replaceState({}, '', url)
    }
    if (props.title) {
      document.title = props.title
    }
  }, [])
  const openGenericModal = ({ content, hash = '' }) => {
    if (genericModalIsOpen) {
      setPendingModals(pendingModals.concat({ content, hash }))
    } else {
      // ! existingHash() prevents new user modals from overriding FAQ hashes like /about/faq/#need
      if (hash && !existingHash()) {
        setHashInURL(hash)
      }
      setLayoutState({ genericModalIsOpen: true, content, hash })
    }
  }
  const closeGenericModal = () => {
    if (layoutState.hash) {
      clearHashFromURL()
      if (layoutState.hash === 'spread_word') {
        put(hasSeenSpreadWord, true)
      }
    }
    if (pendingModals.length) {
      const { content, hash } = pendingModals.pop()
      setPendingModals(pendingModals)
      setLayoutState({ genericModalIsOpen: true, content, hash })
    } else {
      setLayoutState({ genericModalIsOpen: false, hash: '', content: '' })
    }
  }
  const { component: Component, ...rest } = props
  const { hash, content, genericModalIsOpen } = layoutState
  const { threadPost } = props.global.state
  const { page_type } = rest
  let threadClass = ''
  if (threadPost.removed) {
    threadClass = 'thread-removed'
  } else if (threadPost.deleted) {
    threadClass = 'thread-deleted'
  }

  return (
    <React.Fragment>
      <RedditChangeBanner />
      <Header
        {...routeProps}
        {...rest}
        openGenericModal={openGenericModal}
      />
      <div className={'main page_' + page_type + ' ' + threadClass}>
        <Modal
          isOpen={genericModalIsOpen}
          onRequestClose={closeGenericModal}
          style={customStyles}
        >
          <div id="modalContainer">
            <div id="genericModal" className={hash}>
              <div className="dismiss">
                <a className="pointer" onClick={closeGenericModal}>
                  ✖&#xfe0e;
                </a>
              </div>
              <ModalProvider
                value={{
                  closeModal: closeGenericModal,
                  openModal: openGenericModal,
                }}
              >
                {hash ? getContentForHash(hash) : content}
              </ModalProvider>
            </div>
          </div>
        </Modal>
        <ModalProvider
          value={{
            openModal: openGenericModal,
            closeModal: closeGenericModal,
          }}
        >
          <Component
            {...routeProps}
            {...rest}
            openGenericModal={openGenericModal}
          />
        </ModalProvider>
        <SocialLinks />
      </div>
    </React.Fragment>
  )
}

export default connect(DefaultLayout)
