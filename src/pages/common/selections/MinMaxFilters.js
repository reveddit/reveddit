import React, { useState, useEffect } from 'react'
import TextFilter from './TextFilter'
import { connect, urlParamKeys } from 'state'
import { SimpleURLSearchParams } from 'utils'

const filters = {
  'subscribers': {
    globalVarBase: 'num_subscribers',
    text: '# Subscribers',
    placeholder: '1000',
  },
  'num_comments': {
    globalVarBase: 'num_comments',
    text: '# Comments',
    placeholder: '100',
  },
  'score': {
    globalVarBase: 'score',
    text: 'Score',
    placeholder: '10',
  },
  'link_score': {
    globalVarBase: 'link_score',
    text: 'Link score',
    placeholder: '10',
  },
  'age': {
    globalVarBase: 'age',
    text: 'Age (mins.)',
    placeholder: '10',
  },
  'link_age': {
    globalVarBase: 'link_age',
    text: 'Link age (mins.)',
    placeholder: '10',
  }
}

const MinMaxFilters = ({page_type, global}) => {
  const [visibleFilters, setVisibleFilters] = useState({})
  const [minMax, setMinMax] = useState({})

  const addFilter = (e) => {
    e.preventDefault()
    for (const [key, type] of Object.entries(filters)) {
      if (! visibleFilters[key]) {
        setVisibleFilters({
          ...visibleFilters,
          [key]: {...type}
        })
        break
      }
    }
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
  return (
    <div className='selection numeric'>
      {Object.entries(visibleFilters).map(([key, value]) =>
        <TextFilter key={key} page_type={page_type} globalVarName={value.globalVarBase} placeholder={value.placeholder}
                    title={value.text} minMax={true}/>
      )}
      {Object.keys(visibleFilters).length < Object.keys(filters).length ?
        <div className='selection'>
          <a className='pointer' onClick={addFilter}>[+] add # filter</a>
        </div>
      : null}
    </div>
  )
}

export default connect(MinMaxFilters)
