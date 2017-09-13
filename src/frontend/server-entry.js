import app from "./app";

export default context => {
  const { view, data } = context.state;
  return app(view, data);
};
