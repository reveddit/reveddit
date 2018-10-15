import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from '../../state'
import { getSettings } from '../user'

class Header extends React.Component {
  getSortLink(sort) {
    const { user, kind = ''} = this.props.match.params
    const s = getSettings()
    return <a key={sort} className={sort === s.sort ? 'selected': ''} href={`/user/${user}/${kind}?sort=${sort}`}>{sort}</a>
  }
  render() {
    const props = this.props
    const { user, kind = ''} = props.match.params
    let userHeader = ''
    let userNav = ''
    if (user) {
      const userLink = `/user/${user}`
      userHeader = <a className='subheading' href={userLink}>{userLink}</a>
      userNav = (
        <React.Fragment>
            <nav>
              <a className={kind === 'overview' || kind === '' ? 'selected': ''} href={`${userLink}/`}>overview</a>
              <a className={kind === 'comments' ? 'selected': ''} href={`${userLink}/comments`}>comments</a>
              <a className={kind === 'submitted' ? 'selected': ''} href={`${userLink}/submitted`}>submitted</a>
            <br/>
              {this.getSortLink('new')}
              {this.getSortLink('top')}
              {this.getSortLink('hot')}
              {this.getSortLink('controversial')}
            </nav>
        </React.Fragment>
      )
    }
    return (
      <React.Fragment>
        <header>
          <div id='header'>
            <h1>
              <Link to='/about'>revddit</Link>
            </h1>
            {userHeader}
          </div>
          <div id='status'>
            {props.global.state.statusText &&
            <p id='status-text'>{props.global.state.statusText}</p>}
            {props.global.state.statusImage &&
            <img id='status-image' src={props.global.state.statusImage} alt='status' />}
          </div>
        </header>
        {userNav}
      </React.Fragment>
    )
  }
}

export default connect(Header)
