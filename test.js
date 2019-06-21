const {parser} = require('./src/parser');
const fs = require('fs-extra')

;(async function() {
  try {
    const result = await parser({path: './content'})
    console.log(`Wrote ${result.length} files`)
    fs.writeFileSync('testjson.json', JSON.stringify(result, null, 2), 'utf8')
    process.exit()
  } catch (error) {
    console.log('error', error)
  }
}());