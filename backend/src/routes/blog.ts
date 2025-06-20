import { Hono } from "hono";
import { verify } from "hono/jwt";
import { PrismaClient } from '@prisma/client/edge'
// import { withAccelerate } from '@prisma/extension-accelerate'
//need to add the with accelerate 
import { blogSchema, updateblogSchema } from "@fable07/medium-common";

export const blogRouter = new Hono<{
    Bindings : {
        DATABASE_URL : string ,
        JWT_SECRET : string
    } ,
    Variables :{
        authorId : string;
    }
}>()


blogRouter.use('/*' , async (c , next) => {
  //get the header 
  //verify the header


  try{
    const header = c.req.header("authorization") || ""
    const token = header.split(" ")[1]

    const response = await verify(token , c.env.JWT_SECRET)

    if(response){
    //@ts-ignore
    c.set("authorId" , response.id)
    await next()
    }else {
    c.status(403)
    return c.json({
        error :"Unauthorized session"
    })
    }
  }catch(e){
    c.status(403)
    return c.json({
        error : "You are not logged in"
    })
  }

})



blogRouter.post('/' ,async (c) => {
    const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
    });
    
    try{
        const authorId = c.get("authorId")

        const payload = await c.req.json()

        const {success} = blogSchema.safeParse(payload)

        if(!success){
            c.status(400)
            return c.json({
                error : "not the valid inputs for the blog"
            })
        }

        const blog =  await prisma.post.create({
            data :{
                title : payload.title , 
                content  : payload.content , 
                authorId : authorId
            }
        })


        return c.json({
            blogId : blog
        })
    }catch(e){
        console.error(e)
        return c.json({
            error:"Error while posting the data"
        })
    }

    

})

blogRouter.put('/' ,async(c) =>{
    const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
    });

    try {
        const payload = await c.req.json()

        const {success} = updateblogSchema.safeParse(payload);

        if (!success){
            return c.json({
                error : "enter valid inputs while updating the blog"
            })
        }
        const blog =  await prisma.post.update({
            where:{
                id : payload.id
            } ,
            data :{
                title : payload.title , 
                content  : payload.content
            }
        })


        return c.json({
            blogId : blog
        })
    }catch(e){
        error : "error while updating the blog"
    }
    
})

//pagination --make 9 blogs to be returned on the first page load, more of them only after the user scrolls
blogRouter.get("/all" , async (c)=>{
    const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
    });
    
    try{
    const blogs = await prisma.post.findMany({
        select :{
            title: true,
            content:true ,
            createdAt : true,
            updatedAt:true,
            author : {
                select : {
                    userName:true
                }
            }
        }
    }); 
    return c.json({
        blogs
    }) 
    }catch(e){
        c.status(500)
        return c.json({
            error :"could not connect to the server"
        })

    }
})


blogRouter.get('/details' ,async(c)=>{
    const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
    });

    try {
        const authorId = c.get("authorId"); 
        const userDetails = await prisma.user.findUnique({
            where: {
                id: authorId
            },
            select: {
                userName: true,
                id: true
            }
            });

        // const userDetails = await prisma.post.findFirst({
        // where: {
        //     id: authorId,
        // },
        // select: {
        //     author :{
        //         select :{
        //             userName :true ,
        //             id :true
        //         }
        //     }
        // },
        // })

        return c.json({
            userDetails
        })

    }catch(e){
        c.status(400)
        return c.json({
            message :"Couldnt get the user details"
        })

    }
    
})

blogRouter.get('/:id' ,async (c)=>{
    const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
    });

    try{
        const id = await c.req.param("id")

        const blog =  await prisma.post.findMany({
            where : {
                id : id
            }
        })


        return c.json({
            blog
        })

    }catch(e){
        c.status(500)
        return c.json({
            message  :"something went wrong"
        })
    }

    
})

