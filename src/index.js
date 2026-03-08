document.getElementById('javascript-root-error').style.display = 'none'
import React, { Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'
import DefaultLayout, { pageTypes } from 'pages/DefaultLayout'
import ErrorBoundary from 'components/ErrorBoundary'
import {
  PATH_STR_SUB,
  PATH_STR_USER,
  PATHS_ALT_SUB,
  PATHS_ALT_USER,
  SimpleURLSearchParams,
} from 'utils'
import { urlParamKeys_textFilters } from 'state'
import { ExtensionRedirect } from 'components/Misc'
import { old_reddit } from 'api/reddit'

const PARAMKEYS_DONT_REMOVE_BACKSLASH = new Set(
  Object.values(urlParamKeys_textFilters)
)

if ('serviceWorker' in navigator && IS_PRODUCTION === 'true') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(() => {
        // Reload once when a new service worker takes control so users
        // get updated code on a single refresh instead of closing all tabs.
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError)
      })
  })
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

// Reads current location and performs a pathname.replace redirect
const RouteRedirectWithParams = ({ search, replace }) => {
  const location = useLocation()
  return (
    <Navigate
      replace
      to={{ ...location, pathname: location.pathname.replace(search, replace) }}
    />
  )
}

const getAltRoutes = (alt_paths, replace_path) => {
  return alt_paths.map(altPath => (
    <Route
      key={altPath}
      path={`${altPath}/*`}
      element={
        <RouteRedirectWithParams
          search={new RegExp(altPath)}
          replace={replace_path}
        />
      }
    />
  ))
}

