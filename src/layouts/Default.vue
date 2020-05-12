<template>
  <div>
    <header class="my-4 pb-32 relative sm:flex sm:justify-between sm:items-center">
      <div class="flex items-center justify-between sm:p-0">
        <g-link to="/"><div class="text-headline font-publicsans font-extrabold tracking-tight text-xl sm:text-2xl">slawinski.<span class="text-button">dev</span></div></g-link>
        <div class="sm:hidden">
          <button @click="isOpen = !isOpen" type="button" :class="isOpen ? 'neo-button-depressed' : 'neo-button'" class="p-2 neo-button active:neo-button-depressed block text-black hover:text-gray-600 focus:outline-none">
            <svg class="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path v-if="isOpen" fill-rule="evenodd" d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"/>
              <path v-else fill-rule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"/>
            </svg>
          </button>
        </div>
      </div>
      <nav :class="isOpen ? 'block' : 'hidden'" class="neo-button-depressed mt-4 py-3 absolute right-0 px-5 pb-4 sm:flex sm:p-0 sm:m-0 sm:shadow-none">
        <g-link class="block px-2 font-ptsans font-bold hover:underline text-headline visited:text-purple-600" to="/">Blog</g-link>
        <g-link class="mt-6 block px-2 font-ptsans font-bold hover:underline text-headline sm:mt-0 sm:ml-2 visited:text-purple-600" to="/projects/">Projects</g-link>
      </nav>
    </header>

    <slot/>

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
  export default {
    data() {
      return {
        isOpen: false,
      }
    },
  }
</script>
