import React, {useState, useEffect} from 'react'
import { connect } from 'state'
import BlankUser from 'components/BlankUser'
import Comment from 'pages/common/Comment'
import Time from 'pages/common/Time'
import { getWhatPeopleSay } from 'api/reveddit'
import { itemIsRemovedOrDeleted, SimpleURLSearchParams,
         PATH_STR_USER, PATH_STR_SUB,
} from 'utils'
import { combinePushshiftAndRedditComments } from 'data_processing/comments'
import { setPostAndParentDataForComments } from 'data_processing/info'
import Highlight from 'pages/common/Highlight'
import { Link } from 'react-router-dom'
import { InternalPage, NewWindowLink, SamePageHashLink, Spin } from 'components/Misc'
import { SpreadWord, censorshipWorseLink, onlyFoolHumansLink } from 'pages/modals/Misc'

const whatPeopleSay_id = 'say'
const whatPeopleSay_hash = '#'+whatPeopleSay_id
const whatPeopleSay_indexParam = 'i'

const filterDeletedComments = (comments) => {
  const result = []
  Object.values(comments).sort((a, b) => b.created_utc-a.created_utc).forEach((c) => {
    c.link_title = ''
    if (! itemIsRemovedOrDeleted(c)) {
      result.push(c)
    }
  })
  return result
}

export const ContentWithHeader = ({header, children, half, id, onClick = () => {}}) => {
  return (
    <div id={id} className={'section ' + (half ? 'half' : '')}>
      {id ? <SamePageHashLink id={id} style={{marginRight:'5px'}} onClick={onClick}>🔗</SamePageHashLink> : null}
      <h2 className='about' style={{display:'inline'}}>{header}</h2>
      <p></p>
      {children}
    </div>
  )
}

