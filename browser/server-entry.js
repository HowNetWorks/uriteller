import app from "../lib/views/app";

export default context => {
  const { view, state } = context;
  context.state = { view, state };
  return app(view, state);
};
