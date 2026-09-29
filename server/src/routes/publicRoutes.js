const router=require('express').Router();
const rateLimit=require('express-rate-limit');
const prisma=require('../prismaClient');
const {field:f,validate,errorHandler}=require('../services/adminValidation');
router.get('/plans',async(req,res)=>res.json({plans:await prisma.plan.findMany({where:{active:true},select:{id:true,name:true,priceMinor:true,currency:true,interval:true,studentLimit:true,features:true},orderBy:{priceMinor:'asc'}})}));
router.post('/inquiries',rateLimit({windowMs:60*60*1000,limit:10,standardHeaders:true,legacyHeaders:false}),async(req,res)=>{
 const data=validate([f('name','Name','text',{required:true}),f('email','Email','email',{required:true}),f('school','School','text',{required:true}),f('interest','Interest','text',{required:true}),f('content','Message','textarea',{required:true})],req.body);
 await prisma.platformEntry.create({data:{kind:'inquiries',title:`${data.interest}: ${data.school}`,data:JSON.stringify({title:`${data.interest}: ${data.school}`,email:data.email,school:data.school,content:`Contact: ${data.name}\n${data.content}`,status:'New'})}});
 res.status(201).json({message:'Your request has been saved. The platform team can review it in School Inquiries.'});
});
router.use(errorHandler);module.exports=router;
