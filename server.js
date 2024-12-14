const express = require('express');
const sequelize = require('./Config/dbConnect');
const helmet = require('helmet');

const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();
app.use(helmet());

const AboutRoutes = require('./Routes/AboutRoutes')
const AboutTeacher = require('./Routes/AboutTeacherRoutes')



app.use('/abouts',AboutRoutes)
app.use('/aboutTeacher',AboutTeacher)




sequelize.sync({ force: false }).then(() => {
    console.log('Database connected and synced!');
  });
  
  app.get("/", (req, res) => {
    res.send("Welcome to Basma Academy! ");
  });

  
  app.listen(process.env.PORT || 6000, () => {
    console.log(`Server is running on port ${process.env.PORT || 6000}`);
  });
