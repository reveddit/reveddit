import React from 'react'
import { connect } from 'state'
import { getSettings } from 'pages/user'

class Content extends React.Component {
  state = {
    s: getSettings()
  }

  getLink(path_suffix, text) {
    const url = new URL(window.location.href)
    const path_parts = url.pathname.split('/')
    let kind = path_parts.splice(3,1)[0]
    if (! kind) {
      kind = ''
    }
    const link_path_parts = path_parts.splice(0,3)
    link_path_parts.push(path_suffix)
    const path = link_path_parts.join('/')
    return (<div>
              <a className={kind === path_suffix ? 'selected': ''}
                 href={`${path}${url.search}`}>{text}</a>
            </div>)
  }

  render() {
    return (
        <div className='content selection'>
          <div className='title'>Content</div>
          {['user'].includes(this.props.page_type) &&
            <React.Fragment>
              {this.getLink('', 'comments and posts')}
              {this.getLink('comments', 'comments')}
              {this.getLink('submitted', 'posts')}
            </React.Fragment>
          }
          {['subreddit_posts', 'subreddit_comments'].includes(this.props.page_type) &&
            <React.Fragment>
              {this.getLink('', 'posts')}
              {this.getLink('comments', 'comments')}
            </React.Fragment>
          }
        </div>
    )
  }
}

export default connect(Content)
