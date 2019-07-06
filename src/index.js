import '@babel/polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'
import { Provider } from 'unstated'
import { ApolloProvider } from 'react-apollo'
import ApolloClient from 'apollo-boost'

import Header from 'pages/common/Header'
import About from 'pages/about'
import Donate from 'pages/common/donate'
import SubredditPosts from 'pages/subreddit'
import SubredditComments from 'pages/subreddit/comments'
import Thread from 'pages/thread'
import User from 'pages/user'
import { BlankUser, BlankSubreddit } from 'pages/blank'
import NotFound from 'pages/404'
import Modal from 'react-modal'

const apolloClient = new ApolloClient({
  uri: "https://api.revddit.com/v1/graphql"
})

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
    modalIsOpen: false
  }
  componentDidMount() {
    document.getElementById('donate-ribbon').onclick = this.openModal
    const donateLink = document.getElementById('donate-link')
    if (donateLink) donateLink.onclick = this.openModal
  }
  openModal = () => {
    this.setState({modalIsOpen: true});
  }
  closeModal = () => {
    this.setState({modalIsOpen: false});
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
                isOpen={this.state.modalIsOpen}
                onAfterOpen={this.afterOpenModal}
                onRequestClose={this.closeModal}
                style={customStyles}
              >
                <Donate/>
              </Modal>
              <Component {...matchProps} {...rest} />
            </div>
          </React.Fragment>
        )
      }} />
    )
  }
}


class App extends React.Component {

  render() {
    return (
      <ApolloProvider client={apolloClient}>
        <Provider>
          <BrowserRouter basename={__dirname}>
            <Switch>
              <Redirect exact from='/' to='/about' />
              <Redirect from='/u/*' to='/user/*' />
              <Redirect from='/u/' to='/user/' />
              <Redirect from='/usr/*' to='/user/*' />
              <Redirect from='/usr/' to='/user/*' />
              <DefaultLayout path='/about' component={About} />
              <DefaultLayout path='/r/:subreddit/comments/:threadID/:urlTitle/:commentID' page_type='thread' component={Thread} />
              <DefaultLayout path='/r/:subreddit/comments/:threadID/:urlTitle' page_type='thread' component={Thread} />
              <DefaultLayout path='/r/:subreddit/comments/:threadID' page_type='thread' component={Thread} />
              <DefaultLayout path='/r/:subreddit/comments/' page_type='subreddit_comments' component={SubredditComments} />
              <DefaultLayout path='/r/:subreddit' page_type='subreddit_posts' component={SubredditPosts} />
              <DefaultLayout path='/r/' page_type='blank_subreddit' component={BlankSubreddit} />
              <DefaultLayout path='/domain/all' component={NotFound} />
              <DefaultLayout path='/domain/:domain' page_type='domain_posts' component={SubredditPosts} />
              <DefaultLayout path='/user/:userSubreddit/comments/:threadID/:urlTitle/:commentID' page_type='thread' component={Thread} />
              <DefaultLayout path='/user/:userSubreddit/comments/:threadID/:urlTitle' page_type='thread' component={Thread} />
              <DefaultLayout path='/user/:userSubreddit/comments/:threadID' page_type='thread' component={Thread} />
              <DefaultLayout path='/user/:user/:kind' page_type='user' component={User} />
              <DefaultLayout path='/user/:user' page_type='user' component={User} />
              <DefaultLayout path='/user/' page_type='blank_user' component={BlankUser} />
              <DefaultLayout path='/:threadID' page_type='thread' component={Thread} />
              <DefaultLayout component={NotFound} />
            </Switch>
          </BrowserRouter>
        </Provider>
      </ApolloProvider>
    )
  }
}
ReactDOM.render(<App />, document.getElementById('app'))
