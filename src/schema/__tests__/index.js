const { graphql } = require(`graphql`)
const createShema = require('..')

const pages = [{
  id: '1',
  slug: '/',
  content: 'Homepage content',
  parentId: null,
  frontmatter: {
    title: 'Homepage',
    order: 1,
    meta: {
      description: 'Seo description'
    }
  }
}, {
  id: '2',
  slug: '/about',
  content: 'About content',
  parentId: '1',
  frontmatter: {
    title: 'About',
    order: 2,
    meta: {
      description: 'Seo description'
    }
  }
}, {
  id: '3',
  slug: '/contact',
  content: 'Contact content',
  parentId: '1',
  frontmatter: {
    title: 'Contact',
    order: 3,
    meta: {
      description: 'Seo description'
    }
  }
}]

describe(`Graphql api for pages`, () => {
  const schema = createShema({pages})
  const runQuery = query => graphql(schema, query)

  it(`Query frontpage`, async() => {
    const query = `
      {
        test: page(slug:"/") {
          id
          slug
          content
          frontmatter {
            title
            meta {
              description
            }
          }
        }
      }
    `
    const results = await runQuery(query)
    const expected = {
      test: {
        id: '1',
        slug: '/',
        content: 'Homepage content',
        frontmatter: {
          title: 'Homepage',
          meta: {
            description: 'Seo description'
          }
        }
      }
    }
    expect(results.errors).toBeUndefined()
    expect(results.data).toEqual(expected)
  })

  it(`Query subpage`, async() => {
    const query = `
      {
        test: page(slug:"/about") {
          id
          slug
          content
          path {
            slug
            frontmatter {
              title
            }
          }
          parent {
            id
          }
        }
      }
    `
    const results = await runQuery(query)
    const expected = {
      test: {
        id: '2',
        slug: '/about',
        content: 'About content',
        path: [{
          slug: '/',
          frontmatter: {
            title: "Homepage"
          }
        }, {
          slug: '/about',
          frontmatter: {
            title: "About"
          }
        }],
        parent: {
          id: "1"
        }
      }
    }
    expect(results.errors).toBeUndefined()
    expect(results.data).toEqual(expected)
  })

  it(`Query children in order`, async() => {
    const query = `
      {
        test: page(slug:"/") {
          children (orderBy:frontmatter_order_DESC) {
            count
            nodes {
              id
              slug
            }
          }
        }
      }
    `
    const results = await runQuery(query)
    const expected = {
      test: {
        children: {
          count: 2,
          nodes: [{
            id: "3",
            slug: "/contact"
          }, {
            id: "2",
            slug: "/about"
          }]
        }
      }
    }
    expect(results.errors).toBeUndefined()
    expect(results.data).toEqual(expected)
  })

  it(`Query all pages`, async() => {
    const query = `
      {
        test: pages {
          count
          nodes {
            id
            slug
          }
        }
      }
    `
    const results = await runQuery(query)
    const expected = {
      test: {
        count: 3,
        nodes: [{
          id: "1",
          slug: "/"
        }, {
          id: "2",
          slug: "/about"
        }, {
          id: "3",
          slug: "/contact"
        }]
      }
    }
    expect(results.errors).toBeUndefined()
    expect(results.data).toEqual(expected)
  })

  it(`Query all pages with with limit and skip`, async() => {
    const query = `
      {
        test: pages(orderBy:frontmatter_order_ASC, limit: 1, skip: 1 ) {
          count
          nodes {
            id
            slug
          }
        }
      }
    `
    const results = await runQuery(query)
    const expected = {
      test: {
        count: 3,
        nodes: [{
          id: "2",
          slug: "/about"
        }]
      }
    }
    expect(results.errors).toBeUndefined()
    expect(results.data).toEqual(expected)
  })

  it(`Query all pages with filter`, async() => {
    const query = `
      {
        test: pages( where:{frontmatter_order__eq:2} ) {
          count
          nodes {
            id
            slug
          }
        }
      }
    `
    const results = await runQuery(query)
    const expected = {
      test: {
        count: 1,
        nodes: [{
          id: "2",
          slug: "/about"
        }]
      }
    }
    expect(results.errors).toBeUndefined()
    expect(results.data).toEqual(expected)
  })
})
