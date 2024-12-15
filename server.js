const express = require('express');
const sequelize = require('./Config/dbConnect');
const helmet = require('helmet');

const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();
app.use(helmet());
const bodyParser = require('body-parser');
const AboutRoutes = require('./Routes/AboutRoutes')
const AboutTeacher = require('./Routes/AboutTeacherRoutes')
const AvailableCards = require('./Routes/AvailableCardsRoutes')
const BasmaTrainningRoutes = require('./Routes/BasmaTrainningRoutes')
const BlogsRoutes = require('./Routes/BlogRoutes')




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use('/abouts',AboutRoutes)
app.use('/aboutTeacher',AboutTeacher)
app.use('/availablecards',AvailableCards)
app.use('/basmatrainning',BasmaTrainningRoutes)
app.use('/blog',BlogsRoutes)

app.use(express.json());

sequelize.sync({ force: false }).then(() => {
    console.log('Database connected and synced!');
  });
  
  app.get("/", (req, res) => {
    res.send("Welcome to Basma Academy! ");
  });

  
  app.listen(process.env.PORT || 6000, () => {
    console.log(`Server is running on port ${process.env.PORT || 6000}`);
  });
