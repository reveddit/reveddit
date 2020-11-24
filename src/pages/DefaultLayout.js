import React from 'react'
import { Route } from 'react-router-dom'
import Modal from 'react-modal'
import { connect } from 'state'
import Header from 'pages/common/Header'
import Donate from 'pages/modals/donate'
import Welcome from 'pages/modals/Welcome'
import Settings from 'pages/modals/Settings'
import ActionHelp from 'pages/modals/ActionHelp'
import { ModalProvider } from 'contexts/modal'

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

const getContentForHash = (hash) => {
  const action = hash.match(/^action_(.+)_help$/)
  if (action) {
    return <ActionHelp action={action[1]}/>
  }
  switch (hash) {
    case 'welcome':
      return <Welcome/>
    case 'donate':
      return <Donate/>
    case 'settings':
      return <Settings/>
    case 'action_help':
      return <ActionHelp/>
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

class DefaultLayout extends React.Component {
  state = {
    genericModalIsOpen: false,
    content: '',
    hash: ''
  }
  componentDidMount() {
    document.getElementById('donate-ribbon').onclick = () => this.openGenericModal({hash: 'donate'})
    const hash = window.location.hash.replace('#', '')
    const content = getContentForHash(hash)
    if (content) {
      this.openGenericModal({content, hash})
    }
    const newSearch = window.location.search.replace(/amp;/g, '')
    if (window.location.search !== newSearch) {
      const url = newSearch + window.location.hash
      history.replaceState({}, '', url)
    }
    if (this.props.title) {
      document.title = this.props.title
    }
  }
  openGenericModal = ({content, hash = ''}) => {
    if (hash) {
      setHashInURL(hash)
    }
    this.setState({genericModalIsOpen: true, content, hash});
  }
  closeGenericModal = () => {
    if (this.state.hash) {
      clearHashFromURL()
    }
    this.setState({genericModalIsOpen: false, hash: '', content: ''});
  }

  render() {
    const {component: Component, ...rest } = this.props
    return (
      <Route {...rest} render={matchProps => {
        return (
          <React.Fragment>
            <Header {...matchProps} {...rest} openGenericModal={this.openGenericModal}/>
            <div className='main'>
              <Modal isOpen={this.state.genericModalIsOpen}
                onRequestClose={this.closeGenericModal}
                style={customStyles}>
                <div id='modalContainer'>
                  <div id='genericModal' className={this.state.hash}>
                    <div className='dismiss'>
                      <a className='pointer' onClick={this.closeGenericModal}>✖&#xfe0e;</a>
                    </div>
                    <ModalProvider value={{closeModal: this.closeGenericModal}}>
                      {this.state.hash ?
                        getContentForHash(this.state.hash)
                        :
                        this.state.content
                      }
                    </ModalProvider>
                  </div>
                </div>
              </Modal>
              <ModalProvider value={{openModal: this.openGenericModal}}>
                <Component {...matchProps} {...rest} openGenericModal={this.openGenericModal}/>
              </ModalProvider>
            </div>
          </React.Fragment>
        )
      }} />
    )
  }
}

export default DefaultLayout
