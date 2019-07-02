const grayMatter = require(`gray-matter`)
const _ = require(`lodash`)

module.exports = async function onCreateNode(
  {
    node,
    loadNodeContent,
    actions
  },
  pluginOptions
) {
  const { updateNode } = actions

  // We only care about markdown content.
  if (
    node.internal.mediaType !== `text/markdown` &&
    node.internal.mediaType !== `text/x-markdown`
  ) {
    return {}
  }

  const content = await loadNodeContent(node)

  try {
    let data = grayMatter(content, pluginOptions)

    if (data.data) {
      data.data = _.mapValues(data.data, value => {
        if (_.isDate(value)) {
          return value.toJSON()
        }
        return value
      })
    }

    let markdownNode = {
      frontmatter: {
        title: ``,
        ...data.data,
      },
      excerpt: data.excerpt,
      mdContent: data.content
    }


    updateNode(node.id, markdownNode)
    return markdownNode
  } catch (err) {
    console.log(
      `Error processing Markdown ${
        node.absolutePath ? `file ${node.absolutePath}` : `in node ${node.id}`
      }:\n
      ${err.message}`
    )

    return {} // eslint
  }
}
