// const express = require('express');
// const sequelize = require('./Config/dbConnect');
// const helmet = require('helmet');
// const cors = require('cors');
// const cookieParser = require('cookie-parser');
// require('dotenv').config();
// const bodyParser = require('body-parser');


// const client = require('./Utils/redisClient'); 
// const AboutRoutes = require('./Routes/AboutRoutes');
// const AboutTeacher = require('./Routes/AboutTeacherRoutes');
// const AvailableCards = require('./Routes/AvailableCardsRoutes');
// const BasmaTrainningRoutes = require('./Routes/BasmaTrainningRoutes');
// const BlogsRoutes = require('./Routes/BlogRoutes');
// const BoxSliderRoutes = require('./Routes/BoxSliderRoutes');
// const SliderRoutes = require('./Routes/SliderRoutes');
// const CommentBlogRoutes = require('./Routes/CommentBlogRoutes');
// const CoursesRoutes = require('./Routes/CoursesRoutes');
// const DepartmentsRoutes = require('./Routes/DepartementsRoutes')
// const DynamicBlogsRoutes = require('./Routes/DynamicBlogRoutes')
// const BoxUnderSliderRoutes = require('./Routes/BoxUnderSliderRoutes')
// const CommentsRoutes = require('./Routes/CommnetsRoutes')
// const FAQRoutes = require('./Routes/FaqRoutes')
// const LibarryRoutes = require('./Routes/LibraryRoutes')
// const WhoWeAreRoutes = require('./Routes/WhoWeAresRoutes')
// const TagRoutes = require('./Routes/TagRoutes')
// const CouponsRoutes = require('./Routes/coponsRoutes')
// const TeacherRoutes = require('./Routes/TeacherRoutes')
// const UsersRoutes = require('./Routes/UserRouter')
// const PaymentdepartmnetRouter = require('./Routes/Payment-departmnetRouter')
// const PaymentCourseRouter = require('./Routes/Payment-CourseRouter')

// const PurchaseStepsRoutes = require('./Routes/PurchaseStepsRoutes')
// const ContactRoutes = require('./Routes/ContactRoutes')
// const ProfileRoutes = require('./Routes/ProfileRoutes')
// const CommentCourseRoutes = require('./Routes/CommentCourseRoutes')
// const CoursesUsers = require('./Models/CourseUsers')




// const app = express();
// app.use(helmet({
//   contentSecurityPolicy: false,
//   crossOriginEmbedderPolicy: false,
// }));



// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(cors())


// app.use('/abouts', AboutRoutes);
// app.use('/aboutTeacher', AboutTeacher);
// app.use('/availablecards', AvailableCards);
// app.use('/basmatrainning', BasmaTrainningRoutes);
// app.use('/blog', BlogsRoutes);
// app.use('/boxSlider', BoxSliderRoutes);
// app.use('/BoxUnderSliders',BoxUnderSliderRoutes)
// app.use('/Sliders', SliderRoutes);
// app.use('/commentBlogs', CommentBlogRoutes);
// app.use('/Courses', CoursesRoutes);
// app.use('/departments',DepartmentsRoutes)
// app.use('/dynamicBlogs',DynamicBlogsRoutes)
// app.use('/Comments',CommentsRoutes)
// app.use('/Fqs',FAQRoutes)
// app.use('/Libraries',LibarryRoutes)
// app.use('/WhoWeAre',WhoWeAreRoutes)
// app.use('/Tags',TagRoutes)
// app.use('/TeacherRoutes',TeacherRoutes)
// app.use('/users',UsersRoutes)
// app.use('/PaymentsDepartments',PaymentdepartmnetRouter)
// app.use('/PaymentsCourse',PaymentCourseRouter)
// app.use('/Coupons',CouponsRoutes)
// app.use('/commentCourse',CommentCourseRoutes)
// app.use('/purchasesteps',PurchaseStepsRoutes)
// app.use('/contactdynamic',ContactRoutes)



// process.on('SIGINT', () => {
//   client.quit().then(() => {
//     console.log('Redis connection closed');
//     process.exit(0);
//   });
// });

// app.use(bodyParser.json());


// sequelize.sync({ force: false }).then(() => {
//   console.log('Database connected and synced!');
// });




// app.get("/", (req, res) => {
//   res.send("Welcome to Basma Academy!");
// });




// app.listen(process.env.PORT || 6060, () => {
//   console.log(`Server is running on port ${process.env.PORT || 6060}`);
// });



const express = require('express');
const sequelize = require('./Config/dbConnect');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const bodyParser = require('body-parser');
const axios = require('axios');
const requestIp = require('request-ip');