export const NewsItem = ({to, title, created_utc, newsText = '', timePrefix = '', archive = '', ...props}) => {
  const archiveLink = archive ? <> (<NewWindowLink href={archive}>archive</NewWindowLink>)</> : <></>
  const link = (props.href || props.reddit) ? <NewWindowLink {...props}>{title}</NewWindowLink> : <Link to={to}>{title}</Link>
  const blurb = newsText ? <li><span style={{fontStyle:'italic'}}>...{newsText}</span></li> : <></>
  return <li>{link}{archiveLink}
    <ul>{blurb}<li>{timePrefix}<Time created_utc={created_utc} {...props}/></li></ul></li>
}
const contact = '/about/contact/'
const donate = '/about/donate/'
const news = [
  {href: onlyFoolHumansLink,
  title: "Shadow Bans Only Fool Humans, Not Bots",
  created_utc: '1704206700'},
  {href: censorshipWorseLink,
  title: "Hate Online Censorship? It's Way Worse Than You Think.",
  created_utc: '1689944502'},
  {reddit: '/14ofm29',
  title: "I'm the creator of Reveddit. AMA",
  created_utc: '1688274418'},
  {href: 'https://www.youtube.com/watch?v=ndiAl6QEA6k&t=1345s',
  title: "The Problem with Shadowbanning on Reddit and Beyond: A discussion with Reveddit Owner Robert Hawkins",
  created_utc: '1687176001'},
  {href: 'https://removed.substack.com/p/twitters-throttling-of-what-is-a',
  title: "Article: Twitter's Throttling Of “What is a Woman?” Was Not Censorship",
  created_utc: '1687176000'},
  {href: 'https://removed.substack.com/p/the-beginnings-of-shadowbans-and',
  title: '[REMOVED] on substack',
  created_utc: '1681790400'},
  {href: 'https://shadowmoderation.com/2022-10-transparent-moderation/',
  title: 'Talk: Improving online discourse with transparent moderation',
  created_utc: '1665580500'},
  {reddit: '/wxfjvy',
  title: 'Podcast: What is shadow moderation?',
  created_utc: '1661437289'},
  {reddit: '/w8i11a',
   title: 'Admin transparency',
   created_utc: '1658837092'},
  {reddit:'/pkugyl/',
   title:'History through 2021/06',
   created_utc: '1631180038'},
  {reddit:'/n3q106/',
   title:'+ u/modlogs data, date picker',
   created_utc:'1620025350'},
  {reddit:'/ki88o3/',
   title:'Author buttons and filters',
   created_utc:'1608653464'},
  {reddit:'/kfdaj7/',
   title:'Top removed content per subreddit',
   created_utc:'1608262786'},
  {reddit:'/r/RethinkReddit',
   title:'r/RethinkReddit',
   created_utc:'1602822760'},
  {reddit:'/hq7a8s/',
   title:'Showing archive delay',
   created_utc:'1594608021'},
  {to:`/r/all/missing-comments/`,
   title:'tracking missing comments',
   created_utc:'1591339363'},
  {reddit:'/gdaj40/',
   title:'added public mod logs + other updates',
   created_utc:'1588594602'},
  {reddit:'/estw67/',
   title:'random user, collapsed comments, xposts',
   created_utc:'1579789966'},
  {to:'/add-ons/',
   title:'real-time notifier extension',
   created_utc:'1576163308'},
  {reddit:'/e1wsqy/',
   title:'revddit.com -> www.reveddit.com',
   created_utc:'1574768321'},
  {reddit:'/db5hfm/',
   title:'tip: /y and /v aliases for /user and /r',
   created_utc:'1569812523'},
  {reddit:'/r/shortcuts/comments/ct64s6/is_it_possible_to_modify_a_copied_link/exkas2j/?context=3',
   title:'Reveddit shortcut for iOS',
   created_utc:'1566381957'},
  {reddit:'/clwnxg/',
   title:'Reveddit linker extension',
   created_utc:'1564927561'},
  {reddit:'/9n9l45/',
   title:'site launch',
   created_utc:'1539261445'},
]
const sub = '<sub>'
const About = ({global, ...props}) => {
  const url = new URL(window.location.href)
  const hashIsSay = url.hash.match(/^#say/)
  const initialIndex = (hashIsSay && (url.searchParams.get(whatPeopleSay_indexParam) || -1)) || 0
  const [comments, setComments] = useState([])
  const [singleDisplayIndex, setSingleDisplayIndex] = useState(initialIndex)
  const [showAllNews, setShowAllNews] = useState(false)
  
  const changeView = (index) => {
    const url = new URL(window.location.href)
    if (index === -1 || index === 0) {
      if (index === -1) {
        url.hash = whatPeopleSay_hash
      } else if (url.hash === whatPeopleSay_hash) {
        url.hash = ''
      }
      url.searchParams.delete(whatPeopleSay_indexParam)
    } else {
      url.hash = whatPeopleSay_hash
      url.searchParams.set(whatPeopleSay_indexParam,index)
    }
    window.history.replaceState(null,null,url)
    setSingleDisplayIndex(index)
  }
  const showNews = () => {
    return <>
      {showAllNews ? news.map(n => <NewsItem key={n.created_utc} {...n}/>) :
        <>
          {news.map(n => <NewsItem key={n.created_utc} {...n}/>).slice(0,5)}
          <li><a className='collapseToggle' onClick={() => setShowAllNews(true)}>[+] show all</a></li>
        </>
      }
    </>
  }
  useEffect(() => {
    getWhatPeopleSay()
    .then(({authors, reddit, pushshift, moderators}) => {
      const combined = combinePushshiftAndRedditComments(pushshift.comments, reddit.comments, false)
      setPostAndParentDataForComments(Object.values(combined), reddit.parents_and_posts)
      setComments(filterDeletedComments(combined))
      if (authors || moderators) {
        //cleanup empty data
        for (const [name,data] of Object.entries(authors)) {
          if (! Object.keys(data).length) {
            delete authors[name]
          }
        }
        global.setState({
          authors,
          author_fullnames: {'abc': 1}, // dummy value to trigger loading data from authors dict
          moderators})
      }
      document.querySelector('.spin').classList.add('display-none')
    })
  }, [])

  if (global.state.statusImage !== undefined) {
    global.clearStatus()
  }
  let singleDisplayComment = null
  let hasNext = false, hasPrev = false
  let nextAttr = {}, prevAttr = {}
  if (singleDisplayIndex >= 0) {
    singleDisplayComment = comments[singleDisplayIndex]
    if (singleDisplayIndex > 0) {
      hasPrev = true
      prevAttr = {onClick: (e) => changeView(singleDisplayIndex-1)}
    }
    if (singleDisplayIndex < comments.length-1) {
      hasNext = true
      nextAttr = {onClick: (e) => changeView(singleDisplayIndex+1)}
    }
  }
  const status = new SimpleURLSearchParams(window.location.search).get('status') || ''
  let message = ''
  if (status === 'donate-success') {
    message = 'Thank you for your donation!'
  } else if (status === 'donate-cancel') {
    message = 'Your donation has been cancelled.'
  }
  return (
      <InternalPage props={props}>
        <div className='about section'>
          {message &&
            <div className='message'>
              {message}
            </div>
          }
          <ContentWithHeader header='About'>
            <BlankUser bottomMessage={<></>}/>
            <div className='note'><SpreadWord topMessage={<></>}/></div>
            <Highlight showMobile={true}/>
          </ContentWithHeader>
        </div>
        <ContentWithHeader header='What people say' className='section' id={whatPeopleSay_id} onClick={() => {setSingleDisplayIndex(-1)}}>
          <Spin/>
          {comments.length ?
            singleDisplayComment ?
              <React.Fragment>
                <div className='non-item pagination'>
                  <a  {...prevAttr}
                      className={`collapseToggle prev ${hasPrev ? 'active':'disabled'}`}>&lt;- previous</a>
                  <a {...nextAttr}
                          className={`collapseToggle next ${hasNext ? 'active':'disabled'}`}>next -&gt;</a>
                </div>
                <div className='non-item'><a onClick={(e) => changeView(-1)}
                        className='collapseToggle'>[+] view all</a>
                </div>
                <Comment key={singleDisplayComment.id} {...singleDisplayComment}/>
              </React.Fragment>
              :
              <React.Fragment>
                <div className='non-item'><a onClick={(e) => changeView(0)}
                        className='collapseToggle'>[–] show less</a>
                </div>
                {comments.map(c => <Comment key={c.id} {...c}/>)}
                <div className='non-item'><a onClick={(e) => changeView(0)}
                        className='collapseToggle'>[–] show less</a>
                </div>
              </React.Fragment>
          : ''}
        </ContentWithHeader>
        <Row>
          <ContentWithHeader header='News' half={true}>
            <ul className='news'>
              {showNews()}
            </ul>
          </ContentWithHeader>
          <ContentWithHeader header='Site usage' half={true}>
            <p>Insert <span className='v'>ve</span> into the URL of any Reddit page.</p>
            <ul>
              <li><a href={PATH_STR_USER+'/redditor_3975/'}>user/redditor_3975</a></li>
              <li><a href={PATH_STR_SUB+'/CantSayAnything/'}>r/CantSayAnything</a></li>
              <li><a href={PATH_STR_SUB+'/worldnews/history/'}>r/worldnews/history</a></li>
              <li><a href={PATH_STR_SUB+'/worldnews/duplicates/eb2hjw'}>other-discussions+</a></li>
              <li><a href={PATH_STR_SUB+'/CantSayAnything/about/sticky'}>r/{sub}/comments/link-id/</a></li>
              <li><a href={PATH_STR_SUB+'/CantSayAnything/comments'}>r/{sub}/comments</a></li>
              <li><a href={PATH_STR_SUB+'/all/missing-comments/'}>r/all/missing-comments</a></li>
            </ul>
          </ContentWithHeader>
        </Row>
        <Row>
          <ContentWithHeader header='Donate' half={true}>
            <p>Reveddit is free and ad-free. You can support work like this with a <Link to={donate}>donation</Link>, <Link to={contact}>feedback</Link>, or <NewWindowLink href='https://github.com/reveddit/reveddit'>pull requests</NewWindowLink>.</p>
            <p>Thank you!</p>
          </ContentWithHeader>
        </Row>
        <footer>
          <Link to={contact}>contact</Link>
          <Link to={contact+'#privacy'}>privacy</Link>
          <Link to={donate}>donate</Link>
        </footer>
      </InternalPage>
  )
}

export const Row = ({children}) => <div className='sections'>{children}</div>

export default connect(About)
