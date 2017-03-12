import app from "../app";

export default context => {
  const { view, state } = context;
  context.state = { view, state };
  return app(view, state);
};
