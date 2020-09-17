// This is where project configuration and plugin options are located.
// Learn more: https://gridsome.org/docs/config

// Changes here require a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

module.exports = {
  siteName: 'slawinski.dev',
  siteUrl: 'https://slawinski.dev',
  siteDescription: 'Piotr Slawinski thinks you might like it',
  metadata: {
    siteTagLine: 'Spreading love for the web dev one blog post at a time',
  },
  plugins: [
    {
      use: '@gridsome/source-filesystem',
      options: {
        path: 'blog/**/*.md',
        typeName: 'Post',
        remark: {
          // remark options
          plugins: [
            ['gridsome-plugin-remark-youtube'],
            ['gridsome-plugin-remark-twitter'],
            [
              'gridsome-plugin-remark-shiki',
              { theme: 'light_plus', skipInline: true },
            ],
          ],
        },
      },
    },
    {
      use: 'gridsome-plugin-tailwindcss',
    },
    {
      use: 'gridsome-source-graphql',
      options: {
        url: process.env.HASURA_GRAPHQL_ENDPOINT,
        fieldName: 'projects',
        typeName: 'projectTypes',
      },
    },
    {
      use: 'gridsome-plugin-rss',
      options: {
        contentTypeName: 'Post',
        feedOptions: {
          title: 'slawinski.dev',
          feed_url: 'https://slawinski.dev/rss.xml',
          site_url: 'https://slawinski.dev',
        },
        feedItemOptions: (node) => ({
          title: node.title,
          description: node.description,
          url: 'https://slawinski.dev/blog/' + node.path,
          date: node.date || node.fields.date,
          content: node.content,
        }),
        output: {
          dir: './static',
          name: 'rss.xml',
        },
      },
    },
  ],
  transformers: {
    remark: {
      // global remark options
    },
  },
};
