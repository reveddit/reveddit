import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useGlobalStore } from 'state'
import { Shuffle, TwitterWhite } from 'components/common/svg'

const getEntityName = params => {
  const { user, subreddit = '', domain = '' } = params
  return (user || subreddit || domain).toLowerCase()
}

const getTheme = () => {
  return localStorage.getItem('reveddit-theme') || 'dark'
}

const toggleTheme = () => {
  const current = getTheme()
  const next = current === 'light' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', next)
  localStorage.setItem('reveddit-theme', next)
  return next
}

const Header = props => {
  const global = useGlobalStore()
  const params = useParams()
  const navigate = useNavigate()
  const match = { params }
  const history = {
    push: (to: string, state?: any) => navigate(to, { state }),
    replace: (to: string, state?: any) => navigate(to, { replace: true, state }),
  }

  const [entity_name, setEntityName] = useState(() => getEntityName(params))
  const [random, setRandom] = useState(false)
  const [theme, setTheme] = useState(getTheme)

  useEffect(() => {
    setEntityName(getEntityName(params))
  }, [params.user, params.subreddit, params.domain])

  const getForm = (
    value,
    display,
    path_type,
    item_type,
    path_suffix,
    opposite = false
  ) => {
    let text_input_actions = {}
    let form_attributes = { className: `opposite ${path_type}` }
    if (!opposite) {
      form_attributes = { className: path_type }
      text_input_actions = {
        onClick: e => onClick(e, value),
        onBlur: e => onBlur(e, value),
        value: entity_name,
        onChange: handleNameChange,
      }
    }

    return (
      <form {...form_attributes} onSubmit={e => handleSubmit(e, value)}>
        <span className="subheading">{display}</span>
        <label htmlFor={item_type} className="hide-element">
          {item_type}
        </label>
        <input
          id={item_type}
          type="text"
          {...text_input_actions}
          name={path_type}
          placeholder={item_type}
          autoComplete={item_type}
        />
        {path_suffix && (
          <span className="subheading">{`/${path_suffix}/`}</span>
        )}
        <input type="submit" id="button" value="go" />
        {path_type === 'user' && (
          <button
            title="Look up a random redditor"
            id="button_shuffle"
            onClick={e => {
              e.preventDefault()
              setRandom(true)
            }}
          >
            <Shuffle wh="15" />
          </button>
        )}
      </form>
    )
  }

  const handleSubmit = (e, defaultValue) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const pair = Array.from(data.entries())[0]
    const key = pair[0],
      val = (pair[1] as string).trim().toLowerCase()
    if (
      val !== '' &&
      (props.page_type === 'thread' || val !== defaultValue)
    ) {
      setEntityName(val)
      history.push(`/${key}/${val}`)
    }
  }
  const onClick = (e, defaultValue) => {
    const val = e.target.value.trim().toLowerCase()
    if (val === defaultValue) {
      e.target.value = ''
    }
  }
  const onBlur = (e, defaultValue) => {
    const val = e.target.value.trim().toLowerCase()
    if (val === '') {
      e.target.value = defaultValue
    }
  }
  const handleNameChange = e => {
    setEntityName(e.target.value)
  }
  const settings = () => {
    props.openGenericModal({ hash: 'settings' })
  }
  const handleThemeToggle = () => {
    const newTheme = toggleTheme()
    setTheme(newTheme)
  }

  const { page_type } = props
  const { x_subreddit } = global.state
  if (random) {
    const sub = x_subreddit || 'all'
    // can't use history.push here b/c it won't reset state
    window.location.href = `/r/${sub}/x/` + window.location.search
  }
  let { user, subreddit = '', domain = '' } = match.params
  let path_type = '',
    value = '',
    path_suffix = '',
    item_type = '',
    display = ''
  if (['subreddit_posts', 'thread'].includes(page_type)) {
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
    display = 'u/'
    value = user
    item_type = 'username'
  } else if (domain) {
    path_type = 'domain'
    value = domain
    item_type = 'domain'
  }
  value = value.toLowerCase()
  if (!display) {
    display = `${path_type}/`
  }

  return (
    <React.Fragment>
      <header>
        <div id="header">
          <div id="site-name">
            <Link to="/about/">
              about <span className="rev">rev</span>eddit
            </Link>
          </div>
          <div id="nav">
            <a href="#settings" onClick={settings} className="nav-item">
              ⚙
            </a>
            <Link to="/about/faq/" className="nav-item">
              F.A.Q.
            </Link>
            <Link to="/add-ons/" className="nav-item">
              add-ons
            </Link>
            <TwitterWhite className="nav-item" />
            <button
              className="theme-toggle"
              onClick={handleThemeToggle}
              title="Toggle light/dark mode"
              aria-label="Toggle light/dark mode"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
          {value && (
            <div id="subheading">
              {getForm(
                value,
                display,
                path_type,
                item_type,
                path_suffix,
                false
              )}
            </div>
          )}
        </div>
        <div id="status">
          {global.state.statusText && (
            <p id="status-text">{global.state.statusText}</p>
          )}
          {global.state.statusImage && (
            <img
              id="status-image"
              src={global.state.statusImage}
              alt="status"
            />
          )}
        </div>
      </header>
    </React.Fragment>
  )
}

export default Header
