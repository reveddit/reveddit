const fs = require('fs')
const http = require('http')
const https = require('https')

// Match webpack.config.js logic:
// - Production: https://api.reveddit.com/short/what-people-say/
// - Development: http://localhost:5000/what-people-say/
const IS_NETLIFY = process.env.NETLIFY === 'true'
const IS_PRODUCTION = IS_NETLIFY || process.env.NODE_ENV === 'production'

const API_URL = IS_PRODUCTION
  ? 'https://api.reveddit.com/short/what-people-say/?c=prerender'
  : 'http://localhost:5000/what-people-say/?c=prerender'

const OUTPUT_PATH = './src/data/what-people-say.json'

console.log(`Fetching what-people-say data from ${API_URL}...`)

const protocol = API_URL.startsWith('https') ? https : http

protocol
  .get(API_URL, res => {
    if (res.statusCode !== 200) {
      console.error(`❌ API returned status ${res.statusCode}`)
      process.exit(1)
    }

    let data = ''
    res.on('data', chunk => (data += chunk))
    res.on('end', () => {
      try {
        // Validate JSON
        JSON.parse(data)

        fs.mkdirSync('./src/data', { recursive: true })
        fs.writeFileSync(OUTPUT_PATH, data)
        console.log('✅ Saved what-people-say.json')
      } catch (err) {
        console.error('❌ Invalid JSON response:', err.message)
        process.exit(1)
      }
    })
  })
  .on('error', err => {
    console.error('❌ Failed to fetch:', err.message)
    process.exit(1)
  })
