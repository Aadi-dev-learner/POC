const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const updateRoute = require('./routes/update');
const recentRoute = require('./routes/getRecent');

dotenv.config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('DB error:', err));

app.use('/api', updateRoute);
app.use('/api', recentRoute);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
