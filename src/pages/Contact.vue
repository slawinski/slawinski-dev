<template>
  <Layout>
    <h1
      class="text-headline leading-none font-sans font-bold tracking-tight text-4xl sm:text-7xl mb-10"
    >
      Any questions? Ideas? Drop me an email and I'll see what I can do.
    </h1>
    <form class="flex flex-col">
      <input
        v-model="senderName"
        type="text"
        class="mb-5 py-1 px-3 w-full shadow appearance-none border rounded font-body text-xl sm:text-2xl text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        placeholder="Name"
        aria-label="Sender Name"
        required
      />
      <input
        v-model="senderEmail"
        type="email"
        class="mb-5 py-1 px-3 w-full shadow appearance-none border rounded font-body text-xl sm:text-2xl text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        placeholder="Your email adress"
        aria-label="Sender Email"
        required
      />
      <textarea
        v-model="message"
        type="text"
        class="resize-y mb-5 py-1 px-3 w-full shadow appearance-none border rounded font-body text-xl sm:text-2xl text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        placeholder="What's on your mind?"
        aria-label="Message"
        required
      ></textarea>
      <button
        class="self-end sm:mt-0 py-1 px-2 bg-transparent hover:bg-button text-button font-body text-xl sm:text-2xl font-sans font-bold hover:text-white border border-button hover:border-transparent rounded"
        @click.prevent="submit({ senderName, senderEmail, message })"
        @keydown="submit({ senderName, senderEmail, message })"
      >
        {{ button }}
      </button>
    </form>
  </Layout>
</template>

<script>
// import axios from 'axios';
import { mapState, mapActions } from 'vuex';

export default {
  metaInfo: {
    title: 'Contact',
  },
  data() {
    return {
      senderName: '',
      senderEmail: '',
      message: '',
    };
  },
  computed: {
    ...mapState(['button']),
  },
  methods: {
    ...mapActions(['submit']),
    // async submit() {
    //   try {
    //     await axios.post('/api/sendmail', {
    //       senderName: this.senderName,
    //       senderEmail: this.senderEmail,
    //       message: this.message,
    //     });
    //   } catch (err) {
    //     console.error(err);
    //   } finally {
    //     this.senderName = '';
    //     this.senderEmail = '';
    //     this.message = '';
    //   }
    // },
  },
};
</script>
