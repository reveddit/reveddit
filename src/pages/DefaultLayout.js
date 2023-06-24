import React, { useState, useEffect } from 'react'
import { Route } from 'react-router-dom'
import Modal from 'react-modal'
import { connect } from 'state'
import Header from 'pages/common/Header'
import Welcome from 'pages/modals/Welcome'
import Settings from 'pages/modals/Settings'
import ActionHelp from 'pages/modals/ActionHelp'
import { Banned } from 'pages/modals/Misc'
import { ModalProvider } from 'contexts/modal'
import { SocialLinks } from 'components/Misc'

Modal.setAppElement('#app')

const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)',
    padding: 0
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)'
  }
}

export const pageTypes = {
  aggregations: 'aggregations',
  subreddit_posts: 'subreddit_posts',
  subreddit_comments: 'subreddit_comments',
  missing_comments: 'missing_comments'
}

const getContentForHash = (hash) => {
  const action = hash.match(/^action_(.+)_help$/)
  if (action) {
    return <ActionHelp action={action[1]}/>
  }
  switch (hash) {
    case 'welcome':
      return <Welcome/>
    case 'settings':
      return <Settings/>
    case 'action_help':
      return <ActionHelp/>
    case 'banned':
      return <Banned/>
  }
  return undefined
}

const clearHashFromURL = () => {
  const url = window.location.pathname + window.location.search
  history.replaceState({}, '', url)
}

const setHashInURL = (hash) => {
  const url = window.location.pathname + window.location.search + `#${hash}`
  history.replaceState({[hash]: true}, hash, url)
}

const hideRibbon = (hide = true) => {
  document.querySelector('#donate-ribbon').style.visibility = hide ? 'hidden' : 'visible'
}

const DefaultLayout = (props) => {
  const [layoutState, setLayoutState] = useState({
    genericModalIsOpen: false,
    content: '',
    hash: ''
  })
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    const content = getContentForHash(hash)
    if (content) {
      openGenericModal({content, hash})
    }
    const newSearch = window.location.search.replace(/amp;/g, '')
    if (window.location.search !== newSearch) {
      const url = newSearch + window.location.hash
      history.replaceState({}, '', url)
    }
    if (props.title) {
      document.title = props.title
    }
  }, [])
  const openGenericModal = ({content, hash = ''}) => {
    if (hash) {
      setHashInURL(hash)
    }
    setLayoutState({genericModalIsOpen: true, content, hash})
  }
  const closeGenericModal = () => {
    if (layoutState.hash) {
      clearHashFromURL()
    }
    setLayoutState({genericModalIsOpen: false, hash: '', content: ''});
  }
    const {component: Component, ...rest } = props
    const {hash, content, genericModalIsOpen} = layoutState
    const {threadPost} = props.global.state
    const {page_type} = rest
    let threadClass = ''
    if (threadPost.removed) {
      threadClass = 'thread-removed'
    } else if (threadPost.deleted) {
      threadClass = 'thread-deleted'
    }
    useEffect(() => {
      if (genericModalIsOpen) {
        hideRibbon()
      } else {
        hideRibbon(false)
      }
    }, [genericModalIsOpen])
    return (
      <Route {...rest} render={matchProps => {
        return (
          <React.Fragment>
            <Header {...matchProps} {...rest} openGenericModal={openGenericModal}/>
            <div className={'main page_'+page_type+' '+threadClass}>
              <Modal isOpen={genericModalIsOpen}
                onRequestClose={closeGenericModal}
                style={customStyles}>
                <div id='modalContainer'>
                  <div id='genericModal' className={hash}>
                    <div className='dismiss'>
                      <a className='pointer' onClick={closeGenericModal}>✖&#xfe0e;</a>
                    </div>
                    <ModalProvider value={{closeModal: closeGenericModal, openModal: openGenericModal}}>
                      {hash ?
                        getContentForHash(hash)
                        :
                        content
                      }
                    </ModalProvider>
                  </div>
                </div>
              </Modal>
              <ModalProvider value={{openModal: openGenericModal, closeModal: closeGenericModal}}>
                <Component {...matchProps} {...rest} openGenericModal={openGenericModal}/>
              </ModalProvider>
              <SocialLinks/>
            </div>
          </React.Fragment>
        )
      }} />
    )
}

export default connect(DefaultLayout)
