import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'state'

const getEntityName = (params) => {
  const { user, subreddit = '', userSubreddit = '', domain = ''} = params
  return (user || subreddit || userSubreddit || domain).toLowerCase()
}

const opposites = {
  'r': {
    'path_type': 'user',
    'item_type': 'username',
    'display': '/user/'
  },
  'user': {
    'path_type': 'r',
    'item_type': 'subreddit',
    'display': '/r/'
  }
}

class Header extends React.Component {
  state = {
    entity_name: ''
  }
  componentDidMount() {
    const entity_name = getEntityName(this.props.match.params)
    this.setState({entity_name})
  }
  componentDidUpdate(prevProps) {
    const entity_name = getEntityName(this.props.match.params)
    const prev_entity_name = getEntityName(prevProps.match.params)
    if (entity_name !== prev_entity_name) {
      this.setState({entity_name})
    }
  }
  getForm(value, display, path_type, item_type, path_suffix, opposite=false) {
    let text_input_actions = {}
    let form_attributes = { className: `opposite ${path_type}` }
    if (! opposite) {
      form_attributes = {className: path_type}
      text_input_actions = {
        onClick: (e) => this.onClick(e, value),
        onBlur: (e) =>  this.onBlur(e, value),
        value: this.state.entity_name,
        onChange: this.handleNameChange
      }
    }

    return (
      <form {...form_attributes} onSubmit={(e) => this.handleSubmit(e, value)}>
        <a className='subheading' href={display}>{display}</a>
        <input type='text' {...text_input_actions}
        name={path_type} placeholder={item_type}/>
        {path_suffix &&
          <a className='subheading' href='#'>{`/${path_suffix}/`}</a>
        }
        <input type='submit' id='button' value='go' />
      </form>
    )
  }

  handleSubmit = (e, defaultValue) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const pair = Array.from(data.entries())[0]
    const key = pair[0], val = pair[1].trim().toLowerCase()
    if (val !== '' && (this.props.page_type === 'thread' || val !== defaultValue)) {
      this.setState({entity_name: val})
      window.location.href = `/${key}/${val}`
    }
  }
  onClick = (e, defaultValue) => {
    const val = e.target.value.trim().toLowerCase()
    if (val === defaultValue) {
      e.target.value = ''
    }
  }
  onBlur = (e, defaultValue) => {
    const val = e.target.value.trim().toLowerCase()
    if (val === '') {
      e.target.value = defaultValue
    }
  }
  handleNameChange = (e) => {
    this.setState({entity_name: e.target.value})
  }
  render() {
    const props = this.props
    const { page_type } = props
    let { user, subreddit = '', userSubreddit = '', domain = ''} = props.match.params
    if (userSubreddit) {
      subreddit = 'u_'+userSubreddit
    }
    let path_type = '', value = '', path_suffix = '', item_type = ''
    if (['subreddit_posts','thread'].includes(page_type)) {
      path_type = 'r'
      value = subreddit
      item_type = 'subreddit'
    } else if (page_type === 'subreddit_comments') {
      path_type = 'r'
      value = subreddit
      path_suffix = 'comments'
      item_type = 'subreddit'
    } else if (user) {
      path_type = 'user'
      value = user
      item_type = 'username'
    } else if (domain) {
      path_type = 'domain'
      value = domain
      item_type = 'domain'
    }
    value = value.toLowerCase()
    let display = `/${path_type}/`

    return (
      <React.Fragment>
        <header>
          <div id='header'>
            <div id='title_and_forms'>
              <h1>
                <Link to='/about'>re<span style={{color: 'white'}}>v</span>ddit</Link>
              </h1>
            </div>

            {value &&
              <div id='subheading'>
                {path_type in opposites &&
                  this.getForm('', opposites[path_type].display,
                                   opposites[path_type].path_type,
                                   opposites[path_type].item_type, '', true)
                }
                {this.getForm(value, display, path_type, item_type, path_suffix, false)}
              </div>
            }
          </div>
          <div id='status'>
            {props.global.state.statusText &&
            <p id='status-text'>{props.global.state.statusText}</p>}
            {props.global.state.statusImage &&
            <img id='status-image' src={props.global.state.statusImage} alt='status' />}
          </div>
        </header>
      </React.Fragment>
    )
  }
}

export default connect(Header)
