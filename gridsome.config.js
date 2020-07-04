// This is where project configuration and plugin options are located.
// Learn more: https://gridsome.org/docs/config

// Changes here require a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

module.exports = {
  siteName: 'slawinski.dev',
  plugins: [
    {
      use: '@gridsome/source-filesystem',
      options: {
        path: 'blog/**/*.md',
        typeName: 'Post',
        remark: {
          // remark options
          plugins: [
            [
              '@noxify/gridsome-plugin-remark-embed',
              {
                enabledProviders: ['Youtube', 'Twitter', 'Gist'],
              },
            ],
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
  ],
  transformers: {
    remark: {
      // global remark options
    },
  },
};
