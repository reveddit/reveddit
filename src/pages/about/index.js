import React from 'react'
import { connect } from 'state'
import BlankUser from 'components/BlankUser'
import Comment from 'pages/common/Comment'
import Time from 'pages/common/Time'
import { getComments } from 'api/reddit'
import { getWhatPeopleSay } from 'api/reveddit'
import { getCommentsByID as getPushshiftComments } from 'api/pushshift'
import { itemIsRemovedOrDeleted, SimpleURLSearchParams, makeDonateVisible,
         PATH_STR_USER, PATH_STR_SUB,
} from 'utils'
import { combinePushshiftAndRedditComments } from 'data_processing/comments'
import { setPostAndParentDataForComments } from 'data_processing/info'
import Highlight from 'pages/common/Highlight'
import { Link } from 'react-router-dom'
import { InternalPage } from 'components/Misc'
import {jumpToHash} from 'utils'
import { NewWindowLink } from 'components/Misc'

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

export const ContentWithHeader = ({header, children, half, id}) => {
  const hash = '#'+id
  return (
    <div id={id} className={'section ' + (half ? 'half' : '')}>
      {id ? <Link to={hash} onClick={() => jumpToHash(hash)} style={{marginRight:'5px'}}>🔗</Link> : null}
      <h2 className='about' style={{display:'inline'}}>{header}</h2>
      <p></p>
      {children}
    </div>
  )
}

const NewsItem = ({to, title, created_utc, ...props}) => {
  const link = (props.href || props.reddit) ? <NewWindowLink {...props}>{title}</NewWindowLink> : <Link to={to}>{title}</Link>
  return <li>{link}
    <ul><li><Time created_utc={created_utc}/></li></ul></li>
}

const news = [
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
   title:'reveddit shortcut for iOS',
   created_utc:'1566381957'},
  {reddit:'/clwnxg/',
   title:'reveddit linker extension',
   created_utc:'1564927561'},
  {reddit:'/9n9l45/',
   title:'site launch',
   created_utc:'1539261445'},
]

export class About extends React.Component {
  state = {
    comments: [],
    singleDisplayIndex: 0,
    showAllNews: false
  }
  changeView = (index) => {
    this.setState({singleDisplayIndex: index})
  }
  showNews = () => {
    return <>
      {this.state.showAllNews ? news.map(n => <NewsItem key={n.created_utc} {...n}/>) :
        <>
          {news.map(n => <NewsItem key={n.created_utc} {...n}/>).slice(0,5)}
          <li><a className='collapseToggle' onClick={() => this.setState({showAllNews:true})}>[+] show all</a></li>
        </>
      }
    </>
  }
  componentDidMount() {
    makeDonateVisible()
    getWhatPeopleSay()
    .then(({reddit, pushshift, moderators}) => {
      const combined = combinePushshiftAndRedditComments(pushshift.comments, reddit.comments, false)
      setPostAndParentDataForComments(Object.values(combined), reddit.parents_and_posts)
      this.setState({comments: filterDeletedComments(combined)})
      if (moderators) {
        this.props.global.setState({moderators})
      }
    })
  }
  render() {
    const props = this.props
    if (props.global.state.statusImage !== undefined) {
      props.global.clearStatus()
    }
    let singleDisplayComment = null
    let hasNext = false, hasPrev = false
    let nextAttr = {}, prevAttr = {}
    if (this.state.singleDisplayIndex >= 0) {
      singleDisplayComment = this.state.comments[this.state.singleDisplayIndex]
      if (this.state.singleDisplayIndex > 0) {
        hasPrev = true
        prevAttr = {onClick: (e) => this.changeView(this.state.singleDisplayIndex-1)}
      }
      if (this.state.singleDisplayIndex < this.state.comments.length-1) {
        hasNext = true
        nextAttr = {onClick: (e) => this.changeView(this.state.singleDisplayIndex+1)}
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
        <InternalPage>
          <div className='about section'>
            {message &&
              <div className='message'>
                {message}
              </div>
            }
            <ContentWithHeader header='About'>
              <BlankUser/>
              <Highlight showMobile={true}/>
            </ContentWithHeader>
          </div>
          <ContentWithHeader header='What people say' className='section' id='say'>
            {this.state.comments.length ?
              singleDisplayComment ?
                <React.Fragment>
                  <div className='non-item pagination'>
                    <a  {...prevAttr}
                       className={`collapseToggle prev ${hasPrev ? 'active':'disabled'}`}>&lt;- previous</a>
                    <a {...nextAttr}
                            className={`collapseToggle next ${hasNext ? 'active':'disabled'}`}>next -&gt;</a>
                  </div>
                  <Comment key={singleDisplayComment.id} {...singleDisplayComment}/>
                  <div className='non-item'><a onClick={(e) => this.changeView(-1)}
                          className='collapseToggle'>[+] view all</a>
                  </div>
                </React.Fragment>
                :
                <React.Fragment>
                  <div className='non-item'><a onClick={(e) => this.changeView(0)}
                          className='collapseToggle'>[–] show less</a>
                  </div>
                  {this.state.comments.map(c => <Comment key={c.id} {...c}/>)}
                  <div className='non-item'><a onClick={(e) => this.changeView(0)}
                          className='collapseToggle'>[–] show less</a>
                  </div>
                </React.Fragment>
            : ''}
          </ContentWithHeader>
          <Row>
            <ContentWithHeader header='News' half={true}>
              <ul className='news'>
                {this.showNews()}
              </ul>
            </ContentWithHeader>
            <ContentWithHeader header='Site usage' half={true}>
              <p>Insert <span className='v'>ve</span> into the URL of any reddit page.</p>
              <ul>
                <li><a href={PATH_STR_USER+'/redditor_3975/'}>user/redditor_3975</a></li>
                <li><a href={PATH_STR_SUB+'/all/'}>r/all</a></li>
                <li><a href={PATH_STR_SUB+'/all/missing-comments/'}>r/all/missing-comments</a></li>
                <li><a href={PATH_STR_SUB+'/CantSayAnything/'}>r/CantSayAnything</a></li>
                <li><a href={PATH_STR_SUB+'/CantSayAnything/comments'}>r/.../comments</a></li>
                <li><a href={PATH_STR_SUB+'/CantSayAnything/about/sticky'}>r/.../comments/link-id/</a></li>
                <li><a href='/domain/cnn.com+edition.cnn.com'>domain/cnn.com+ edition.cnn.com</a></li>
                <li><a href={PATH_STR_SUB+'/news+worldnews/'}>r/news+worldnews/</a></li>
                <li><a href={PATH_STR_SUB+'/worldnews/duplicates/eb2hjw'}>other-discussions+</a></li>
              </ul>
            </ContentWithHeader>
          </Row>
          <Row>
            <ContentWithHeader header='Donate' half={true}>
              <p>reveddit is free and ad-free. You can support work like this with a <Link to='donate'>donation</Link>, <Link to='contact'>feedback</Link>, or <NewWindowLink href='https://github.com/reveddit/reveddit'>pull requests</NewWindowLink>.</p>
              <p>Thank you!</p>
            </ContentWithHeader>
          </Row>
          <footer>
            <Link to='contact'>contact</Link>
            <Link to='contact#privacy'>privacy</Link>
            <Link to='donate'>donate</Link>
          </footer>
        </InternalPage>
    )
  }
}

export const Row = ({children}) => <div className='sections'>{children}</div>

export default connect(About)