const AboutRoutes = require('./Routes/AboutRoutes');
const AboutTeacher = require('./Routes/AboutTeacherRoutes');
const AvailableCards = require('./Routes/AvailableCardsRoutes');
const BasmaTrainningRoutes = require('./Routes/BasmaTrainningRoutes');
const BlogsRoutes = require('./Routes/BlogRoutes');
const BoxSliderRoutes = require('./Routes/BoxSliderRoutes');
const SliderRoutes = require('./Routes/SliderRoutes');
const CommentBlogRoutes = require('./Routes/CommentBlogRoutes');
const CoursesRoutes = require('./Routes/CoursesRoutes');
const DepartmentsRoutes = require('./Routes/DepartementsRoutes');
const DynamicBlogsRoutes = require('./Routes/DynamicBlogRoutes');
const BoxUnderSliderRoutes = require('./Routes/BoxUnderSliderRoutes');
const CommentsRoutes = require('./Routes/CommnetsRoutes');
const FAQRoutes = require('./Routes/FaqRoutes');
const LibarryRoutes = require('./Routes/LibraryRoutes');
const WhoWeAreRoutes = require('./Routes/WhoWeAresRoutes');
const TagRoutes = require('./Routes/TagRoutes');
const CouponsRoutes = require('./Routes/coponsRoutes');
const TeacherRoutes = require('./Routes/TeacherRoutes');
const UsersRoutes = require('./Routes/UserRouter');
const PaymentdepartmnetRouter = require('./Routes/Payment-departmnetRouter');
const PaymentCourseRouter = require('./Routes/Payment-CourseRouter');
const PurchaseStepsRoutes = require('./Routes/PurchaseStepsRoutes');
const ContactRoutes = require('./Routes/ContactRoutes');
const ProfileRoutes = require('./Routes/ProfileRoutes');
const CommentCourseRoutes = require('./Routes/CommentCourseRoutes');
const geoip = require('geoip-lite');

const CoursesUsers = require('./Models/CourseUsers');
const client = require('./Utils/redisClient');


const app = express();


app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors());
app.use(cookieParser());


app.use('/abouts', AboutRoutes);
app.use('/aboutTeacher', AboutTeacher);
app.use('/availablecards', AvailableCards);
app.use('/basmatrainning', BasmaTrainningRoutes);
app.use('/blog', BlogsRoutes);
app.use('/boxSlider', BoxSliderRoutes);
app.use('/BoxUnderSliders', BoxUnderSliderRoutes);
app.use('/Sliders', SliderRoutes);
app.use('/commentBlogs', CommentBlogRoutes);
app.use('/Courses', CoursesRoutes);
app.use('/departments', DepartmentsRoutes);
app.use('/dynamicBlogs', DynamicBlogsRoutes);
app.use('/Comments', CommentsRoutes);
app.use('/Fqs', FAQRoutes);
app.use('/Libraries', LibarryRoutes);
app.use('/WhoWeAre', WhoWeAreRoutes);
app.use('/Tags', TagRoutes);
app.use('/TeacherRoutes', TeacherRoutes);
app.use('/users', UsersRoutes);
app.use('/PaymentsDepartments', PaymentdepartmnetRouter);
app.use('/PaymentsCourse', PaymentCourseRouter);
app.use('/Coupons', CouponsRoutes);
app.use('/commentCourse', CommentCourseRoutes);
app.use('/purchasesteps', PurchaseStepsRoutes);
app.use('/contactdynamic', ContactRoutes);
app.use('/profile', ProfileRoutes);


const IP_LOOKUP_API = "https://ipqualityscore.com/api/json/ip/T0hMeOnMzeAnPVsmgH6AKMhguvmr1Yv9";


async function checkVPN(userIP) {
  try {
   
    const response = await axios.get(`${IP_LOOKUP_API}?ip=${userIP}`);
    const { vpn, proxy, fraud_score, isp, city, asn, is_proxy } = response.data;

   
    if (vpn || proxy || is_proxy) {
      console.log("VPN or Proxy detected.");
      return false;
    }

   
    if (fraud_score > 50) {  
      console.log("Fraud score is too high.");
      return false;
    }

 
    if (isp && isp.toLowerCase().includes("vpn") || city === "unknown") {
      console.log("Suspicious ISP or City.");
      return false;
    }


    if (asn && (asn === "12345" || asn === "67890")) {  
      console.log("Suspicious ASN detected.");
      return false;
    }

 
    const geo = geoip.lookup(userIP);
    if (!geo || geo.country !== "JO") {
      console.log("Access denied due to non-Jordan IP.");
      return false;
    }

    return true;

  } catch (error) {
    console.error("Error checking VPN:", error);
    return false;
  }
}



function checkAuth(req, res, next) {
  const token = req.cookies.authToken || req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = decoded;
    next();
  });
}



app.use('/dashboard', async (req, res, next) => {
  const userIP = req.query.ip || requestIp.getClientIp(req);  

  const isAllowed = await checkVPN(userIP);

  if (!isAllowed) {
    return res.status(403).json({ message: "Access denied due to VPN/Proxy or non-Jordan IP" });
  }

  res.status(200).json({ message: "Access granted to the dashboard" });
});





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

