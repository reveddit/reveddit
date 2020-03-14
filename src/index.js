import '@babel/polyfill'
import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'
import { Provider } from 'unstated'
import DefaultLayout from 'pages/DefaultLayout'
import ErrorBoundary from 'components/ErrorBoundary'

const User = lazy(() => import('pages/user'))
const BlankUser = lazy(() => import('components/BlankUser'))
const BlankSubreddit = lazy(() => import('components/BlankSubreddit'))
const About = lazy(() => import('pages/about'))
const AddOns = lazy(() => import('pages/about/AddOns'))
const Info = lazy(() => import('pages/info'))
const SubredditPosts = lazy(() => import('pages/subreddit'))
const SubredditComments = lazy(() => import('pages/subreddit/comments'))
const Thread = lazy(() => import('pages/thread'))
const ThreadRedirect = lazy(() => import('pages/thread/redirect'))
const NotFound = lazy(() => import('pages/404'))
const Random = lazy(() => import('pages/about/random'))

class App extends React.Component {

  render() {
    return (
      <Provider>
        <BrowserRouter basename={__dirname}>
          <Route path='*' render={({location}) => {
            const path = location.pathname.replace(/\/\/+|([^/])$/g, '$1/')
            if( path !== location.pathname ) {
              return <Redirect to={{
                ...location,
                pathname: path}} />
            } else {
              return (
                <ErrorBoundary>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Switch>
                      <Redirect exact from='/' to='/about#welcome' />
                      <Redirect from='/u/*' to='/user/*' />
                      <Redirect from='/u/' to='/user/' />
                      <Route path="/user/:user/posts/" component={({ location }) => (
                          <Redirect
                            to={{
                              ...location,
                              pathname: location.pathname.replace(/\/posts/, '/submitted')
                            }} /> )}
                      />
                      <Route path="/y/" component={({ location }) => (
                          <Redirect
                            to={{
                              ...location,
                              pathname: location.pathname.replace(/\/y/, '/user')
                            }} /> )}
                      />
                      <Route path="/v/" component={({ location }) => (
                          <Redirect
                            to={{
                              ...location,
                              pathname: location.pathname.replace(/\/v/, '/r')
                            }} /> )}
                      />
                      <Route path="/api/info/" component={({ location }) => (
                          <Redirect
                            to={{
                              ...location,
                              pathname: location.pathname.replace(/api\/info/, 'info')
                            }} /> )}
                      />
                      <DefaultLayout path='/about' component={About} />
                      <DefaultLayout path='/add-ons' component={AddOns} />
                      <DefaultLayout path='/info' page_type='info' component={Info} />
                      <DefaultLayout path='/search' page_type='search' component={Info} />
                      <DefaultLayout path='/random' component={Random} />
                      <DefaultLayout path='/r/:subreddit/comments/:threadID/:urlTitle/:commentID' page_type='thread' component={Thread} />
                      <DefaultLayout path='/r/:subreddit/comments/:threadID/:urlTitle' page_type='thread' component={Thread} />
                      <DefaultLayout path='/r/:subreddit/comments/:threadID' page_type='thread' component={Thread} />
                      <DefaultLayout path='/r/:subreddit/comments/' page_type='subreddit_comments' component={SubredditComments} />
                      <DefaultLayout path='/r/:subreddit/duplicates/:threadID' page_type='duplicate_posts' component={Info} />
                      <DefaultLayout path='/r/:subreddit' page_type='subreddit_posts' component={SubredditPosts} />
                      <DefaultLayout path='/r/' page_type='blank_subreddit' component={BlankSubreddit} />
                      <DefaultLayout path='/comments/' page_type='blank_subreddit_comments' component={BlankSubreddit} is_comments_page={true} />
                      <DefaultLayout path='/domain/all' component={NotFound} />
                      <DefaultLayout path='/domain/:domain' page_type='domain_posts' component={SubredditPosts} />
                      <DefaultLayout path='/user/:userSubreddit/comments/:threadID/:urlTitle/:commentID' page_type='thread' component={Thread} />
                      <DefaultLayout path='/user/:userSubreddit/comments/:threadID/:urlTitle' page_type='thread' component={Thread} />
                      <DefaultLayout path='/user/:userSubreddit/comments/:threadID' page_type='thread' component={Thread} />
                      <DefaultLayout path='/user/:user/:kind' page_type='user' component={User} />
                      <DefaultLayout path='/user/:user' page_type='user' component={User} />
                      <DefaultLayout path='/user/' page_type='blank_user' component={BlankUser} />
                      <DefaultLayout path='/:threadID' page_type='thread' component={ThreadRedirect} />
                      <DefaultLayout component={NotFound} />
                    </Switch>
                  </Suspense>
                </ErrorBoundary>
              )
            }
          }}/>
        </BrowserRouter>
      </Provider>
    )
  }
}
ReactDOM.render(<App />, document.getElementById('app'))
