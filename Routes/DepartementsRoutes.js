
const DepartmenstController = require('../Controllers/DepartmentController')
const authMiddleWare = require('../MiddleWares/authMiddleware')
const rateLimiter = require('../MiddleWares/rateLimiter')
const router = require('./BlogRoutes')


router.post('/createDepartment',rateLimiter,DepartmenstController.createDepartment)

router.get('/getDepartments', rateLimiter, DepartmenstController.getAllDepartments)

router.get('/getDepartment/:id', rateLimiter, DepartmenstController.getDepartmentById)

router.put('/updateDepartment/:id', rateLimiter, DepartmenstController.updateDepartment)

router.delete('/deleteDepartment/:id', rateLimiter, DepartmenstController.deleteDepartment)