const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const updateRoute = require('./routes/gfg/update');
const recentRoute = require('./routes/gfg/getRecent');

const leetcode = require("./routes/leetcode/leetcode");
const codeforces = require("./routes/codeforces/codeforces");
const auth = require("./routes/auth/auth");


dotenv.config();
mongoose.connect(`mongodb+srv://dankparth:${process.env.MONGOOSE_PASS}@cluster0.rx37ifz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`).then(() => {
  console.log("connected to the db");
}).catch(err => {
  console.log(`an error occured : ${err}`);
})
const app = express();
app.use(express.json());



app.use('/gfg', updateRoute);
app.use('/gfg', recentRoute);
app.use('/leetcode', leetcode);
app.use('/codeforces', codeforces);
app.use("/auth", auth);


app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status).json({ "err": err.message });
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
