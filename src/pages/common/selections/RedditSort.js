import React from 'react'
import { connect } from 'state'
import { getSettings } from 'pages/user'

class RedditSort extends React.Component {
  state = {
    s: getSettings()
  }

  getLink(sort) {
    const url = new URL(window.location.href)
    url.searchParams.set('sort', sort)

    return (<div>
              <a className={sort === this.state.s.sort ? 'selected': ''}
                 href={`${url.pathname}${url.search}`}>{sort}</a>
            </div>)
  }

  render() {
    return (
        <div className='redditSort selection'>
          <div className='title'>Sort By</div>
          {['user'].includes(this.props.page_type) ?
            <React.Fragment>
              {this.getLink('new')}
              {this.getLink('top')}
              {this.getLink('hot')}
              {this.getLink('controversial')}
            </React.Fragment>
          :
            ''
          }
        </div>
    )
  }
}

export default connect(RedditSort)