// Normalizes URLs (trailing slashes, double slashes, backslashes, etc.)
// before handing off to the route tree. Must be inside BrowserRouter.
const URLNormalizer = ({ children }) => {
  const location = useLocation()

  // Redirect bare https?:// URLs to the info page
  if (location.pathname.match(/^\/+https?:\/\//)) {
    return (
      <Navigate
        replace
        to={{
          ...location,
          pathname: '/info/',
          search:
            '?url=' +
            encodeURIComponent(
              location.pathname.replace(/^\/+/, '') + location.search
            ),
        }}
      />
    )
  }

  //replace double slashes // and paths that don't end in slash with a single slash
  //also convert paths ending in /.compact to /
  let pathname = location.pathname
    .replace(/\/\/+|([^/])$|\/\.compact$/g, '$1/')
    .replace(/\\/g, '')

  //new reddit's fancy editor has a bug, when you write a URL w/out formatting and switch to markdown, it inserts a \ before all _
  //so, remove \ from add_user param (don't want to remove \ from text filter params like keywords or flair)
  let search = location.search
  if (location.search.match(/\\|%5C/)) {
    const params = new SimpleURLSearchParams(location.search)
    params.removeBackslash(PARAMKEYS_DONT_REMOVE_BACKSLASH)
    search = params.toString()
  } else {
    const match = pathname.match(/^\/(user|u|y)\/([^/]+)(.*)/)
    if (match) {
      if (match[2] === 'me') {
        window.location.replace(
          old_reddit +
            '/user/me' +
            match[3] +
            window.location.search
        )
        return null
      }
      // remove ! from usernames. bot inserts them to avoid automod matches on usernames
      pathname = pathname.replace(/!/g, '')
    }
  }

  if (pathname !== location.pathname || search !== location.search) {
    return <Navigate replace to={{ ...location, search, pathname }} />
  }

  return children
}

const profile_search = new RegExp('^' + PATH_STR_USER + '/')
const profile_replace = PATH_STR_SUB + '/u_'

const App = () => (
  <BrowserRouter basename={__dirname} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <URLNormalizer>
      <ErrorBoundary>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/about" element={<Navigate replace to="/" />} />
            <Route
              path={PATH_STR_USER + '/:user/posts/*'}
              element={
                <RouteRedirectWithParams search={/\/posts/} replace="/submitted" />
              }
            />
            <Route
              path={PATH_STR_SUB + '/:subreddit/controversial/*'}
              element={
                <RouteRedirectWithParams
                  search={/\/controversial/}
                  replace="/history"
                />
              }
            />
            <Route
              path={PATH_STR_SUB + '/:subreddit/top/*'}
              element={
                <RouteRedirectWithParams search={/\/top/} replace="/history" />
              }
            />
            {getAltRoutes(PATHS_ALT_USER, PATH_STR_USER)}
            {getAltRoutes(PATHS_ALT_SUB, PATH_STR_SUB)}
            <Route
              path="/api/info/*"
              element={
                <RouteRedirectWithParams search={/\/api\/info/} replace="/info" />
              }
            />
            <Route
              path="/gallery/*"
              element={
                <RouteRedirectWithParams search={/\/gallery/} replace="" />
              }
            />
            <Route
              path="/about/f.a.q."
              element={
                <RouteRedirectWithParams search="/f.a.q." replace="/faq" />
              }
            />
            <Route
              path="/submit"
              element={
                <RouteRedirectWithParams search="/submit" replace="/info" />
              }
            />
            <Route
              path="/"
              element={<DefaultLayout component={About} title="About reveddit" />}
            />
            <Route
              path="/about/faq/*"
              element={
                <DefaultLayout
                  component={About_faq}
                  title="Frequently Asked Questions"
                />
              }
            />
            <Route
              path="/about/contact/*"
              element={
                <DefaultLayout component={About_contact} title="Contact" />
              }
            />
            <Route
              path="/about/donate/*"
              element={
                <DefaultLayout component={About_donate} title="Donate" />
              }
            />
            <Route
              path="/add-ons/direct"
              element={<DefaultLayout component={ExtensionRedirect} />}
            />
            <Route
              path="/add-ons/linker"
              element={
                <DefaultLayout component={ExtensionRedirect} extCode="linker" />
              }
            />
            <Route
              path="/add-ons/real-time"
              element={
                <DefaultLayout component={ExtensionRedirect} extCode="rt" />
              }
            />
            <Route
              path="/add-ons/*"
              element={<DefaultLayout component={AddOns} />}
            />
            <Route
              path="/info/*"
              element={<DefaultLayout page_type="info" component={Info} />}
            />
            <Route
              path="/search/*"
              element={<DefaultLayout page_type="search" component={Info} />}
            />
            <Route
              path="/random"
              element={
                <DefaultLayout component={Random} title="Find Random User" />
              }
            />
            <Route
              path={PATH_STR_SUB + '/:subreddit/x'}
              element={
                <DefaultLayout component={Random} title="Find Random User" />
              }
            />
            <Route
              path={PATH_STR_SUB + '/:subreddit/history/*'}
              element={
                <DefaultLayout
                  page_type={pageTypes.aggregations}
                  component={Aggregations}
                />
              }
            />
            <Route
              path={PATH_STR_SUB + '/:subreddit/missing-comments/*'}
              element={
                <DefaultLayout
                  page_type={pageTypes.missing_comments}
                  component={SubredditComments}
                />
              }
            />
            <Route
              path={PATH_STR_SUB + '/:subreddit/about/sticky'}
              element={
                <DefaultLayout page_type="sticky" component={SubredditSticky} />
              }
            />
            <Route
              path={
                PATH_STR_SUB +
                '/:subreddit/comments/:threadID/:urlTitle/:commentID'
              }
              element={
                <DefaultLayout page_type="thread" component={Thread} />
              }
            />
            <Route
              path={
                PATH_STR_SUB + '/:subreddit/comments/:threadID/:urlTitle'
              }
              element={
                <DefaultLayout page_type="thread" component={Thread} />
              }
            />
            <Route
              path={PATH_STR_SUB + '/:subreddit/comments/:threadID'}
              element={
                <DefaultLayout page_type="thread" component={Thread} />
              }
            />
            <Route
              path={PATH_STR_SUB + '/:subreddit/comments/*'}
              element={
                <DefaultLayout
                  page_type="subreddit_comments"
                  component={SubredditComments}
                />
              }
            />
            <Route
              path={PATH_STR_SUB + '/:subreddit/duplicates/:threadID'}
              element={
                <DefaultLayout
                  page_type="duplicate_posts"
                  component={Info}
                />
              }
            />
            <Route
              path={PATH_STR_SUB + '/:subreddit/*'}
              element={
                <DefaultLayout
                  page_type={pageTypes.subreddit_posts}
                  component={SubredditPosts}
                />
              }
            />
            <Route
              path={PATH_STR_SUB + '/'}
              element={
                <DefaultLayout
                  page_type="blank_subreddit"
                  component={BlankSubreddit}
                />
              }
            />
            <Route
              path="/comments/*"
              element={
                <DefaultLayout
                  page_type="blank_subreddit_comments"
                  component={BlankSubreddit}
                  is_comments_page={true}
                />
              }
            />
            <Route
              path="/domain/all"
              element={<DefaultLayout component={NotFound} />}
            />
            <Route
              path="/domain/:domain/*"
              element={
                <DefaultLayout
                  page_type="domain_posts"
                  component={SubredditPosts}
                />
              }
            />
            <Route
              path={PATH_STR_USER + '/:user/comments/:threadID'}
              element={
                <RouteRedirectWithParams
                  search={profile_search}
                  replace={profile_replace}
                />
              }
            />
            <Route
              path={PATH_STR_USER + '/:user/duplicates/:threadID'}
              element={
                <RouteRedirectWithParams
                  search={profile_search}
                  replace={profile_replace}
                />
              }
            />
            <Route
              path={PATH_STR_USER + '/:user/:kind'}
              element={<DefaultLayout page_type="user" component={User} />}
            />
            <Route
              path={PATH_STR_USER + '/:user/*'}
              element={<DefaultLayout page_type="user" component={User} />}
            />
            <Route
              path={PATH_STR_USER + '/'}
              element={
                <DefaultLayout page_type="blank_user" component={BlankUser} />
              }
            />
            <Route
              path="/:threadID"
              element={
                <DefaultLayout page_type="thread" component={ThreadRedirect} />
              }
            />
            <Route path="*" element={<DefaultLayout component={NotFound} />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </URLNormalizer>
  </BrowserRouter>
)

// Clear any react-snap pre-rendered HTML before mounting.
// react-snap pre-renders the "/" route into 200.html, which Netlify serves
// for ALL routes as a SPA fallback. Hydrating that HTML on a different
// route causes React 18 hydration errors (#418/#425/#423) and visual
// bleed-through of the home page content.
const rootElement = document.getElementById('app')
rootElement.textContent = ''
createRoot(rootElement).render(<App />)
