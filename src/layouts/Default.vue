<template>
  <div>
    <header class="my-4 pb-32 sm:flex sm:justify-between sm:items-center">
      <div class="flex items-center justify-between sm:p-0">
        <g-link to="/"><div class="text-headline font-publicsans font-extrabold tracking-tight text-xl sm:text-2xl">slawinski.<span class="text-button">dev</span></div></g-link>
        <div class="sm:hidden">
          <button @click="isOpen = !isOpen" type="button" class="p-2 block text-black hover:text-gray-600 focus:outline-none">
            <svg class="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path v-if="isOpen" fill-rule="evenodd" d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"/>
              <path v-else fill-rule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"/>
            </svg>
          </button>
        </div>
      </div>
      <nav :class="isOpen ? 'block' : 'hidden'" class="mt-4 py-3 px-5 pb-4 flex flex-col items-center sm:flex sm:flex-row sm:p-0 sm:m-0">
        <form>
          <input type="email" v-model="email" class="py-1 px-3 shadow appearance-none border rounded text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="email" required>
          <button @click.prevent="submit" class="ml-4 py-1 px-1 bg-transparent hover:bg-button text-button font-semibold hover:text-white border border-button hover:border-transparent rounded" >Subscribe</button>
        </form>
        <g-link class="sm:ml-4 block font-publicsans font-bold text-2xl sm:text-base text-headline hover:underline hover:text-gray-700" to="/">Blog</g-link>
        <g-link class="mt-6 sm:mt-0 sm:ml-4 block font-publicsans font-bold text-2xl sm:text-base text-headline hover:underline  hover:text-gray-700" to="/projects/">Projects</g-link>
        <div class="flex justify-between items-center">
          <g-link to="https://twitter.com/piotr_slawinski">
            <svg class="h-8 sm:h-5 w-8 sm:w-5 mt-6 sm:mt-0 mx-2 sm:ml-4 fill-current text-headline hover:text-gray-700" viewBox="328 355 335 276" xmlns="http://www.w3.org/2000/svg">
              <path d="M630 425a195 195 0 01-299 175 142 142 0 0097-30 70 70 0 01-58-47 70 70 0 0031-2 70 70 0 01-57-66 70 70 0 0028 5 70 70 0 01-18-90 195 195 0 00141 72 67 67 0 01116-62 117 117 0 0043-17 65 65 0 01-31 38 117 117 0 0039-11 65 65 0 01-32 35z"/>
            </svg>
          </g-link>
          <g-link to="https://github.com/slawinski">
            <svg class="h-8 w-8 sm:h-5 sm:w-5 mt-6 mx-2 sm:mt-0 sm:ml-4 fill-current text-headline hover:text-gray-700" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
          </g-link>
        </div>
      </nav>
    </header>

    <slot v-if="!isOpen"/>

  </div>
</template>

<static-query>
query {
  metadata {
    siteName
  }
}
</static-query>

<script>
  import axios from 'axios'
  export default {
    data() {
      return {
        isOpen: false,
        email: '',
      }
    },
    methods: {
     async submit() {
       try {
         await axios.post('/api/subscribe', {
           email: this.email
         },
         {
           headers: {
             'Content-Type': 'application/json'
           }
         },
       )
       } catch(err) {
         console.error(err)
       } finally {
         this.email = ''
       }
     },
    }
  }
</script>
