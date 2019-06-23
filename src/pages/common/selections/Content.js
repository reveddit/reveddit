import React from 'react'
import { connect } from 'state'

class Content extends React.Component {

  getLink(expected_suffix, content_type_description) {
    const path_parts = window.location.pathname.split('/')
    const suffix = path_parts.slice(3,4)[0] || ''
    const link_path_parts = path_parts.slice(0,3)
    link_path_parts.push(expected_suffix)
    const path = link_path_parts.join('/')
    return (<div>
              <a className=
                {suffix === expected_suffix ||
                  (this.props.page_type === 'subreddit_posts' &&
                   expected_suffix !== 'comments') ?
                 'selected': ''}
                 href={path}>{content_type_description}</a>
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
