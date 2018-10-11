import 'babel-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'
import { Provider } from 'unstated'

import Header from './pages/common/Header'
import About from './pages/about'
import Subreddit from './pages/subreddit'
import Thread from './pages/thread'
import User from './pages/user'
import NotFound from './pages/404'

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

ReactDOM.render(
  <Provider>
    <BrowserRouter basename={__dirname}>
      <React.Fragment>
        <Switch>
          <Redirect exact from='/' to='/about' />
          <DefaultLayout path='/about' component={About} />
          <DefaultLayout path='/r/:subreddit/comments/:threadID/:junk/:commentID' component={Thread} />
          <DefaultLayout path='/r/:subreddit/comments/:threadID' component={Thread} />
          <DefaultLayout path='/r/:subreddit' component={Subreddit} />
          <DefaultLayout path='/user/:user/:kind' component={User} />
          <DefaultLayout path='/user/:user' component={User} />
          <DefaultLayout component={NotFound} />
        </Switch>
      </React.Fragment>
    </BrowserRouter>
  </Provider>,
  document.getElementById('app')
)
