// This is where project configuration and plugin options are located.
// Learn more: https://gridsome.org/docs/config

// Changes here require a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

const { HASURA_GRAPHQL_ENDPOINT, GRIDSOME_BASE_PATH } = process.env;
const SITE_NAME = 'slawinski.dev';
const SITE_DESCRIPTION =
  'Spreading love for the web dev one blog post at a time';

module.exports = {
  siteName: SITE_NAME,
  siteUrl: GRIDSOME_BASE_PATH,
  siteDescription: SITE_DESCRIPTION,
  metadata: {
    siteTagLine: SITE_DESCRIPTION,
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
        url: HASURA_GRAPHQL_ENDPOINT,
        fieldName: 'projects',
        typeName: 'projectTypes',
      },
    },
    {
      use: 'gridsome-plugin-feed',
      options: {
        contentTypes: ['Post'],
        feedOptions: {
          title: SITE_NAME,
          description: SITE_DESCRIPTION,
        },
        rss: {
          enabled: true,
          output: '/rss.xml',
        },
        nodeToFeedItem: ({ title, date, content }) => ({
          title,
          date,
          content,
        }),
      },
    },
  ],
  transformers: {
    remark: {
      // global remark options
    },
  },
};
