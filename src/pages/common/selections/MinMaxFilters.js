import React, { useState, useEffect } from 'react'
import TextFilter from './TextFilter'
import { connect, urlParamKeys } from 'state'
import { SimpleURLSearchParams } from 'utils'
import { QuestionMarkModal, Help } from 'components/Misc'

const appears = " of the post in which the comment appears"
const go = " Click 'go' after setting if the button appears"
const filters = {
  'subscribers': {
    globalVarBase: 'num_subscribers',
    text: '# Subscribers',
    placeholder: '1000',
    desc: 'Number of subreddit subscribers',
  },
  'num_comments': {
    globalVarBase: 'num_comments',
    text: '# Comments',
    placeholder: '100',
    desc: 'Number of comments on the post',
  },
  'score': {
    globalVarBase: 'score',
    text: 'Score',
    placeholder: '10',
    desc: 'Score of the item',
  },
  'link_score': {
    globalVarBase: 'link_score',
    text: 'Link score',
    placeholder: '10',
    desc: `Score${appears}`,
  },
  'age': {
    globalVarBase: 'age',
    text: 'Age (mins.)',
    placeholder: '10',
    desc: 'Age in minutes of the item',
  },
  'link_age': {
    globalVarBase: 'link_age',
    text: 'Link age (mins.)',
    placeholder: '10',
    desc: `Age in minutes${appears}`,
  },
  'comment_length': {
    globalVarBase: 'comment_length',
    text: 'Comment length',
    placeholder: '100',
    desc: 'Number of characters in the comment',
  },
  'account_age': {
    globalVarBase: 'account_age',
    text: 'Account age (days)',
    placeholder: '10',
    desc: `Account age in days at the time of posting.${go}`,
  },
  'account_combined_karma': {
    globalVarBase: 'account_combined_karma',
    text: 'Combined karma',
    placeholder: '100',
    desc: `The account's current combined karma.${go}`,
  },
}

const HelpEntry = ({text, desc}) => <p><span style={{fontWeight:'bold'}}>{text}: </span>{desc}.</p>


const minMax_help = <Help title='Min/Max numeric filter' content={<>
  <p>Set a minimum or maximum for numeric fields,</p>
  {Object.values(filters).map(filter => <HelpEntry key={filter.globalVarBase} {...filter}/>)}
</>}/>


const MinMaxFilters = ({page_type, global}) => {
  const [visibleFilters, setVisibleFilters] = useState({})
  const [minMax, setMinMax] = useState({})

  const addThisFilter = (e) => {
    e.preventDefault()
    setVisibleFilters({
      ...visibleFilters,
      [e.target.value]: {...filters[e.target.value]}
    })
  }
  const removeFilter = (key) => {
    const newFilters = {...visibleFilters}
    delete newFilters[key]
    setVisibleFilters(newFilters)
  }
  // set displayed # filters on page load
  useEffect(() => {
    const queryParams = new SimpleURLSearchParams(window.location.search)
    const onPageLoad_visibleFilters = {}
    for (const [key, type] of Object.entries(filters)) {
      if (queryParams.has(urlParamKeys[type.globalVarBase+'_min']) ||
          queryParams.has(urlParamKeys[type.globalVarBase+'_max'])) {
        onPageLoad_visibleFilters[key] = {...type}
      }
    }
    if (Object.keys(onPageLoad_visibleFilters).length) {
      setVisibleFilters(onPageLoad_visibleFilters)
    }
  }, [])
  const hiddenFilters = Object.keys(filters).filter(x => ! visibleFilters[x])
  return (
    <div className='selection numeric'>
      {Object.entries(visibleFilters).map(([key, value]) =>
        <TextFilter key={key} page_type={page_type} globalVarName={value.globalVarBase} placeholder={value.placeholder}
                    title={value.text} minMax={true} removeFilter={() => removeFilter(key)}/>
      )}
      {Object.keys(visibleFilters).length < Object.keys(filters).length ?
        <div className='selection'>
          <select value='' onChange={addThisFilter}>
            <option className='default' value=''>[+] add # filter</option>
            {hiddenFilters.map(x => <option key={x} value={x}>{filters[x].text}</option>)}
          </select>
          <QuestionMarkModal modalContent={{content:minMax_help}}/>
        </div>
      : null}
    </div>
  )
}

export default connect(MinMaxFilters)
