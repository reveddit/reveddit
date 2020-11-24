import '@babel/polyfill'
import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'
import { Provider } from 'unstated'
import DefaultLayout from 'pages/DefaultLayout'
import ErrorBoundary from 'components/ErrorBoundary'
import {PATH_STR_SUB, PATH_STR_USER,
        PATHS_ALT_SUB, PATHS_ALT_USER
} from 'utils'

const User = lazy(() => import('pages/user'))
const BlankUser = lazy(() => import('components/BlankUser'))
const BlankSubreddit = lazy(() => import('components/BlankSubreddit'))
const About = lazy(() => import('pages/about'))
const About_faq = lazy(() => import('pages/about/faq'))
const AddOns = lazy(() => import('pages/about/AddOns'))
const Info = lazy(() => import('pages/info'))
const SubredditPosts = lazy(() => import('pages/subreddit'))
const SubredditComments = lazy(() => import('pages/subreddit/comments'))
const Thread = lazy(() => import('pages/thread'))
const ThreadRedirect = lazy(() => import('pages/thread/redirect'))
const NotFound = lazy(() => import('pages/404'))
const Random = lazy(() => import('pages/about/random'))

const RouteRedirectWithParams = ({path, search, replace}) =>
  <Route path={path} component={({ location }) => (
      <Redirect
        to={{
          ...location,
          pathname: location.pathname.replace(search, replace)
        }} /> )}
  />

const getAltRoutes = (alt_paths, replace_path) => {
  return alt_paths.map(altPath =>
    <RouteRedirectWithParams key={altPath} path={`${altPath}/`} search={new RegExp(altPath)} replace={replace_path}/>
  )
}

const routes = (
<Switch>
  <Redirect exact from='/' to='/about#welcome' />
  <RouteRedirectWithParams path={PATH_STR_USER+'/:user/posts/'} search={/\/posts/} replace='/submitted'/>
  {getAltRoutes(PATHS_ALT_USER, PATH_STR_USER)}
  {getAltRoutes(PATHS_ALT_SUB, PATH_STR_SUB)}
  <RouteRedirectWithParams path='/api/info/' search={/\/api\/info/} replace='/info'/>
  <RouteRedirectWithParams path='/gallery/' search={/\/gallery/} replace=''/>
  <DefaultLayout path='/about/faq' component={About_faq} title='Frequently Asked Questions'/>
  <DefaultLayout path='/about' component={About} title='About reveddit'/>
  <DefaultLayout path='/add-ons' component={AddOns} />
  <DefaultLayout path='/info' page_type='info' component={Info} />
  <DefaultLayout path='/search' page_type='search' component={Info} />
  <DefaultLayout path='/random' component={Random} />
  <DefaultLayout path={PATH_STR_SUB+'/:subreddit/missing-comments'} page_type='missing_comments' component={SubredditComments} />
  <DefaultLayout path={PATH_STR_SUB+'/:subreddit/comments/:threadID/:urlTitle/:commentID'} page_type='thread' component={Thread} />
  <DefaultLayout path={PATH_STR_SUB+'/:subreddit/comments/:threadID/:urlTitle'} page_type='thread' component={Thread} />
  <DefaultLayout path={PATH_STR_SUB+'/:subreddit/comments/:threadID'} page_type='thread' component={Thread} />
  <DefaultLayout path={PATH_STR_SUB+'/:subreddit/comments/'} page_type='subreddit_comments' component={SubredditComments} />
  <DefaultLayout path={PATH_STR_SUB+'/:subreddit/duplicates/:threadID'} page_type='duplicate_posts' component={Info} />
  <DefaultLayout path={PATH_STR_SUB+'/:subreddit'} page_type='subreddit_posts' component={SubredditPosts} />
  <DefaultLayout path={PATH_STR_SUB+'/'} page_type='blank_subreddit' component={BlankSubreddit} />
  <DefaultLayout path='/comments/' page_type='blank_subreddit_comments' component={BlankSubreddit} is_comments_page={true} />
  <DefaultLayout path='/domain/all' component={NotFound} />
  <DefaultLayout path='/domain/:domain' page_type='domain_posts' component={SubredditPosts} />
  <DefaultLayout path={PATH_STR_USER+'/:userSubreddit/comments/:threadID/:urlTitle/:commentID'} page_type='thread' component={Thread} />
  <DefaultLayout path={PATH_STR_USER+'/:userSubreddit/comments/:threadID/:urlTitle'} page_type='thread' component={Thread} />
  <DefaultLayout path={PATH_STR_USER+'/:userSubreddit/comments/:threadID'} page_type='thread' component={Thread} />
  <DefaultLayout path={PATH_STR_USER+'/:user/:kind'} page_type='user' component={User} />
  <DefaultLayout path={PATH_STR_USER+'/:user'} page_type='user' component={User} />
  <DefaultLayout path={PATH_STR_USER+'/'} page_type='blank_user' component={BlankUser} />
  <DefaultLayout path='/:threadID' page_type='thread' component={ThreadRedirect} />
  <DefaultLayout component={NotFound} />
</Switch>)

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
                    {routes}
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
