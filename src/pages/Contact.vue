<template>
  <Layout>
    <h1 class="text-headline leading-none font-sans font-bold tracking-tight text-4xl sm:text-7xl mb-10">Any questions? Ideas? Drop me an email and I'll see what I can do.</h1>
    <form class="flex flex-col">
      <input type="text" v-model="senderName" class="mb-5 py-1 px-3 w-full shadow appearance-none border rounded font-body text-xl sm:text-2xl text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Name" required>
      <input type="email" v-model="senderEmail" class="mb-5 py-1 px-3 w-full shadow appearance-none border rounded font-body text-xl sm:text-2xl text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Your email adress" required>
      <textarea type="text" v-model="message" class="resize-y mb-5 py-1 px-3 w-full shadow appearance-none border rounded font-body text-xl sm:text-2xl text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="What's on your mind?" required></textarea>
      <button @click.prevent="submit" class="self-end sm:mt-0 py-1 px-2 bg-transparent hover:bg-button text-button font-body text-xl sm:text-2xl font-sans font-bold hover:text-white border border-button hover:border-transparent rounded" >Submit</button>
    </form>  </Layout>
</template>

<script>
import axios from 'axios'

export default {
  metaInfo: {
    title: 'Contact'
  },
  data() {
    return {
      senderName: '',
      senderEmail: '',
      message: '',
    }
  },
  methods: {
    async submit() {
      try {
        await axios.post('/api/sendmail',
          {
            senderName: this.senderName,
            senderEmail: this.senderEmail,
            message: this.message,
          }
        )
      } catch (err) {
        console.error(err)
      } finally {
        this.senderName = '';
        this.senderEmail = '';
        this.message = '';
    }
    }
  }
}
</script>
