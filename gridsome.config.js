// This is where project configuration and plugin options are located.
// Learn more: https://gridsome.org/docs/config

// Changes here require a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

module.exports = {
  siteName: 'slawinski.dev',
  siteUrl: 'https://slawinski.dev',
  siteDescription: 'Piotr Slawinski thinks you might like it',
  metadata: {
    siteOgImage:
      'https://res.cloudinary.com/slawinski-dev/image/upload/w_1280,h_669,c_fill,q_auto,f_auto/w_760,c_fit,co_rgb:000000,g_south_west,x_50,y_300,l_text:arial_64_bold:slawinski.dev/w_760,c_fit,co_rgb:000000,g_north_west,x_50,y_400,l_text:arial_48:Spreading%20love%20for%20webdev%20one%20blog%20post%20at%20a%20time/social-image_ptyaka',
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
  ],
  transformers: {
    remark: {
      // global remark options
    },
  },
};
