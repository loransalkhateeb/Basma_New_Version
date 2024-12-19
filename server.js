const express = require('express');
const sequelize = require('./Config/dbConnect');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const bodyParser = require('body-parser');
const client = require('./Utils/redisClient'); 
const AboutRoutes = require('./Routes/AboutRoutes');
const AboutTeacher = require('./Routes/AboutTeacherRoutes');
const AvailableCards = require('./Routes/AvailableCardsRoutes');
const BasmaTrainningRoutes = require('./Routes/BasmaTrainningRoutes');
const BlogsRoutes = require('./Routes/BlogRoutes');
const BoxSliderRoutes = require('./Routes/BoxSliderRoutes');
const SliderRoutes = require('./Routes/SliderRoutes');
const CommentBlogRoutes = require('./Routes/CommentBlogRoutes');
const CoursesRoutes = require('./Routes/CoursesRoutes');
const DepartmentsRoutes = require('./Routes/DepartementsRoutes')
const DynamicBlogsRoutes = require('./Routes/DynamicBlogRoutes')
const BoxUnderSliderRoutes = require('./Routes/BoxUnderSliderRoutes')
const CommentsRoutes = require('./Routes/CommnetsRoutes')
const FAQRoutes = require('./Routes/FaqRoutes')
const LibarryRoutes = require('./Routes/LibraryRoutes')
const WhoWeAreRoutes = require('./Routes/WhoWeAresRoutes')
const TagRoutes = require('./Routes/TagRoutes')

const CouponsRoutes = require('./Routes/coponsRoutes')
const TeacherRoutes = require('./Routes/TeacherRoutes')
const UsersRoutes = require('./Routes/UserRouter')
const PaymentdepartmnetRouter = require('./Routes/Payment-departmnetRouter')
const PaymentCourseRouter = require('./Routes/Payment-CourseRouter')

const PurchaseStepsRoutes = require('./Routes/PurchaseStepsRoutes')
const ContactRoutes = require('./Routes/ContactRoutes')

const ProfileRoutes = require('./Routes/ProfileRoutes')





const app = express();
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors())


app.use('/abouts', AboutRoutes);
app.use('/aboutTeacher', AboutTeacher);
app.use('/availablecards', AvailableCards);
app.use('/basmatrainning', BasmaTrainningRoutes);
app.use('/blog', BlogsRoutes);
app.use('/boxSlider', BoxUnderSliderRoutes);
app.use('/Sliders', SliderRoutes);
app.use('/commentBlogs', CommentBlogRoutes);
app.use('/Courses', CoursesRoutes);
app.use('/departments',DepartmentsRoutes)
app.use('/dynamicBlogs',DynamicBlogsRoutes)
app.use('/BoxUnderSlider',BoxUnderSliderRoutes)
app.use('/Comments',CommentsRoutes)
app.use('/Fqs',FAQRoutes)
app.use('/Libraries',LibarryRoutes)
app.use('/WhoWeAre',WhoWeAreRoutes)
app.use('/Tags',TagRoutes)

app.use('/TeacherRoutes',TeacherRoutes)
app.use('/users',UsersRoutes)
app.use('/PaymentsDepartments',PaymentdepartmnetRouter)
app.use('/PaymentsCourse',PaymentCourseRouter)
app.use('/Coupons',CouponsRoutes)


app.use('/purchasesteps',PurchaseStepsRoutes)
app.use('/contactdynamic',ContactRoutes)
app.use('/profile',ProfileRoutes)






process.on('SIGINT', () => {
  client.quit().then(() => {
    console.log('Redis connection closed');
    process.exit(0);
  });
});




sequelize.sync({ force: false }).then(() => {
  console.log('Database connected and synced!');
});




app.get("/", (req, res) => {
  res.send("Welcome to Basma Academy!");
});




app.listen(process.env.PORT || 6060, () => {
  console.log(`Server is running on port ${process.env.PORT || 6060}`);
});
