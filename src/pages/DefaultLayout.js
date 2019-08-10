import React from 'react'
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
    errorModalIsOpen: false,
    error: ''
  }
  componentDidMount() {
    document.getElementById('donate-ribbon').onclick = this.openDonateModal
  }
  openDonateModal = () => {
    this.setState({donateModalIsOpen: true});
  }
  closeDonateModal = () => {
    this.setState({donateModalIsOpen: false});
  }
  openErrorModal = (error) => {
    this.setState({errorModalIsOpen: true, error});
  }
  closeErrorModal = () => {
    this.setState({errorModalIsOpen: false});
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
                isOpen={this.state.errorModalIsOpen}
                onRequestClose={this.closeErrorModal}
                style={customStyles}
              >
                <div id='errorModal'>
                  {this.state.error}
                </div>
              </Modal>
              <Component {...matchProps} {...rest} openDonateModal={this.openDonateModal} openErrorModal={this.openErrorModal}/>
            </div>
          </React.Fragment>
        )
      }} />
    )
  }
}

export default DefaultLayout
