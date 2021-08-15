import '@babel/polyfill'
import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'
import { Provider } from 'unstated'
import DefaultLayout, {pageTypes} from 'pages/DefaultLayout'
import ErrorBoundary from 'components/ErrorBoundary'
import {PATH_STR_SUB, PATH_STR_USER,
        PATHS_ALT_SUB, PATHS_ALT_USER,
        SimpleURLSearchParams,
} from 'utils'
import {urlParamKeys_textFilters} from 'state'
import {ExtensionRedirect} from 'components/Misc'

const PARAMKEYS_DONT_REMOVE_BACKSLASH = new Set(Object.values(urlParamKeys_textFilters))

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError)
    });
  });
}

const User = lazy(() => import('pages/user'))
const BlankUser = lazy(() => import('components/BlankUser'))
const BlankSubreddit = lazy(() => import('components/BlankSubreddit'))
const About = lazy(() => import('pages/about'))
const About_faq = lazy(() => import('pages/about/faq'))
const About_contact = lazy(() => import('pages/about/contact'))
const About_donate = lazy(() => import('pages/about/donate'))
const AddOns = lazy(() => import('pages/about/AddOns'))
const Info = lazy(() => import('pages/info'))
const SubredditPosts = lazy(() => import('pages/subreddit'))
const SubredditSticky = lazy(() => import('pages/subreddit/sticky'))
const SubredditComments = lazy(() => import('pages/subreddit/comments'))
const Aggregations = lazy(() => import('pages/subreddit/aggregations'))
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

const profile_search = new RegExp('^'+PATH_STR_USER + '/')
const profile_replace = PATH_STR_SUB + '/u_'


const routes = (
<Switch>
  <Redirect exact from='/' to='/about#welcome' />
  <RouteRedirectWithParams path={PATH_STR_USER+'/:user/posts/'} search={/\/posts/} replace='/submitted'/>
  <RouteRedirectWithParams path={PATH_STR_SUB+'/:subreddit/controversial/'} search={/\/controversial/} replace='/top'/>
  {getAltRoutes(PATHS_ALT_USER, PATH_STR_USER)}
  {getAltRoutes(PATHS_ALT_SUB, PATH_STR_SUB)}
  <RouteRedirectWithParams path='/api/info/' search={/\/api\/info/} replace='/info'/>
  <RouteRedirectWithParams path='/gallery/' search={/\/gallery/} replace=''/>
  <DefaultLayout path='/about/faq' component={About_faq} title='Frequently Asked Questions'/>
  <DefaultLayout path='/about/contact' component={About_contact} title='Contact'/>
  <DefaultLayout path='/about/donate' component={About_donate} title='Donate'/>
  <DefaultLayout path='/about' component={About} title='About reveddit'/>
  <DefaultLayout path='/add-ons/direct' component={ExtensionRedirect} />
  <DefaultLayout path='/add-ons/linker' component={ExtensionRedirect} extCode='linker' />
  <DefaultLayout path='/add-ons/real-time' component={ExtensionRedirect} extCode='rt' />
  <DefaultLayout path='/add-ons' component={AddOns} />
  <DefaultLayout path='/info' page_type='info' component={Info} />
  <DefaultLayout path='/search' page_type='search' component={Info} />
  <DefaultLayout path='/random' component={Random} />
  <DefaultLayout path={PATH_STR_SUB+'/:subreddit/top'} page_type={pageTypes.aggregations} component={Aggregations} />
  <DefaultLayout path={PATH_STR_SUB+'/:subreddit/missing-comments'} page_type={pageTypes.missing_comments} component={SubredditComments} />
  <DefaultLayout path={PATH_STR_SUB+'/:subreddit/about/sticky'} page_type='sticky' component={SubredditSticky} />
  <DefaultLayout path={PATH_STR_SUB+'/:subreddit/comments/:threadID/:urlTitle/:commentID'} page_type='thread' component={Thread} />
  <DefaultLayout path={PATH_STR_SUB+'/:subreddit/comments/:threadID/:urlTitle'} page_type='thread' component={Thread} />
  <DefaultLayout path={PATH_STR_SUB+'/:subreddit/comments/:threadID'} page_type='thread' component={Thread} />
  <DefaultLayout path={PATH_STR_SUB+'/:subreddit/comments/'} page_type='subreddit_comments' component={SubredditComments} />
  <DefaultLayout path={PATH_STR_SUB+'/:subreddit/duplicates/:threadID'} page_type='duplicate_posts' component={Info} />
  <DefaultLayout path={PATH_STR_SUB+'/:subreddit'} page_type={pageTypes.subreddit_posts} component={SubredditPosts} />
  <DefaultLayout path={PATH_STR_SUB+'/'} page_type='blank_subreddit' component={BlankSubreddit} />
  <DefaultLayout path='/comments/' page_type='blank_subreddit_comments' component={BlankSubreddit} is_comments_page={true} />
  <DefaultLayout path='/domain/all' component={NotFound} />
  <DefaultLayout path='/domain/:domain' page_type='domain_posts' component={SubredditPosts} />
  <RouteRedirectWithParams path={PATH_STR_USER+'/:user/comments/:threadID'} search={profile_search} replace={profile_replace} />
  <RouteRedirectWithParams path={PATH_STR_USER+'/:user/duplicates/:threadID'} search={profile_search} replace={profile_replace} />
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
            if (location.pathname.match(/^\/+https?:\/\//)) {
              return (
                <Redirect
                  to={{
                    ...location,
                    pathname: '/info/',
                    search: '?url='+encodeURIComponent(location.pathname.replace(/^\/+/,'')+location.search),
                  }} />
              )
            }
            //replace double slashes // and paths that don't end in slash with a single slash
            let pathname = location.pathname.replace(/\/\/+|([^/])$/g, '$1/')

            //new reddit's fancy editor has a bug, when you write a URL w/out formatting and switch to markdown, it inserts a \ before all _
            //so, remove \ from add_user param (don't want to remove \ from text filter params like keywords or flair)
            let search = location.search
            if (location.search.match(/\\|%5C/)) {
              const params = new SimpleURLSearchParams(location.search)
              params.removeBackslash(PARAMKEYS_DONT_REMOVE_BACKSLASH)
              search = params.toString()
            } else if (pathname.match(/^\/(user|u|y)\//)) {
              // remove ! from usernames. bot inserts them to avoid automod matches on usernames
              pathname = pathname.replaceAll('!','')
            }
            if (pathname !== location.pathname || search !== location.search) {
              return <Redirect to={{
                ...location,
                search,
                pathname}} />
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
