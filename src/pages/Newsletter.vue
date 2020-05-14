<template>
  <Layout>
    <h1 class="text-headline leading-none font-publicsans font-bold tracking-tight text-4xl sm:text-7xl mb-10">Sign up and I'll email you whenever anything new comes up on the blog</h1>
    <form class="flex justify-center items-center">
      <input type="email" v-model="email" class="py-1 px-3 shadow appearance-none border rounded text-xl sm:text-5xl text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Your email adress" required>
      <button @click.prevent="submit" class="sm:mt-0 ml-4 py-1 px-1 bg-transparent hover:bg-button text-button text-xl sm:text-5xl font-publicsans font-bold hover:text-white border border-button hover:border-transparent rounded" >Subscribe</button>
    </form>  </Layout>
</template>

<script>
export default {
  metaInfo: {
    title: 'Newsletter'
  }
}
</script>
