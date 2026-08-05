require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`ManwhaFinder backend running on http://localhost:${PORT}`);
});
