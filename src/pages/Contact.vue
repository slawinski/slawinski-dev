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
        class="mb-5 py-1 px-3 w-full shadow appearance-none border rounded font-sans text-xl sm:text-2xl text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        placeholder="Name"
        aria-label="Sender Name"
        required
      />
      <input
        v-model="senderEmail"
        type="email"
        class="mb-5 py-1 px-3 w-full shadow appearance-none border rounded font-sans text-xl sm:text-2xl text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        placeholder="Your email adress"
        aria-label="Sender Email"
        required
      />
      <textarea
        v-model="message"
        type="text"
        class="resize-y mb-5 py-1 px-3 w-full shadow appearance-none border rounded font-sans text-xl sm:text-2xl text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        placeholder="What's on your mind?"
        aria-label="Message"
        required
      ></textarea>
      <button
        class="self-end bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary border-gradient-r-orange-magenta hover:bg-clip-border hover:from-primary hover:to-secondary hover:text-paragraph-inverted border-4 sm:mt-0 ml-4 py-1 px-2 text-xl sm:text-2xl font-sans font-bold"
        @click.prevent="
          submit({
            data: { senderName, senderEmail, message },
            lambda: 'sendmail',
          })
        "
        @keydown="
          submit({
            data: { senderName, senderEmail, message },
            lambda: 'sendmail',
          })
        "
      >
        {{ button }}
      </button>
    </form>
  </Layout>
</template>

<script>
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
  },
};
</script>
