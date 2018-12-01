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
        <Header {...matchProps}/>
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
            <DefaultLayout path='/r/:subreddit/comments/:threadID/:junk/:commentID' component={Thread} />
            <DefaultLayout path='/r/:subreddit/comments/:threadID' component={Thread} />
            <DefaultLayout path='/r/:subreddit/comments/' component={SubredditComments} />
            <DefaultLayout path='/r/:subreddit' component={Subreddit} />
            <DefaultLayout path='/user/:user/:kind' component={User} />
            <DefaultLayout path='/user/:user' component={User} />
            <DefaultLayout component={NotFound} />
          </Switch>
        </BrowserRouter>
      </Provider>
    )
  }
}
ReactDOM.render(<App />, document.getElementById('app'))
