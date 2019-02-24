import 'babel-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'
import { Provider } from 'unstated'

import Header from 'pages/common/Header'
import About from 'pages/about'
import Subreddit from 'pages/subreddit'
import SubredditComments from 'pages/subreddit/comments'
import Thread from 'pages/thread'
import User from 'pages/user'
import NotFound from 'pages/404'

const DefaultLayout = ({component: Component, ...rest}) => {
  return (
    <Route {...rest} render={matchProps => (
      <React.Fragment>
        <Header {...matchProps} page_type={rest.page_type}/>
        <div className='main'>
          <Component {...matchProps} />
        </div>
      </React.Fragment>
    )} />
  )
}
class App extends React.Component {
  render() {
    return (
      <Provider>
        <BrowserRouter basename={__dirname}>
          <Switch>
            <Redirect exact from='/' to='/about' />
            <Redirect from='/u/*' to='/user/*' />
            <DefaultLayout path='/about' component={About} />
            <DefaultLayout path='/r/:subreddit/comments/:threadID/:urlTitle/:commentID' page_type='thread' component={Thread} />
            <DefaultLayout path='/r/:subreddit/comments/:threadID' page_type='thread' component={Thread} />
            <DefaultLayout path='/r/:subreddit/comments/' page_type='subreddit_comments' component={SubredditComments} />
            <DefaultLayout path='/r/:subreddit' page_type='subreddit_posts' component={Subreddit} />
            <DefaultLayout path='/user/:userSubreddit/comments/:threadID/:urlTitle/:commentID' page_type='thread' component={Thread} />
            <DefaultLayout path='/user/:userSubreddit/comments/:threadID/:urlTitle/' page_type='thread' component={Thread} />
            <DefaultLayout path='/user/:user/:kind' page_type='user' component={User} />
            <DefaultLayout path='/user/:user' page_type='user' component={User} />
            <DefaultLayout component={NotFound} />
          </Switch>
        </BrowserRouter>
      </Provider>
    )
  }
}
ReactDOM.render(<App />, document.getElementById('app'))
