const { ottoman, connectOttoman } = require('./src/db');
const { createApp } = require('./src/app');

const app = createApp();

const main = async () => {
  try {
    await connectOttoman();
    await ottoman.start();
    const port = Number(process.env.APP_PORT || 4500);
    app.listen(port, () => {
      console.log(`API started at http://localhost:${port}`);
      console.log(`API docs at http://localhost:${port}/api-docs/`);
    });
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

main();
