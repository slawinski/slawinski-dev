<template>
  <Layout>
    <h1 class="text-headline leading-none font-publicsans font-bold tracking-tight text-4xl sm:text-7xl mb-10">Sign up and I'll email you whenever anything interesting comes up.</h1>
    <div>
      <form class="flex justify-center items-center">
        <input type="email" v-model="email" class="py-1 px-3 w-full shadow appearance-none border rounded font-ptsans text-xl sm:text-2xl text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Your email adress" required>
        <button @click.prevent="submit" class="sm:mt-0 ml-4 py-1 px-2 bg-transparent hover:bg-button text-button text-xl sm:text-2xl font-publicsans font-bold hover:text-white border border-button hover:border-transparent rounded" >Subscribe</button>
      </form>
    </div>
  </Layout>
</template>

<script>
  import axios from 'axios'

  export default {
  metaInfo: {
    title: 'Newsletter'
  },
  data() {
    return {
      email: '',
    }
  },
  methods: {
    async submit() {
      try {
        await axios.post('/api/subscribe',
          {
            email: this.email
          }
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
