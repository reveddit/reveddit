import React from 'react'
import { connect } from 'state'

const r_all = 'r/all top 100'

class Content extends React.Component {

  getLink(expected_suffix, content_type_description) {
    const frontPage = this.props.global.state.frontPage
    const path_parts = window.location.pathname.split('/')
    const suffix = path_parts.slice(3,4)[0] || ''
    const link_path_parts = path_parts.slice(0,3)
    link_path_parts.push(expected_suffix)
    const path = link_path_parts.join('/').replace(/\/$/,'')
    let selected = ''
    let params = ''
    if (suffix === expected_suffix ||
          (this.props.page_type === 'subreddit_posts' &&
           expected_suffix !== 'comments')) {
      if (content_type_description === r_all) {
        params = '?frontPage=true'
        if (frontPage) {
          selected = 'selected'
        }
      } else if (! frontPage) {
        selected = 'selected'
      }
    }
    return (<div>
              <a className={selected} href={path+params}>
                {content_type_description}
              </a>
            </div>)
  }

  render() {
    const {subreddit} = this.props
    return (
        <div className='content selection'>
          <div className='title'>Content</div>
          {['user'].includes(this.props.page_type) &&
            <React.Fragment>
              {this.getLink('', 'comments and posts')}
              {this.getLink('comments', 'comments')}
              {this.getLink('submitted', 'posts')}
              {this.getLink('gilded', 'gilded')}
            </React.Fragment>
          }
          {['subreddit_posts', 'subreddit_comments'].includes(this.props.page_type) &&
            <React.Fragment>
              {this.getLink('', 'posts')}
              { subreddit !== 'all' &&
                this.getLink('', r_all)
              }
              {this.getLink('comments', 'comments')}
            </React.Fragment>
          }
        </div>
    )
  }
}

export default connect(Content)
