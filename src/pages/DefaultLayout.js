import React from 'react'
import { withRouter } from 'react-router';
import { Route } from 'react-router-dom'
import Modal from 'react-modal'
import { connect } from 'state'
import Header from 'pages/common/Header'
import Donate from 'pages/common/donate'

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


class DefaultLayout extends React.Component {
  state = {
    donateModalIsOpen: false,
    genericModalIsOpen: false,
    content: ''
  }
  componentDidMount() {
    document.getElementById('donate-ribbon').onclick = this.openDonateModal
    if (window.location.hash === '#donate') {
      this.openDonateModal()
    }
  }
  openDonateModal = () => {
    const url = window.location.pathname + window.location.search + '#donate'
    history.replaceState({'donate': true}, 'donate', url)
    this.setState({donateModalIsOpen: true});
  }
  closeDonateModal = () => {
    const url = window.location.pathname + window.location.search
    history.replaceState({}, '', url)
    this.setState({donateModalIsOpen: false});
  }
  openGenericModal = (content) => {
    this.setState({genericModalIsOpen: true, content});
  }
  closeGenericModal = () => {
    this.setState({genericModalIsOpen: false});
  }

  render() {
    const {component: Component, ...rest } = this.props
    return (
      <Route {...rest} render={matchProps => {
        return (
          <React.Fragment>
            <Header {...matchProps} {...rest}/>
            <div className='main'>
              <Modal
                isOpen={this.state.donateModalIsOpen}
                onRequestClose={this.closeDonateModal}
                style={customStyles}
              >
                <Donate/>
              </Modal>
              <Modal
                isOpen={this.state.genericModalIsOpen}
                onRequestClose={this.closeGenericModal}
                style={customStyles}
              >
                <div id='genericModal'>
                  {this.state.content}
                </div>
              </Modal>
              <Component {...matchProps} {...rest} openDonateModal={this.openDonateModal} openGenericModal={this.openGenericModal}/>
            </div>
          </React.Fragment>
        )
      }} />
    )
  }
}

export default DefaultLayout
