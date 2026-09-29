const router = require('express').Router();
const prisma = require('../prismaClient');
const { secureRouter, ADMIN_ROLES } = require('../middleware/routeSecurity');
const { field:f, validate, fail, errorHandler, audit } = require('../services/adminValidation');
secureRouter(router,{model:'transportRoute',readRoles:ADMIN_ROLES});
const format=r=>({...r,routeName:r.name,vehicleNumber:r.bus,driverName:r.driver});
router.get('/',async(req,res)=>res.json((await prisma.transportRoute.findMany({where:{schoolId:req.schoolId},orderBy:{createdAt:'desc'}})).map(format)));
router.post('/',async(req,res)=>{
 const input={...req.body,name:req.body.routeName||req.body.name,bus:req.body.vehicleNumber||req.body.bus,driver:req.body.driverName||req.body.driver};
 const data=validate([f('name','Route name','text',{required:true}),f('bus','Vehicle','text',{required:true}),f('driver','Driver','text',{required:true}),f('capacity','Capacity','number',{required:true,min:1,max:200}),f('fee','Fee','number',{required:true})],input);
 const record=await prisma.$transaction(async db=>{
  if(req.body.id){const old=await db.transportRoute.findFirst({where:{id:req.body.id,schoolId:req.schoolId}});if(!old)fail('Route not found',404);if(data.capacity<old.enrolled)fail('Capacity cannot be below current enrollment');}
  const saved=req.body.id?await db.transportRoute.update({where:{id:req.body.id,schoolId:req.schoolId},data}):await db.transportRoute.create({data:{...data,routeId:`RT-${require('crypto').randomUUID().slice(0,12)}`,schoolId:req.schoolId}});
  await audit(db,req,'Saved transport route','TransportRoute',saved.id);return saved;
 });res.status(req.body.id?200:201).json(format(record));
});
router.delete('/:id',async(req,res)=>{await prisma.transportRoute.delete({where:{id:req.params.id,schoolId:req.schoolId}});res.json({success:true});});
router.use(errorHandler);module.exports=router;
