<template>
  <app name="page-trap">
    <div class="container text-center">
      <section class="row">
        <div class="col-12">
          <h1>Howdy, stranger</h1>

          <p class="lead">
            This is a <strong>URI:teller</strong> trap page.
          </p>
        </div>
      </section>

      <section class="row">
        <div class="col-12">
          <p class="lead">
            Want to find out more?
          </p>
          <p>
            <a :href="baseUrl" class="btn btn-primary btn-lg">Visit URI:teller now</a>
          </p>
        </div>
      </section>
    </div>
  </app>
</template>

<script>
export default {
  data() {
    return {
      baseUrl: null
    };
  },

  methods: {
    setState({ baseUrl }) {
      this.baseUrl = baseUrl;
    }
  }
};
</script>
