<template>
  <div id="app" :class="name">
    <nav class="navbar fixed-top navbar-light bg-faded">
      <div class="container">
        <a class="navbar-brand" href="/">URI:teller</a>
      </div>
    </nav>

    <slot />

    <footer class="footer text-muted">
      <div class="container text-center">
        <hr />

        <div class="float-left logo">
          HowNetWorks
        </div>

        <div class="float-right blurb">
          Made with &#9986; in Finland
        </div>

        <div class="social">
          <a class="icon github" href="https://github.com/HowNetWorks/uriteller" title="URI:teller GitHub repository" target="_blank" rel="noopener noreferrer"></a>
          <a class="icon twitter" href="https://twitter.com/HowNetWorksIO" title="HowNetWorks in Twitter" target="_blank" rel="noopener noreferrer"></a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import "./app.scss";

export default {
  props: ["name"]
};
</script>
