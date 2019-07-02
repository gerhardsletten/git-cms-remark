const chokidar = require('chokidar')
const fs = require(`fs`)
const path = require(`path`)
const { createFileNode, createContentDigest } = require(`./create-file-node`)
const createRemarkNode = require(`./create-remark-node`)
const uuidv5 = require(`uuid/v5`)
const _ = require(`lodash`)

const createNodeId = (path) => uuidv5(path, uuidv5.URL)

const NODES = []

const createNode = (node) => {
  NODES.push(node)
}
const updateNode = (nodeId, node) => {
  const found = NODES.find(({id}) => id === nodeId)
  Object.keys(node).forEach((k) => {
    found[k] = node[k]
  })
}
const createParentChildLink = ({ parent, child }) => {
  const parentNode = NODES.find(({id}) => id === parent.id)
  parentNode.children.push(child.id)
}

const loadNodeContent = async(node) => {
  if (_.isString(node.internal.content)) {
    return node.internal.content
  } else {
    return new Promise((resolve, reject) => {
      fs.readFile(node.absolutePath, `utf-8`, (err, content) => {
        if (err) {
          return reject(err)
        }
        resolve(content)
      })
    })
  }
}

exports.parser = async(options = {}) => {
  const createAndProcessNode = path => {
    const fileNodePromise = createFileNode(
      path,
      createNodeId,
      options
    ).then(node => {
      createNode(node)
      return createRemarkNode({
        node,
        loadNodeContent,
        actions: {
          createNode,
          updateNode,
          createParentChildLink
        },
        createNodeId,
        createContentDigest
      })
    })
    return fileNodePromise
  }
  if (!fs.existsSync(options.path)) {
    throw new Error('Path not found')
  }
  if (!path.isAbsolute(options.path)) {
    options.path = path.resolve(process.cwd(), options.path)
  }
  let pathQueue = []
  const flushPathQueue = () => {
    let queue = pathQueue.slice()
    pathQueue = []
    return Promise.all(queue.map(createAndProcessNode))
  }
  const watcher = chokidar.watch(options.path, {
    ignored: [
      `**/*.un~`,
      `**/.DS_Store`,
      `**/.gitignore`,
      `**/.npmignore`,
      `**/.babelrc`,
      `**/yarn.lock`,
      `**/bower_components`,
      `**/node_modules`,
      `../**/dist/**`,
      ...(options.ignore || []),
    ],
  })
  watcher.on('add', path => {
    pathQueue.push(path)
  })
  watcher.on('addDir', path => {
    pathQueue.push(path)
  })
  return new Promise((resolve, reject) => {
    watcher.on('ready', () => {
      flushPathQueue().then(() => {
        resolve(NODES)
      }, reject)
    })
  })
}
