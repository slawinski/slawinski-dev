<template>
  <Layout>
    <h1 class="text-headline leading-none font-publicsans font-bold tracking-tight text-4xl sm:text-7xl mb-10">Check out what I've been up to lately</h1>
    <div class="block sm:flex sm:justify-around">
    <div class="mb-8 sm:mb-0 max-w-sm rounded overflow-hidden shadow-lg">
      <g-link to="https://slawinski.github.io/chemtrails-guru/">
        <img class="transition duration-500 ease-in-out transform hover:scale-105 h-64 w-full object-cover" src="../assets/chemtrails-guru.png" alt="Map with plane markers">
      </g-link>
      <div class="px-6 py-4 flex justify-between items-baseline">
        <div class="text-paragraph font-publicsans font-bold leading-tight text-2xl mb-2">Chemtrails Guru</div>
        <g-link to="https://github.com/slawinski/chemtrails-guru">
          <svg class="h-8 w-8 sm:h-5 sm:w-5 fill-current text-headline hover:text-gray-700" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
          </svg>
        </g-link>
      </div>
      <div class="px-6 py-4">
        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-paragraph font-ptsans leading-tight text-xl mr-2">#Vue 3.0</span>
        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-paragraph font-ptsans leading-tight text-xl mr-2">#Leaflet</span>
      </div>
    </div>

    <div class="mb-b sm:mb-0 max-w-sm rounded overflow-hidden shadow-lg">
      <g-link to="https://slawinski.dev/">
        <img class="transition duration-500 ease-in-out transform hover:scale-105 h-64 w-full object-cover" src="../assets/slawinski-dev.png" alt="it's this website">
      </g-link>
      <div class="px-6 py-4 flex justify-between items-baseline">
        <div class="text-paragraph font-publicsans font-bold leading-tight text-2xl mb-2">This website</div>
        <g-link to="https://github.com/slawinski/slawinski-dev">
          <svg class="h-8 w-8 sm:h-5 sm:w-5 fill-current text-headline hover:text-gray-700" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
          </svg>
        </g-link>
      </div>
      <div class="px-6 py-4">
        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-paragraph font-ptsans leading-tight text-xl mr-2">#Gridsome</span>
        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-paragraph font-ptsans leading-tight text-xl mr-2">#NetlifyCMS</span>
        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-paragraph font-ptsans leading-tight text-xl mr-2">#Serverless</span>
      </div>
    </div>
    </div>
  </Layout>
</template>

<script>
export default {
  metaInfo: {
    title: 'Projects'
  }
}
</script>
