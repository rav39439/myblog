var express=require("express")
const path=require('path')
var session=require("express-session")
const mongoose=require('mongoose')
const jwt=require('jsonwebtoken')
const cookieparser=require('cookie-parser')
const cors = require('cors');
const crypto = require('crypto');
const nodemailer=require('nodemailer')
const {GridFsStorage} = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');

const sendgridtransport=require('nodemailer-sendgrid-transport')
///const methodOverride = require('method-override');
//Grid = require('mongodb').Grid
Grid.mongo = mongoose.mongo;
//const fileUpload=require("express-fileupload")
//const pdfParse=require("pdf-parse")
var app=express()

const fs=require("fs")
const multer  = require('multer')
//const { ObjectId } = require('mongodb');
var bodyParser = require('body-parser')

const dotenv = require("dotenv");
require('dotenv').config()
app.use(bodyParser.json());
const MongodbSession=require('connect-mongodb-session')(session);

console.log(process.env.URL)


const store=new MongodbSession({
    uri:process.env.URL,
    collection:"mysessions",

})


var mytransporter=nodemailer.createTransport(sendgridtransport({
    
    auth:{
          api_key:process.env.YURL,
    },
}))



 //app.use(bodyParser.urlencoded({ extended: false }))



//----------------------multer-----------------------------------------------------------------

// const newstorage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, path.join(__dirname, '/public/presentation'))
//     },
//     filename: function (req, file, cb) {
//       cb(null, file.fieldname + '--' + file.originalname)
//     }
//   })


// const dupload=multer({newstorage:newstorage})

//-----------------------------------------------------------------------------------------------


  const isAuth=(req,res,next)=>{
      if(req.session.isAuth){
          next()
      }
      else{
          res.send(`<h1>Please login or Register to continue viewing the posts</h1>`)
      }
  }

var formidable = require('formidable');
var http=require("http").createServer(app)
var io=require("socket.io")(http, {
    cors: {
   origin: "https://newblogecomm.herokuapp.com/",
     // origin:"http://localhost:3000",
      credentials: true
    }
  })

const bcrypt = require('bcrypt');
var bodyParser=require("body-parser")
var ObjectId=require("mongodb").ObjectId
app.use(cookieparser())
app.use(bodyParser.urlencoded())
app.get('/public', express.static('public'));
app.use(express.static('public'));
app.use("/public",express.static(__dirname +"/public"))
 app.use(session({
     key:"admin",
     secret:"any random string",
     resave: true, 
     saveUninitialized: true,
     cookie: { maxAge:24 * 60 * 60 * 1000 },
     store:store
 }))



 const conn = mongoose.createConnection(process.env.URL,{ useNewUrlParser: true ,useUnifiedTopology: true} );
 
   
//--------------------------gridfs-------------------------------------------------------------
let gfs
conn.once('open', () => {
    

    gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
      });
    gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
   
    

    // console.log(gfs.collection.files)
  });


  const storage = new GridFsStorage({
    url: process.env.URL,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });

  const upload = multer({ storage });
//-----------------------------------------------------------------------------------------------

app.set("view engine","ejs")
var MongoClient=require("mongodb").MongoClient;
const { fstat } = require("fs");
const { request } = require("express");
const { callbackPromise } = require("nodemailer/lib/shared")

MongoClient.connect(process.env.URL,{useNewUrlParser:true},function(error,client){
    var blog=client.db("blog")
    console.log("DB connected")
 
app.get("/",function(req,res){
    // console.log("slash lgoin is activated")
      res.render("admin/login")
 
})
app.get("/home",isAuth,function(req,res){
  blog.collection("posts").find().sort({_id:1}).toArray(function(error,posts){
    res.render("user/home",{posts:posts,currentuserimage:req.session.profileimage})
})
})


app.get("/home1",function(req,res){
  blog.collection("posts").find().sort({_id:1}).toArray(function(error,posts){
    res.render("admin/home1.ejs",{posts:posts,currentuserimage:req.session.profileimage})
})
})


app.get("/admin/dashboard",isAuth,function(req,res){
    if(req.session.admin){

        blog.collection("users").aggregate( [
            {
                $project: {
                  month: { $month:"$createdAt"},
                }
              },
            
            { $group: { _id: "$month", total: { $sum: 1 } } }
           
            ]).sort({_id:1}).toArray(function(error,data){

            blog.collection("users").find().sort({_id:1}).toArray(function(error,users){
                blog.collection("posts").aggregate( [

                    {
                        $project: {
                          month: { $month: "$createdAt" },
                        }
                      },
                    
                    { $group: { _id: "$month", total: { $sum: 1 } } }

                ]).sort({_id:1}).toArray(function(error,data1){
                let adata = JSON.stringify(data1)
                console.log("the users by month")
                console.log(data)

    res.render("admin/dashboard",{mydata:adata,users:users,datas:JSON.stringify(data),currentuserimage:req.session.profileimage})
  
   
})
})
})
}
else{
    //res.redirect('/login')
}
})


//----------------------------------dupload------------------------------------------------------------

app.post("/multipleuploads",upload.array('images',6),function(req,res){

   
console.log(req.body.anotherinfo)
    var obj={}
    obj=req.files
    var now=Date.now()
    //console.log(obj)
    blog.collection("presentation").insertOne
    
    
    ({
        "username":req.session.username,
        "userid":req.session._id,
        "email":req.session.email,
       "title":req.body.presentation,
        "createdAt": now,
        "newdata":req.files,
        "addeddata":JSON.stringify(req.body.anotherinfo),
        "comments":[],
    
        "image":req.session.profileimage,

    },

    function(error,data){
        var id=data._id
console.log(id)
     blog.collection('users').updateOne({

        "_id":ObjectId(req.session._id)
     },{
         $push:{

            "presentation":{
             "_id":data.insertedId,
             "title":req.body.myinfo,
            }
         }
     })
        
        
})
   

mydata=JSON.stringify(obj)
        res.render('user/presentation.ejs',{username:req.session.username,mydata:mydata,currentuserimage:req.session.userprofileimage})
    
})


app.get("/admin/posts",isAuth,function(req,res){
      blog.collection("posts").find().toArray(function(error,posts){
          res.render("admin/posts.ejs",{"posts":posts,currentuserimage:req.session.profileimage,username:req.session.username,adminrule:req.session.adminrule,myposts:req.session.myposts})
      })

  
})
app.get("/admin/userposts",isAuth,function(req,res){

  

  let b=[]
 
  req.session.myposts.map(function(elem){
    b.push(elem._id)
  })
  console.log(b)
      blog.collection("posts").find().toArray(function(error,posts){



          res.render("admin/userposts.ejs",{"posts":posts,currentuserimage:req.session.profileimage,username:req.session.username,myposts:b})
      })

   //res.render("admin/posts")
//}else{
    //res.redirect("/admin")
    //}
})

app.get("/admin/hotels",isAuth,function(req,res){
  //  if(req.session.admin){
      blog.collection("posts").find().toArray(function(error,posts){
          res.render("admin/hotels",{"posts":posts,currentuserimage:req.session.profileimage,userid:req.session._id,username:req.session.username})
      })

   //res.render("admin/posts")
//}else{
    //res.redirect("/admin")
    //}
})
app.get("/admin/fooditems",isAuth,function(req,res){
  //  if(req.session.admin){
      blog.collection("posts").find().toArray(function(error,posts){
          res.render("admin/fooditems",{"posts":posts,currentuserimage:req.session.profileimage,userid:req.session._id,username:req.session.username})
      })

   //res.render("admin/posts")
//}else{
    //res.redirect("/admin")
    //}
})
app.get("/admin/products",isAuth,function(req,res){
  //  if(req.session.admin){
      blog.collection("posts").find().toArray(function(error,posts){
          res.render("admin/products",{"posts":posts,currentuserimage:req.session.profileimage,userid:req.session._id,username:req.session.username})
      })

   //res.render("admin/posts")
//}else{
    //res.redirect("/admin")
    //}
})
app.get("/admin/events",isAuth,function(req,res){
  //  if(req.session.admin){
      blog.collection("posts").find().toArray(function(error,posts){
          res.render("admin/events",{"posts":posts,currentuserimage:req.session.profileimage,userid:req.session._id,username:req.session.username})
      })

   //res.render("admin/posts")
//}else{
    //res.redirect("/admin")
    //}
})
app.post("/do-messages",function(request,result){
  //  if(req.session.admin){
      console.log("do eemaedaf")
      blog.collection("posts").find({

        username:request.session.username

      }).toArray(function(error,posts){
        //console.log(posts);
          result.json({

            "status":"success",
            "data":posts
          })
      })
     // console.log(request.session.username);
  
 
})

app.post("/register",function(req,res){
//console.log("dsafasf")

// let username=req.body.username;
// let name=req.body.name;
// let email=req.body.email;


// let password=req.body.password;
// let profileimage=req.body.image;
//console.log(profileimage);




if(!req.session.email){
    
    payload={
        username:req.body.username,
        name:req.body.name,
        email:req.body.email,
        profileimage:req.body.image,
        password:req.body.password,
    }
        //const emailtoken=crypto.randomBytes(64).toString('hex')
        const token=jwt.sign(payload,"this is great guy",{expiresIn:'1hr'});
        //console.log(token)
        //res.status(200).json({token})
        var mailOptions={
            from:"rav39439@gmail.com",
            to:req.body.email,
            subject:"signup successful",
            html:`<h2>${req.body.name}! Thanks for registering on our site</h2>
            <h4>Please verify your mail to continue</h4>
            <a href="https://newblogecomm.herokuapp.com/verify-email?token=${token}">verify your email</a>
            `
        }
        mytransporter.sendMail(mailOptions,function(error,info){
        
            if(error){
               console.log(error)
            }else{
                //res.send("verification email is sent to your mail")
              // console.log("verification mail is sent")
    
            }
       })
    
    
    
    }
    else{
       //console.log(req.session.email)
    
        res.send("please logout to continue")
    }



//if(req.body.code=='thisismysomethingthatisveryimportantdxfbdsgfrdahdag'){

})
app.get("/verify-email",function(req,res){
    if(req.query.token){
        const decodedToken=jwt.verify(req.query.token,"this is great guy")


        username=decodedToken.username
        myname=decodedToken.name
    profileimage=decodedToken.profileimage
   password=decodedToken.password
    email=decodedToken.email
    var now = new Date();
    blog.collection("users").insertOne

    
    ({
        "username":username,
        "password":password,
        "email":email,
        
       // "city":req.body.city,
        
        "createdAt": now,
        "friends":[],
        "Admin":true,
        "image":profileimage,
        'adminrule':false,
        'notifications':[],
        'presentation':[],
        "posts":[],
        
        "yourorders":[],
        "ordersforyou":[],


    },

    function(error,document){
    // res.send({
    //     text:"registered successfully",
    //     _id:document.insertedId
    // })
    res.redirect("/")
    
})


    }


})



//}



app.get("/login",function(req,res){
    console.log("login route is activated")
    res.render("admin/login")
})
app.get("/posts/:id",function(req,res){
    
    console.log(req.session)
    blog.collection("posts").findOne({"_id":ObjectId(req.params.id)}, function(error,post){
res.render("user/post",{post:post,name:req.session.username,"image":req.session.profileimage,"friends":req.session.friendlist})
console.log(post.image)
    })
})


app.get("/admin/posts/:id",isAuth,function(req,res){
    
    console.log("hgffffffffffffffffffffffffffffffffffffffffffffffffffffj")
    
    blog.collection("posts").findOne({"_id":ObjectId(req.params.id)}, function(error,post){
res.render("user/product",{post:post,name:req.session.username,"image":req.session.profileimage,userid:req.session._id,adminrule:req.session.adminrule,"friends":req.session.friendlist})
console.log(post.image)
    })
})


app.get("/admin/hotels/:id",isAuth,function(req,res){
    
    console.log(req.session)
    blog.collection("posts").findOne({"_id":ObjectId(req.params.id)}, function(error,post){
res.render("user/hotel",{post:post,name:req.session.username,"image":req.session.profileimage,userid:req.session._id,"friends":req.session.friendlist})
console.log(post.image)
    })
})


app.get("/admin/fooditems/:id",isAuth,function(req,res){
    
    console.log(req.session)
    blog.collection("posts").findOne({"_id":ObjectId(req.params.id)}, function(error,post){
res.render("user/fooditem.ejs",{post:post,name:req.session.username,"image":req.session.profileimage,userid:req.session._id,"friends":req.session.friendlist})
//console.log(post.image)
    })
})


app.get("/admin/events/:id",isAuth,function(req,res){
    
    console.log(req.session)
    blog.collection("posts").findOne({"_id":ObjectId(req.params.id)}, function(error,post){
res.render("user/event",{post:post,name:req.session.username,"image":req.session.profileimage,userid:req.session._id,"friends":req.session.friendlist})
console.log(post.image)
    })
})
app.get("/admin/userposts/:id",isAuth,function(req,res){
    
    console.log(req.session)
    blog.collection("posts").findOne({"_id":ObjectId(req.params.id)}, function(error,post){
res.render("user/userpost.ejs",{post:post,name:req.session.username,"image":req.session.profileimage,userid:req.session._id,adminrule:req.session.adminrule,"friends":req.session.friendlist})
console.log(post.image)
    })
})





app.get("/admin/getpage/posts/:id",isAuth,function(req,res){
    
    console.log(req.session)
    blog.collection("posts").findOne({"_id":ObjectId(req.params.id)}, function(error,post){
res.render("user/post",{post:post,name:req.session.username,"image":req.session.profileimage,friends:req.session.friendlist})
console.log(post.image)
    })
})


app.post("/do-reply",function(req,res){
    var reply_id=ObjectId()
  
    blog.collection("posts").updateOne({
        "_id":ObjectId(req.body.post_id),
        "comments._id":ObjectId(req.body.comment_id)

    },{
        $push:{
            "comments.$.replies":{
                _id:reply_id,
                name:req.body.name,
                reply:req.body.reply,
                image:req.session.profileimage,
                
                read:"unread"
            }
        }
    }, function(err,data){
       // console.log("the rply")
        console.log(reply_id)
        res.json({
            "text":"successfully replied",
            "_id":reply_id
        })
    });
        // var mailOptions={
        //     "from":"My Blog",
        //     "to":req.body.comment_email,
        //     "subject":"New reply",
        //     "text":req.body.name+"has replied on your comment. https://ecommerceblog.herokuapp.com/" + req.body.post_id
        // }
        // transporter.sendMail(mailOptions,function(error,info){
        //     res.send({
        //         text:"Replied",
        //         _id:reply_id
        //     }) 
        //})
      

})







app.post("/do-post",upload.array('images',10),function(req,res){
var user=req.session.username;
var useremail=req.session.email;

if(req.body.type=="posts"){

    console.log("sdafd")

    var title=req.body.title;
    if(req.body.image){
        var image=req.body.image;

    }else{
        var image=""
    }
    var content=req.body.content;
    var now=new Date();
    console.log(image);


    blog.collection("posts").insertOne({
        
        "username":user,
        "type":"post",
        "profileimage":req.session.profileimage,
        "title":title,
        "userid":req.session._id,
        "content":content,
        "email":useremail,
        "image":image,
        "likers":[],
        "user":[],
        "comments":[],
    
        
      
        "createdAt": now,
        
        
    },function(error,data){

        blog.collection('users').updateOne({

            "_id":ObjectId(req.session._id)
         },{
             $push:{
    
                "posts":{
                 "_id":data?.insertedId,
                
                }
             }
         },function(err,data){
            //var mypost=blog.collection('posts').find({"image":image, "title":title})
            res.json({


                "message":"success",
                "_id":mypost?._id
            })
            })
        
    })

}


else if(req.body.type=="products"){
    console.log("sdafd1")
    let image3=""
    var title=req.body.title;
    var company=req.body.company;
    var funct=req.body.funct;
    var price=req.body.price;
    console.log("sdafd1ssssssssssss")

    if(req.body.images.length>0){
        var newimages=JSON.parse(req.body.images)
image3=newimages[0]

    }else{
        var newimages=[]
        image3=""
    }
    if(req.body.videos.length>0){
        var videos=JSON.parse(req.body.videos)

    }else{
        var videos=[]
    }

   //var newimage=JSON.parse(req.body.images)
   //var videos=JSON.parse(req.body.videos)
    var detail1=req.body.details1;
    var detail2=req.body.details2;
    var now=new Date();
   
    blog.collection("posts").insertOne({
        
        "username":user,
        "type":"products",
        "userid":req.session._id,
        "profileimage":req.session.profileimage,
        "image":image3,
        "title":title,
        "email":useremail,
        "price":price,
        "funct":funct,
        "detail1":detail1,
        "detail2":detail2,
        "images":newimages,
        "videos":videos,
        "company":company,
        "orders":[],
        "likers":[],
        "user":[],
        "comments":[],
        "createdAt": now,
        
        
    },function(error,data){
        blog.collection('users').updateOne({

            "_id":ObjectId(req.session._id)
         },{
             $push:{
    
                "posts":{
                 "_id":data.insertedId,
                
                }
             }
         },function(err,data){
            res.json({
                "message":"success",
                "_id":data._id
            })
        
    })
    })

}

else if(req.body.type=="events"){
var image=""
    console.log("sdafd2")
    console.log(req.body.images)
    if(req.body.images.length>0){
        var newimages=JSON.parse(req.body.images)
image=newimages[0]

    }else{
        var newimages=[]
        image=""
    }
    if(req.body.videos.length>0){
        var videos=JSON.parse(req.body.videos)

    }else{
        var videos=[]
    }
    var title=req.body.title;
    var locati=req.body.place;
    var details=req.body.details;
    var about=req.body.about;
    var timing=req.body.timing;
    var now=new Date();
    //console.log(image);
    blog.collection("posts").insertOne({
        
        "username":req.session.username,
        "type":"events",
        "image":image,
        "images":newimages,
        "userid":req.session._id,
        "videos":videos,
        "profileimage":req.session.profileimage,
        "title":title,
        "email":useremail,
        "details":details,
        "location":locati,
        "about":about,
        "timing":timing,
        "likers":[],
        "user":[],
        "comments":[],
        "createdAt": now,
        
        
       },function(error,data){
        blog.collection('users').updateOne({

            "_id":ObjectId(req.session._id)
         },{
             $push:{
    
                "posts":{
                 "_id":data.insertedId,
                
                }
             }
         },function(err,data){
            res.json({
                "message":"success",
                "_id":data._id
            })
         })
        
    })

}

else if(req.body.type=="hotels"){
    var image1=""
    console.log("sdafd3")

    var title=req.body.title;
    if(req.body.images.length>0){
        var newimages=JSON.parse(req.body.images)
image1=newimages[0]
    }else{
        var newimages=[]
        image1=""
    }

    if(req.body.videos.length>0){
        var videos=JSON.parse(req.body.videos)

    }else{
        videos=[]
    }
    var now=new Date();
    console.log(req.files);
    blog.collection("posts").insertOne({
        
        "username":req.session.username,
        "type":"hotels",
        "email":useremail,
        "userid":req.session._id,
        "profileimage":req.session.profileimage,
        "title":title,
        "image":image1,
        "rooms":req.body.rooms,
        "facilities1":req.body.facilities1,
        "facilities2":req.body.facilities2,
        "images":newimages,
        "videos":videos,
        "about":req.body.about,
        "orders":[],
        "products":[],
        "likers":[],
        "user":[],
        "comments":[],
        "createdAt": now,
        
        
    }
    
    
    
    
    ,function(error,data){
        blog.collection('users').updateOne({

            "_id":ObjectId(req.session._id)
         },{
             $push:{
    
                "posts":{
                 "_id":data.insertedId,
               
                }
             }
         },function(err,data){
            res.json({
                "message":"success",
                "_id":data._id

            })
            })
        
        })
        

}
    
else {

let image2=""
    var title=req.body.title;
    if(req.body.images.length>0){
        var newimages=JSON.parse(req.body.images)
image2=newimages[0]
    }else{
        var newimages=[]
        image2=""
    }

    if(req.body.videos.length>0){
        var videos=JSON.parse(req.body.videos)

    }else{
        videos=[]
    }


//var newimages=JSON.parse(req.body.images)
//var videos=JSON.parse(req.body.videos)
    var now=new Date();
    console.log(req.files);
    blog.collection("posts").insertOne({
        
        "username":req.session.username,
        "type":"fooditems",
        "email":useremail,
        "userid":req.session._id,
        "profileimage":req.session.profileimage,
        "title":title,
        "image":image2,
        "items":req.body.items,
        "location":req.body.location,
        "categories":req.body.categories,
        "images":newimages,
        "videos":videos,
        "about":req.body.about,
        "orders":[],
        "products":[],
        "likers":[],
        "user":[],
        "comments":[],
        "createdAt": now,
        
        
    }
    
    
    
    
    ,function(error,data){
        blog.collection('users').updateOne({

            "_id":ObjectId(req.session._id)
         },{
             $push:{
    
                "posts":{
                 "_id":data.insertedId,
               
                }
             }
         },function(err,data){
            res.json({
                "message":"success"
            })
            })
        
        })
        

}
    
})
app.post("/do-postproducts",upload.array('images',10),function(req,res){
var user=req.session.username;
var useremail=req.session.email;
   
    
})
app.post("/do-postevents",upload.array('images',10),function(req,res){
var user=req.session.username;
var useremail=req.session.email;
   
    
})
app.post("/do-posthotels",upload.array('images',10),function(req,res){
var user=req.session.username;
var useremail=req.session.email;

})


app.get("/register",function(request,result){

    result.render("admin/register.ejs")
})



app.get("/posts/edit/:id",isAuth,function(req,res){
    console.log(req.session.username)
    blog.collection("posts").findOne({
    "_id":ObjectId(req.params.id)
},function(error,post){
    res.render("admin/edit_post",{"post":post,"name":req.session.username, currentuserimage:req.session.profileimage})
})
   
       
})
app.get("/posts/edit-products/:id",isAuth,function(req,res){
    console.log(req.params.id)
    blog.collection("posts").findOne({
    "_id":ObjectId(req.params.id)
},function(error,post){
    res.render("admin/edit-products",{"post":post,images:JSON.stringify(post.images),
    videos:JSON.stringify(post.videos),"name":req.session.username, currentuserimage:req.session.profileimage})
})
   
       
})
app.get("/posts/edit-events/:id",isAuth,function(req,res){
    console.log(req.session.username)
    blog.collection("posts").findOne({
    "_id":ObjectId(req.params.id)
},function(error,post){
    res.render("admin/edit-events",{"post":post,images:JSON.stringify(post.images),"name":req.session.username, currentuserimage:req.session.profileimage})
})
   
       
})
app.get("/posts/edit-hotels/:id",isAuth,function(req,res){
    console.log(req.session.username)
    blog.collection("posts").findOne({
    "_id":ObjectId(req.params.id)
},function(error,post){
    res.render("admin/edit-hotels",{"post":post, images:JSON.stringify(post.images),
    videos:JSON.stringify(post.videos),"name":req.session.username,images:JSON.stringify(post.images),
    videos:JSON.stringify(post.videos), currentuserimage:req.session.profileimage})
})
   
       
})


app.get("/posts/edit-fooditems/:id",isAuth,function(req,res){
    console.log(req.session.username)
    blog.collection("posts").findOne({
    "_id":ObjectId(req.params.id)
},function(error,post){
    res.render("admin/edit-fooditems",{"post":post,images:JSON.stringify(post.images),
    videos:JSON.stringify(post.videos),"name":req.session.username, currentuserimage:req.session.profileimage})
})
   
       
})






app.post("/do-edit-post",function(req,res){
console.log("do edit post runnign")
    blog.collection("posts").updateOne({
        "_id":ObjectId(req.body._id)
    },{
        $set:{
            "title":req.body.title,
            "content":req.body.content,
            "image":req.body.image
        },function(error,post){
            res.send("Updated Successfully")
        }
    })
})


app.post("/do-edit-products",deleteinitial,function(req,res){

console.log("the post id is"+req.body.videos)
console.log("the post id is"+req.body.images)
///console.log("the post id is"+req.body.image)
//console.log(JSON.parse(req.body.images))
//var images=[]
console.log(req.body.length)
var images=[]
var videos=[]
console.log(req.body.images)

if(req.body.images.length!=0){
     images=JSON.parse(req.body.images)
console.log("images is there")
}else{
    images=[]
}


if(req.body.videos.length!=0){

videos=JSON.parse(req.body.videos)

}else{
    videos=[]
}

console.log(images)
    blog.collection("posts").updateOne({
        "_id":ObjectId(req.body._id)
    },{
        $set:{
            "title":req.body.title,
            "price":req.body.price,
            "detail1":req.body.detai,
            "detail2":req.body.detail,
            "company":req.body.company,
            "funct":req.body.funct,
            "images":images,
            "videos":videos,
            "image":images[0],
        },function(error,post){
            console.log(post)
            res.send("Updated Successfully")
        }
    })
})



app.post("/do-edit-events",function(req,res){
console.log("do edit post runnign")

var images=[]
if(req.body.images.length!=0){
     images=JSON.parse(req.body.images)

}else{
    console.log(req.body)
    images=[]
}
    blog.collection("posts").updateOne({
        "_id":ObjectId(req.body._id)
    },{
        $set:{
            "title":req.body.title,
            "details":req.body.details,
            "location":req.body.place,
            "timing":req.body.timing,
            "about":req.body.about,
            "videos":JSON.parse(req.body.videos),
            "images":images,
            "image":images[0]
        },function(error,post){
            res.send("Updated Successfully")
        }
    })
})






app.post("/do-edit-hotels",deleteinitial,function(req,res){
console.log("do edit post runnign")

console.log(req.body.images.length)
var images=[]
if(req.body.images.length!=0){
     images=JSON.parse(req.body.images)

}else{
    images=[]
}

var videos=[]
if(req.body.videos.length!=0){

    videos=JSON.parse(req.body.videos)
}
else{
    videos=[]
}

    blog.collection("posts").updateOne({
        "_id":ObjectId(req.body._id)
    },{
        $set:{
            "title":req.body.title,
            "facilities1":req.body.facilities1,
            "facilities2":req.body.facilities2,
            "rooms":req.body.rooms,
            "about":req.body.about,
            "images":images,
            "videos":videos,
            "image":images[0]
        },function(error,post){
            res.send("Updated Successfully")
        }
    })
})



app.post("/do-edit-fooditems",deleteinitial,function(req,res){
console.log("do edit post runnign")
console.log(req.body)
var images=[]
if(req.body.images.length!=0){
     images=JSON.parse(req.body.images)

}else{
    images=[]
}



var videos=[]
if(req.body.videos.length!=0){

    videos=JSON.parse(req.body.videos)
}
else{
    videos=[]
}
    blog.collection("posts").updateOne({
        "_id":ObjectId(req.body._id)
    },{
        $set:{
            "title":req.body.title,
            "items":req.body.items,
            "categories":req.body.categories,
            "location":req.body.location,
            "about":req.body.about,
            "images":images,
            "videos":videos,
            "image":images[0],
            "facilities1":req.body.facilities1,
            "facilities2":req.body.facilities2
        },function(error,post){
            res.send("Updated Successfully")
        }
    })
})




app.post("/do-comment",function(req,res){
    var comment_Id=ObjectId()
   // console.log(req.body.comment)
    blog.collection("posts").update({"_id":ObjectId(req.body.post_id)},{
        $push:{
            "comments":{_id:comment_Id,username: req.body.username, comment:req.body.comment, email:req.body.email,image:req.session.profileimage,file:req.body.filedetails,video:req.body.video}
            
        }
    },function (error,post){
        res.send({
            text:"comment successfull",
            _id:post.insertedId
        })
    })
})


//----------------------------------------------uploading of images using one way---------------------

app.post("/do-upload-image",upload.single('file'),function(req,res){
//     console.log("upload image is runing")
//     var formData = new formidable.IncomingForm();
// formData.parse(req,function(error,fields,files){
//     var oldPath=files.file.path;
//     var newPath="public/images/"+files.file.name;
//     console.log(newPath)
//     fs.copyFile(oldPath, newPath, function(err){
//        // res.render("admin/posts",{imagepath:newPath})
res.json({
    "data":req.file.filename,
})
  //  })
//})
})





app.post("/do-upload-image1",upload.array('file',10),function(req,res){
    console.log("upload image1 is runing")
    //console.log(req.files)
    //var formData = new formidable.IncomingForm();

    //var oldPath=files.file.path;
    //var newPath="public/images/"+files.file.name;
let newarray=[]
let newvideos=[]

    let myfile =req.files
    myfile.forEach(function(elem){
        if(elem.mimetype=="image/jpeg"|| elem.mimetype=='image/png'){

            newpath=elem.filename
            newarray.push(newpath)
        }else{
            newpath=elem.filename
            newvideos.push(newpath)

        }
    })

    console.log(newarray)
    res.json({
        "data":JSON.stringify(newarray),
        "videos":JSON.stringify(newvideos),
    })
    //fs.copyFile(oldPath, newPath, function(err){
       // res.render("admin/posts",{imagepath:newPath})
       //res.send("/"+ newPath)
   // })

})
app.post("/do-update-image1",upload.array('file',10),function(req,res){
    console.log("upload image1 is runing")
   
let newarray=[]
let newvideos=[]

    let myfile =req.files
    myfile.forEach(function(elem){
        if(elem.mimetype=="image/jpeg"){

            newpath=elem.filename
            newarray.push(newpath)
           // console.log(newpath)
        }else{
            newpath=elem.filename
            newvideos.push(newpath)
            //console.log(newpath)

        }
    })

    console.log(newarray)
    res.json({
        "data":JSON.stringify(newarray),
        "videos":JSON.stringify(newvideos),
    })
    
})

//-------------------------------------------------------------------------------------------------


app.post("/do-changeread",function(req,res){
let mypostid=ObjectId(req.body.mypostid)
let mycommentid=ObjectId(req.body.mycommentid)
let myreplyid=ObjectId(req.body.myreplyid)

console.log(mypostid)
blog.collection("posts").findOne({
    "_id":ObjectId(req.body.mypostid)
},function(error,post){

    if(post==null){
        result.json({
            "status":"error",
            "message":"Post does not exist."
        })

    } else{
       
        blog.collection("posts").findOneAndUpdate({
            //$and:[{
                "_id":post._id,
              
                //"comments": {
                  //  "$elemMatch": {
                 //    "_id": mycommentid,"replies._id": myreplyid
                 //   }
                //  }
            //  }]
          
    },{

        $set:{
            "comments.$[outer].replies.$[inner].read": "read"
            
           
        },
        
           
        
    },{

        multi:true,
        //"comments.replies._id":myreplyid
        //arrayFilters: [{ 'outer.id': mycommentid}, { 'inner.id': myreplyid }],
        "arrayFilters": [{ "outer._id": mycommentid },{ "inner._id": myreplyid }] 
    },
    
    
    
    function(error,data){
        res.json({
            "status":"success",
            "message":"post has been read"
        })
    
        
    })
    }
    
})
})

app.get("/forgotpassword",isAuth,function(req,res){

    res.render("user/forgotpass")
})


app.post("/forgotpassword",function(req,res){

    var email=req.body.myemail;
    console.log(email)

    blog.collection("users").findOne(
        {
"email":email
    },function(error,user){

if(user==null){
    res.json({
        "status":"error",
        "message":"user has logged out"
    })
} else{

    blog.collection("users").updateOne(
        {
"email":email,

    },
    {
      "name":req.body.mykey,  
    },{
        $set:{
            "password":req.body.newpassword
        }
    })
    
   

}
    
    })

})
app.get("/dogetusers",isAuth,function(req,res){
   // res.render("admin/search")
   blog.collection("users").find({
"username":req.query.inputuser

   }).toArray(function(error,users){


    res.render("admin/search.ejs",{"users":users,myfriendlist:JSON.stringify(req.session.friendlist)})
})
})

//------------------------------------updating image-----------------------------------------------
app.post("/do-update-image",upload.single('file'),function(req,res){
    console.log("update image is running")
    var formData=new formidable.IncomingForm();
    // formData.parse(req,function(error,fields,files){
    //     fs.unlink(fields.image.replace("/",""), function(error){
    //         var oldPath=files.file.path;
    //         var newPath="public/images/" + files.file.name;
    //         fs.rename(oldPath,newPath, function(err){
                res.send(req.file.filename);
          //  })
       // });
        
    //})
})
//-------------------------------------------------------------------------------------------------
app.get("/Editprofilepic",isAuth,function(req,res){
blog.collection("users").findOne({

    "_id": ObjectId(req.session._id)
},function(error,data){
console.log(data)
    res.render("user/Editprofilepic",{image:data.image,currentuserimage:req.session.profileimage})

})


})

// app.get("/test",function(req,res){
//     blog.collection("posts").find().sort({_id:1}).toArray(function(error,posts){
//     res.render("user/test",{posts:posts})
// })
// })
app.get("/logout",isAuth,function(req,res){
    req.session.destroy()
    res.redirect('/')
})


app.get("/newmakeorder",isAuth,function(req,res){

    res.render("user/newmakeorder.ejs",{userid:req.query.userid,productid:req.query.productid,postid:req.query.postid})
})


function anothermiddle(req,res,next){

   
  
  
 
    console.log(req.body.userid)
    console.log(req.body.postid)
    console.log(req.body.productid)
   
    
    blog.collection("posts").updateOne({

        "_id":ObjectId(req.body.postid)
        
    },{
       $inc:{
           "products.$[outer].timesordered":1
       }

},{
    multi:true,
    "arrayFilters": [{ "outer._id":ObjectId(req.body.productid)}] 

},function(err,data){

    blog.collection("posts").findOne({

        "_id":ObjectId(req.body.postid)
    
    },function(err,post){

console.log("this post isssssssssssssssssssssssssssssssssssssssssssssss")
console.log(post.userid)
        req.owner=post.userid
        next()
    })




    

   
})

//----------------------------------------------------------------------------------------

}








app.post("/newmakeorder",anothermiddle,function(req,res){

    console.log("sddddd")
    postid=req.body.postid
    userid=req.body.userid
    var ownerplacedid=ObjectId()
   var ownerpl1=JSON.stringify(ownerplacedid)
  var ownerpl=JSON.parse(ownerpl1)


   


    var userplacedid=ObjectId()
    var userpl1=JSON.stringify(userplacedid)
    var userpl=JSON.parse(userpl1)


console.log(req.owner)
    
    
    
blog.collection("users").updateOne({

    "_id":ObjectId(req.owner)

},{
    $push:{

        'ordersforyou':{
            '_id':ownerplacedid,     
                'userid':userid,
                'userpl':userpl,          
                'productname':req.body.productname,
                'quantityordered':req.body.quantity1,
                'addressfordelivery':req.body.address,
                'status':"pending",
                'read':"unread",
                'productid':req.body.productid,
            
        }
        
    }
},function(err,data){
    
    blog.collection("users").updateOne({
        '_id':ObjectId(userid)
    },{
        $push:{
            'yourorders':{            
                '_id':userplacedid,   
                    
                    'productname':req.body.productname,
                    'ownerpl':ownerpl,
                    'ownerid':req.owner,
                    'quantity':req.body.quantity1,
                    'contactno':req.body.contactno,
                    'status':"pending",
                    'productid':req.body.productid

                
            }
        }
    },function(err,data){
        if(err){
            res.status(404).send("something wrong")
        }else{
            res.json({
                "message":"Your order has been successfully placed"
            })
        }
    })
})



})
app.get("/deleteproduct",isAuth,function(req,res){

    res.render("user/confirmdel.ejs",{postid:req.query.postid,productid:req.query.productid})
})

app.post("/deleteproduct",function(req,res){
console.log(req.body.postid)
console.log(req.body.productid)
newid=JSON.stringify(req.body.productid)
newid1=JSON.stringify(req.body.postid)
  blog.collection("posts").updateOne({

    "_id": ObjectId(req.body.postid)

  },{
      $pull:{
          "products":{"_id":ObjectId(req.body.productid)}
      }
  },function(err,data){
    res.status(200).send(`<h1>Your product has been deleted</h1>`)
  })  
})


app.post("/",function(req,res){
    blog.collection("users").findOne({"email":req.body.email,"password":req.body.password},function(err,user){

        if(user){

       

            req.session.admin=user.Admin
            req.session.adminrule=user.adminrule
            
          req.session.myposts=user.posts
            req.session._id=user._id
            req.session.email=user.email
            req.session.username=user.username
            //newsession.username=req.session.username
            req.session.profileimage=user.image
            req.session.friendlist=user.friends
            // if(typeof(user.presentation)!='undefined'){
            //     req.session.presentation=user.presentation

            // }
            req.session.isAuth=true
            console.log("login information is posted")
            res.redirect("/admin/dashboard")
            }else{

                res.redirect("admin/register")
            }
           
       
    })
})

app.get("/charts",isAuth,function(request,result){

    result.render("charts.ejs")
})

app.post( "/sendrequest",function(req,res){
console.log(req.session._id)
console.log(req.body.id)


    blog.collection("users").updateOne({
        "_id":ObjectId(req.body.id)
    },{
        $push:{
            "friends":{
                "_id":ObjectId(req.session._id),
                "friendname":req.session.username,
                "status":"pending",
                "sender":"false"

            }
        }
    },function(error,data){
            //console.log("Daasa")
            blog.collection("users").updateOne({
                "_id":ObjectId(req.session._id)
            },{
                $push:{
                 "friends":{
                     "_id":ObjectId(req.body.id),
                    "friendname":req.body.data,
                    "status":"pending",
                    "sender":"true"

                           }
                }
            })
        })
        
   
})


app.post("/do-edit-profilepic",function(req,res){
  
    var cursor=blog.collection("posts").find({})

    cursor.forEach(function(doc){

        var comments=doc.comments

        for ( i=0; i < comments.length; i++ ) {
            if (comments[i].username == req.session.username) {
blog.collection('posts').updateOne({
    "_id":doc._id
},{
    $set:{
        "comments.$[outer].image":req.body.image
    }
},{

    "arrayFilters": [{ "outer._id": comments[i]._id }] 

})



            }
    }
    })
        
        
    var cursor1=blog.collection("posts").find({})

    cursor1.forEach(function(doc){

        var comments=doc.comments

        for ( i=0; i < comments.length; i++ ) {
         //------------------------------------------------------------------------------------  
         var replies=comments[i].replies
         //let k=replies.length
         if(typeof(comments[i].replies)!= 'undefined'){
             console.log(comments[i]._id)
         for(j=0;j<replies.length;j++){
         
             if(replies[j].name==req.session.username){
                 console.log(replies[j].name)
                 console.log(replies[j]._id)
                 //console.log(replies[j].name)
         
                 blog.collection("posts").updateOne({
                     "_id":doc._id
                 },{
                     $set:{
                         "comments.$[outer].replies.$[inner].image":req.body.image
                     }
                 },{
                     "arrayFilters": [{ "outer._id": comments[i]._id },{"inner.name":req.session.username}] 
                 })
             }
         
         
         
         
         }
         }
//-------------------------------------------------------------------------------------------------
        }
    })
  
    
    blog.collection("users").updateOne({
        "_id":ObjectId(req.session._id)
    },{
        $set:{
            "image":req.body.image
        }
    },function(err,data){
        res.json({
            "message":"done.Kindly login again to see your set picture"
        })
    })
    
})


//------------------------all uploads of images ---------------------------------------------------------
app.post("/do-updateprofilepic",upload.single('file'),function(req,res){
    // console.log("profilepicupdate image is running")
    // var formData=new formidable.IncomingForm();
    // formData.parse(req,function(error,fields,files){
    //     fs.unlink(fields.image.replace("/",""), function(error){
    //         var oldPath=files.file.path;
    //         var newPath="public/profileimage/" + files.file.name;
    //         fs.rename(oldPath,newPath, function(err){
                res.send(req.file.filename);
        //     })
        // });
        
   // })

})

app.post("/do-uploadprofileimage",upload.single('file'),function(req,res){
    //var formData = new formidable.IncomingForm();
    //console.log(req.body)
    //console.log(formData)
//     formData.parse(req,function(error,fields,files){
       
//         var oldPath=files.file.path;
//         var newPath="public/profileimage/"+files.file.name;
//         console.log(newPath)
//         fs.copyFile(oldPath, newPath, function(err,result){
// console.log(result)
           res.send(req.file.filename)
       // })
    //})

})
app.post("/do-uploadcommentimage",upload.single('file'),function(req,res){
    // var formData = new formidable.IncomingForm();
    // formData.parse(req,function(error,fields,files){
    //     var oldPath=files.file.path;
    //     var newPath="public/commentimage/"+files.file.name;
    //     console.log(newPath)
    //     fs.rename(oldPath, newPath, function(err){
           // res.render("admin/posts",{imagepath:newPath})
           res.send(req.file.filename)
     //   })
   // })

})




//--------------------------------------------------------------------------------------------------
app.get("/admin/getpage/:id",isAuth,function(req,res){

    userid=req.params.id;
    console.log( userid)
    blog.collection("posts").find({
        "username":userid
    }).toArray(function(error,data){
        res.render("user/home",{posts:data})
        console.log(data)
    })
})



app.post("/acceptrequest",function(req,res){
console.log(req.session._id)
console.log(req.body.id)

   // if(req.session._id==req.body.id){
    blog.collection("users").updateOne({
        $and:[{
            "_id":ObjectId(req.session._id)
        },{
            "friends._id":ObjectId(req.body.id)
        }]
    },{
        $set:{
            "friends.$.status":"Accepted"


        }
        
    },function(error,data){

        blog.collection("users").updateOne({
            $and:[{
                "_id":ObjectId(req.body.id)
            },{
                "friends._id":ObjectId(req.session._id)
            }]
    },{
        $set:{
            "friends.$.status":"Accepted"

        }
    },function(error,data){

        res.json({
            "status":"success",
            "message":"friend request has been accepted"
        })
    })

})
//}
})
app.get("/getusers",function(req,res){

blog.collection("users").findOne({
    "username":req.session.username
},function(error,user){
    res.json({
        "status":"success",
        "user":user
    })
})

})
let room="";

io.on("connection",function(socket){
    console.log(socket.id)
    
    socket.on("new_post",function(formData){
    console.log("this is running again")
        io.emit("new_post",formData);
    })
    socket.on("new_post1",function(formData){
        console.log("this is running1")
        io.emit("new_post1",formData);
    })
    socket.on("new_post2",function(formData){
        console.log("dssssssssssssssssssssssssssssssssssssssssssssssssssssss")
        console.log(formData)
        io.emit("new_post2",formData);
    })
    socket.on("new_post3",function(formData){
        //console.log(formData)
        console.log("this is running")

        io.emit("new_post3",formData);
    })
    socket.on("new_post4",function(formData){
        //console.log(formData)
        console.log("this is running3")

        io.emit("new_post4",formData);
    })

    
    socket.on('join-room',function(roomid,cb){
        socket.join(roomid)
console.log("user has joined")
        room=roomid
        io.to(room).emit('new_message',`${cb} has joined`)
         //cb(`joined ${room}`)
    })
      
    socket.on("message",function(roomid,username,chat,blob){
console.log("sdagagsa")
room=roomid
        if(blob!=""){
            console.log(blob)
            let buff = new Buffer.from(blob);
            let base64data = buff.toString('base64');
            //console.log(chat)
        io.to(room).emit('newevent',username,chat,base64data)
        }
        else{

           console.log("My chat is" +" "+chat)
           console.log("Myroom"+ " "+room)
            io.to(room).emit('newevent',username,chat,blob)
        }

      

       
        
    })





socket.on("refresh",()=>{
console.log("fgzagf")

io.emit("pagerefresh");
   
   
})

socket.on("changeimage",function(dat,info,room){
//console.log("the data is sdafdadfaffa"+room)
//console.log(info)
    io.to(room).emit("newimage",dat,info)
    
})

socket.on("datasend",function(f,room){
    //console.log(f)
io.to(room).emit("dataget",f)
})

socket.on("anotherdata",function(gj,room){
   // console.log(gj)
io.to(room).emit("datagetting",gj)
})

socket.on('ptitle',function(title,room){
    io.to(room).emit('givetitle',title)
})

    socket.on("new_comment",function(comment){
        //console.log(comment)
      
        io.emit("new_comment",comment)
    })
    socket.on("new_reply",function(reply){
        console.log(reply)
        io.emit("new_reply",reply)
    })
    socket.on("new_reply1",function(reply){
        console.log(reply)
        io.emit("new_reply",reply)
    })
  
   socket.on("roomdata",function(user,comment,room){

    console.log(user)
    console.log(comment)
    console.log(room)
       io.to(room).emit("getroom",user,comment)
   })
   


})

//app.get("/presentation",function(req,res){
  
//})
app.post("/extract-text",function(req,res){
    if (!req.files && !req.files.pdfFile) {
        res.status(400);
        res.end();
    }

    pdfParse(req.files.pdfFile).then(result => {
        res.send(result.text);
    });
})


app.post("/do-uploadpdffile",upload.single('file'),function(req,res){
    var formData = new formidable.IncomingForm();
    formData.parse(req,function(error,fields,files){
        var oldPath=files.file.path;
        var newPath="public/files/"+files.file.name;
        console.log(newPath)
        fs.rename(oldPath, newPath, function(err){
           // res.render("admin/posts",{imagepath:newPath})
        //    if (!req.files && !req.files.pdfFile) {
        //     res.status(400);
        //     res.end();
        // }
    
        // pdfParse(newPath).then(result => {
         
        //     console.log(result.text)


        // });


           res.send(files.file.name)
        })
    })

})


app.get("/posts/introfile/:id",isAuth,function(req,res){

    var file=req.params.id;
//     var file = fs.createReadStream(`public/files/${file.name}`);
// var stat = fs.statSync(`public/files/${file.name}`);
//     res.setHeader('Content-Length', stat.size);
// res.setHeader('Content-Type', 'application/pdf');
// res.setHeader('Content-Disposition', 'attachment; filename=quote.pdf');

// file.pipe(res);
// fs.readFile("public/files/Doubt_Clearing_Session__Gandhian_Era__VIII_with_anno.pdf",(err,data)=>{

//     res.writeHead(200,{
//         'Content-Type': 'application/pdf'

// })

// res.write(data)
//     })

// reader = fs.createReadStream(file, {
//     flag: 'a+',
//     encoding: 'UTF-8',
//     start: 5,
//     end: 64,
//     highWaterMark: 16
// });
  
// // Read and display the file data on console
// reader.on('data', function (chunk) {
//     console.log(chunk);
// });



console.log(file)

var myfile=`public/files/${file}`;
    var filestream = fs.createReadStream(myfile);                  
    res.writeHead(200, {
       
        "Content-Type":"application/pdf","Content-Transfer-Encoding": "binary"});
    filestream.on('data', function(chunk) {                     
        res.write(chunk);
        //console.log(chunk.toString())
    });
    filestream.on('end', function() {
        res.end();
    });

})

app.get("/posts/wholeimage//public/commentimage/:id",function(req,res){
image="/public/commentimage/"+req.params.id
    console.log(image)
    res.render("user/newimage",{myimage:image})
})
app.get("/wholeimage",function(req,res){
image="/public/commentimage/"+req.query.image
    console.log(req.query.image)
    res.render("user/newimage",{myimage:req.query.image})
})


app.post("/do-uploadvideo",function(req,res){
    console.log("upload video is runing")
    var formData = new formidable.IncomingForm();
formData.parse(req,function(error,fields,files){
    var oldPath=files.file.path;
    var newPath="public/video/"+files.file.name;
    console.log(newPath)
    fs.rename(oldPath, newPath, function(err){
       // res.render("admin/posts",{imagepath:newPath})
       res.send("/"+ newPath)
    })
})
})



app.post("/getmydata",function(req,res){

  
   // var io = req.app.get('socketio');
    //console.log("daasgagrg")
    //io.on("dummy",function(data){
      //  io.emit("newmess",data)
    //})
    blog.collection("presentation").findOne({

        "_id":ObjectId(req.body.info)
    },function(err,mdata){
        if(err){
            console.log(err)
        }
        else{
           // console.log(mdata)
           res.json({
               "mdata":mdata
           })
        }
    })
})



app.get("/presentation",isAuth,function(req,res){
  
if(req.session.adminrule){
    res.render("user/enteroom.ejs",{username:req.session.username,profileimage:req.session.profileimage})
}

else{
    res.status(404).json({
        "message":"You are not allowed to enter into rooms. Kindly contact the admin for this."
    })
}
})





app.post("/enteroom",function(req,res){

    let andata=JSON.stringify(req.session.presentation)
    //console.log(req.body.myimage)
   /// console.log(req.session.presentation)
    res.render("user/presentation.ejs",{username:req.session.username,data:req.session.presentation,andata:andata,room:req.body.myroom,profileimage:req.body.myimage})
})

app.post("/roomcomment",function(req,res){

    console.log(req.body.mytitle)
    var newcommentid=ObjectId()

    
    blog.collection("presentation").updateOne({
        "_id":ObjectId(req.body.mytitle)
    },{
    
        $push:{
            "comments":{
                "_id":newcommentid,
                "username":req.body.user,
                "comment":req.body.comment,
               
            }
        }
    },function(err,data){
        res.json({
            "message":"comment saved",
            "user":req.body.user,
            "comment":req.body.comment
        })
    })
    })



function mymiddle(req,res,next){

    blog.collection("posts").findOne({

        "_id":ObjectId(req.body.postid)
    
    },function(err,post){
        if(err){
            res.json({
                "message":"product is taken off"
            })
        }
        else{
           
            req.owner=post.userid
            next()
    
        }
    })
    

}


app.get("/makeorder",isAuth,function(req,res){
    res.render("user/makeorder.ejs",{username:req.session.username,userid:req.session.userid,currentimage:req.session.profileimage,postid:req.query.postid,userid:req.query.userid})
})





app.post("/makeorder",mymiddle,function(req,res){
console.log("sddddd")
    postid=req.body.postid
    userid=req.body.userid
    var ownerplacedid=ObjectId()
   var ownerpl1=JSON.stringify(ownerplacedid)
  var ownerpl=JSON.parse(ownerpl1)


   


    var userplacedid=ObjectId()
    var userpl1=JSON.stringify(userplacedid)
    var userpl=JSON.parse(userpl1)


console.log(req.owner)
    
    
    
blog.collection("users").updateOne({

    "_id":ObjectId(req.owner)

},{
    $push:{

        'ordersforyou':{
            '_id':ownerplacedid,     
                'userid':userid,
                'userpl':userpl,          
                'productname':req.body.productname,
                'quantityordered':req.body.quantity,
                'addressfordelivery':req.body.address,
                'status':"pending",
                'read':"unread",
            
        }
        
    }
},function(err,data){
    
    blog.collection("users").updateOne({
        '_id':ObjectId(userid)
    },{
        $push:{
            'yourorders':{            
                '_id':userplacedid,   
                    
                    'productname':req.body.productname,
                    'ownerpl':ownerpl,
                    'ownerid':req.owner,
                    'quantity':req.body.quantity,
                    'contactno':req.body.contactno,
                    'status':"pending"

                
            }
        }
    },function(err,data){
        if(err){
            res.status(404).send("something wrong")
        }else{
            res.json({
                "message":"Your order has been successfully placed"
            })
        }
    })
})


})

app.get("/ordersplaced",isAuth,function(req,res){
  blog.collection("users").findOne({

    "_id":ObjectId(req.session._id)
  },function(err,data){
      res.render("user/ordersplaced.ejs",{user:data,newuser:JSON.stringify(data),currentuserimage:req.session.profileimage})
  })  
})
app.get("/yourorders",isAuth,function(req,res){
  blog.collection("users").findOne({

    "_id":ObjectId(req.session._id)
  },function(err,data){
      //console.log(data)
      res.render("user/yourorders.ejs",{user:data,currentuserimage:req.session.profileimage})
  })  
})







      


app.post("/removeorder",function(req,res){
console.log(req.body.productid)
console.log(req.body.ownerid)
    blog.collection("users").updateOne({
"_id":ObjectId(req.session._id)

    },{
        $pull:{
            "yourorders":{
                "_id":ObjectId(req.body.userplacedid)
            }
        }
    },{

    

    }, function(err,data){
        console.log("jhfjhj")
        blog.collection("users").updateOne({
"_id":ObjectId(req.body.ownerid)

    },{
 
        $pull:{
            "ordersforyou":{
                "_id":ObjectId(req.body.ownerplacedid)
                
                
            }
        }

    },{
      
    },
    
    
    
    function(err,data){
//console.log(data)

blog.collection("users").findOne({

    "_id":ObjectId(req.session._id)
  },function(err,data){
     

    res.json({

        data:data
    })

  })  


     
    })
    })
})

app.get("/addinfo",isAuth,function(req,res){

    console.log(req.query.postid)
    res.render("user/adding.ejs",{postid:req.query.postid,username:req.session.username,userid:req.session._id})
})

app.post("/addinfo",function(req,res){
console.log("dsasafsadadfafddsadsdfsdsf")
    var productid=ObjectId()
blog.collection("posts").updateOne({
    "_id":ObjectId(req.body.storeid)
},{

    $push:{
        "products":{
            "_id":productid,
            "description":req.body.description,
            "productname":req.body.productname,
            "company":req.body.company,
            "image":req.body.image,
            "timesordered":0,
        }
    }
},function(err,data){
    res.json({
        "message":"product is pushed"
    })
})

})



app.post("/do-upload-productimage",upload.single('file'),function(req,res){
//     console.log("upload image is runing")
//     var formData = new formidable.IncomingForm();
// formData.parse(req,function(error,fields,files){
//     var oldPath=files.file.path;
//     var newPath="public/images/"+files.file.name;
//     console.log(newPath)
//     fs.copyFile(oldPath, newPath, function(err){
       res.send(req.file.filename)
   // })
///})
})




//-----------------------------------toggleliking of the posts------------------------------------------

app.post("/toggleLikePost",function(request,result){
    //console.log(request._id)
    console.log(request.body.postid)
    console.log(request.body.userid)
   //var accessToken=request.fields.accessToken
    var _id=request.session._id;
    var postid=request.body.postid
    blog.collection("users").findOne({
        "_id":ObjectId(request.session._id)
    },function(error,user){
        if(user==null){
            result.json({
                "status":"error",
                "message":"User has logged out"
            });
        }else{
            blog.collection("posts").findOne({
            "_id":ObjectId(postid)

            },function (error,post){
                if(post==null){
                    result.json({
                        "status":"error",
                        "message":"Post does not exist"
                    })
                } else{
                    var isLiked=false;
                    //console.log(post)
                    for(var a=0;a<post.likers.length;a++){
                        var liker=post.likers[a];
                        if(liker._id.toString()== user._id.toString()){
                            isLiked=true;
                            //console.log(liker._id.toString())
                            //console.log(user._id.toString())
                            

                        }
                    }
if(isLiked){
blog.collection("posts").updateOne({
"_id":ObjectId(postid)
},{
$pull:{
    "likers":{ _id:request.session._id },
    
}
},function(error,res){

    blog.collection("posts").findOne({
        "_id":ObjectId(postid)

        },function (error,post){
            console.log("the newn liked post is this one")
            console.log(post.likers.length)
            console.log("the usr who liked it")
            //console.log(user)
            result.json({
                "post":post,
                "message":"You have liked a post"
            })


            blog.collection("users").updateOne({
                "_id":ObjectId(request.session._id)
                },{
                $pull:{
                    "notifications":{ _id:postid },
                    
                }
                })

            
})  




})

} 

else{
blog.collection("users").updateOne({
"_id":ObjectId(request.session._id)
},{
$push:{
    "notifications":{
        "_id":postid,
        "type":"photo_liked",
        "content":user.name + "has liked your photo",
        "profileImage":user.profileImage,
        "createdAt":new Date().getTime(),
    }
}
})
blog.collection("posts").updateOne({
"_id":ObjectId(postid)
},{
$push:{
    "likers":{
        "_id":request.session._id,
        "name":request.session.username,
        "profileImage":request.session.profileimage
    }
}

},function(err,post){
    blog.collection("posts").findOne({
            "_id":ObjectId(postid)

            },function (error,post){
                console.log("the newn liked post is this one")
                console.log(post.likers.length)
                console.log("the usr who liked it")
                //console.log(user)
                result.json({
                    "post":post,
                    "message":"You have liked a post"
                })
    })
    })

}
                  
}   
                             
})
}
})
})


//app.use(express.json());

//app.use(require('body-parser').json())
//app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json
app.use(bodyParser.json())


app.post("/declineorder",function(req,res){
    let myJson = req.body;      // your JSON
	let myValue = req.body.myKey
    console.log(myJson)
    console.log(req.body.ownerplacedid)
    console.log(req.body.userid)
    console.log(req.body.userplacedid)
    
        console.log("declien is running")
        blog.collection("users").updateOne({
    
            "_id":ObjectId(req.session._id),
            
        },{
            $set:{
                "ordersforyou.$[outer].status":"declined"
            }
        },{

            multi:true,
            "arrayFilters": [{ "outer._id":ObjectId(req.body.ownerplacedid)}] 
        },
        function(err,data){
    console.log(data)
             blog.collection("users").updateOne({
                 "_id":ObjectId(req.body.userid)
             },{
                 $set:{
                     "yourorders.$[outer].status":"declined"
                 }
    
    
                 
             },{
                multi:true,
                "arrayFilters": [{ "outer._id":ObjectId(req.body.userplacedid)}] 
            
               
            
            },function(err,data){
    
                console.log(data)
                res.json({
                    "message":"order is successfully declined"
                })
            })
        })
    })
    
    
    app.post("/acceptorder",function(req,res){


        const _id = ObjectId(req.body.ownerplacedid);
      
        
        blog.collection("users").updateOne({
    
            "_id":ObjectId(req.session._id),
            
        },{
           $set:{
               "ordersforyou.$[outer].status":"accepted"
           }
    
    },{
        multi:true,
        "arrayFilters": [{ "outer._id":ObjectId(req.body.ownerplacedid)}] 
    
    },function(err,data){
        console.log(data)
        blog.collection("users").updateOne({
            "_id":ObjectId(req.body.userid)
        },{
            $set:{
                "yourorders.$[outer].status":"accepted"
    
                
            }
    
    
            
        },{
            multi:true,
           "arrayFilters": [{ "outer._id":ObjectId(req.body.userplacedid)}] 
       
       },function(err,data){
           console.log(data)
           res.json({
               "message":"successfully updated"
    
           })
       })
    
    
    })
    
    //----------------------------------------------------------------------------------------
    }) 



    app.post("/readorder",function(req,res){


        const _id = ObjectId(req.body.ownerplacedid);
        console.log(req.body.ownerplacedid)
      
        console.log(req.body.userplacedid)
        console.log(req.body.userid)
        console.log(req.session._id)
        
        blog.collection("users").updateOne({
    
            "_id":ObjectId(req.session._id),
            
        },{
           $set:{
               "ordersforyou.$[outer].read":"read"
           }
    
    },{
        multi:true,
        "arrayFilters": [{ "outer._id":ObjectId(req.body.ownerplacedid)}] 
    
    })
    
    //----------------------------------------------------------------------------------------
    }) 


//-----------------uploading file to mongodb uploads and gettting them--------------------------------------------
app.get("/newpage",function(req,res){

    res.render("admin/newroute.ejs")
})



app.post('/uploadfile', upload.single('file'), (req, res) => {
    // res.json({ file: req.file });
    console.log(req.file.filename)
    res.redirect('/newpage');
  });


  //app.get('/getfiles', (req, res) => {
      function imagemiddle(req,res,next){
     
   //----------------------------------------------------------------------------------------------
    gfs.files.find().toArray((err, files) => {
      // Check if files
      if (!files || files.length === 0) {
        res.render('admin/newimages.ejs', { files: false });
      } else {
        files.map(file => {
          if (
            file.contentType === 'image/jpeg' ||
            file.contentType === 'image/png'
          ) {
            file.isImage = true;
          } else {
            file.isImage = false;
          }
        });
        
        //res.render('admin/newimages.ejs', { files: files });
        req.allimages=files
      }
    });
  //});
}


function getfileid(req,res,next){
console.log("getvideoisrun")
    console.log(req.body.videoid)
    blog.collection("uploads.files").findOne({ filename: req.body.videoid }, (err, file) => {
        // Check if file
       //if (file) {
     console.log(file)    
req.id=file._id
next()
     //   } 
//else{

   
//}

})

}









  app.get('/image/:filename', (req, res) => {

   // console.log("mongoimage is run")
//console.log("this is the new which is a file that is loaded"+req.params.filename)
//--------------------------------------displaying the image---------------------------------------
//    blog.collection("uploads.chunks").find(
//        {
// files_id:ObjectId(req.params.filename)
//        }).toArray(function(error,file){
//        // console.log(file)
//          //console.log(files)
    
//         // function uploadPhoto(req, res) {
//             var file = fs.createReadStream(file)
//             req.pipe(file).on('error', function(err) { console.log(err) })
//        // }

// })
//-------------------------------------------------------------------------------------------------
   
gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType == 'image/jpeg' || file.contentType =='image/png') {
      // Read output to browser
     // const readstream = gfs.createReadStream(file.filename);
      //readstream.pipe(res);
      const readStream = gridFSBucket.openDownloadStream(file._id);     // console.log(res.headers)
      readStream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
  });


//------------------------------------------------------------------------------------------------

//---------------------------------------reading video---------------------------------------------

app.post('/video',getfileid, (req, res) => {


    // mongodb.MongoClient.connect("mongodb://localhost:27017/ttchanell", function (error, client) {
    //   if (error) {
    //     res.status(500).json(error);
    //     return;
    //   }
    console.log("videowillplay")
    console.log(ObjectId(req.id))
  
    
    var buffe=""
    var base64=""
      const db = client.db('ttchanell');
      // GridFS Collection
      
      blog.collection("uploads.chunks").find().sort({_id:1}).toArray(function(error,chunks){
        
        chunks.forEach(function(elem){
          //console.log(elem.files_id) 
  if(elem.files_id.toString()==req.id){
   
    base64+= elem.data.toString('base64');
  }
  
        })
      
        res.json({
          "message":"video uploaded",
          "data":base64 
      
    })
   
    })
        
    
  });
  
  function deleteinitial(req,res,next){

    console.log("deleteinital")



   if((JSON.parse(req.body.oldimages).length!=0)||(JSON.parse(req.body.oldvideos)).length!=0){

if(typeof(req.oldvideos)!='undefined'){
    var videos=JSON.parse(req.body.oldvideos)
}
else{
    var videos=[]
}
     
      var images=JSON.parse(req.body.oldimages)
      //console.log(videos)
//       console.log(images)
// gfs.files.find({
//     $or:[{
//         filename:{$in:req.body.oldimages}
//     },{
//         filename:{$in:req.body.oldvideos}
//     }]

   
// },function(err,data){
//     //console.log(JSON.parse(data))
//     blog.collection("uploads.chunks").deleteMany({
//         files_id:data._id
//     })
// })
//  console.log("deleted the initial pictures and videos")
// next()
        
// }else{
//     next()
// }





var cursor=gfs.files.find({})
cursor.forEach(function(doc){
    

  if(images.includes(doc.filename)||(videos.includes(doc.filename))){
    console.log(doc._id)
    blog.collection("uploads.chunks").deleteMany({
                files_id:ObjectId(doc._id)
         })
         

  }

//     for ( i=0; i < comments.length; i++ ) {
//         if (comments[i].username == req.session.username) {
// blog.collection('posts').updateOne({
// "_id":doc._id
// },{
// $set:{
//     "comments.$[outer].image":req.body.image
// }
// },{

// "arrayFilters": [{ "outer._id": comments[i]._id }] 

// })



//         }
// }
})
console.log("deleted previous files")
next()

  }
  else{
      next()
  }
  }





app.get("/test1",function(req,res){
    res.render("admin/test1.ejs")
})

app.post("/test1",function(req,res){

    console.log('fetching')
    console.log(req.body)
    blog.collection("users").find().sort({_id:1}).toArray(function(error,data1){
        let adata = JSON.stringify(data1)

        res.send(adata)
})
})

app.post("/mychat",function(req,res){
    res.render('admin/chat.ejs',{username:req.session.username,roomid:req.body.roomid,currentuserimage:req.session.profileimage})   

})

app.get("/mychat",function(req,res){

    res.render("admin/room.ejs",{username:req.session.username})
})


 app.get("/contact/:file",(req,res)=>{
    console.log(req.params.file)
    var myfile=`public/files/${req.params.file}`;
    var filestream = fs.createReadStream(myfile);                  
    res.writeHead(200, {
       
        "Content-Type":"application/pdf","Content-Transfer-Encoding": "binary"});
    filestream.on('data', function(chunk) {                     
        res.write(chunk);
        //console.log(chunk.toString())
    });
    filestream.on('end', function() {
        res.end();
    });

 })


 app.get("/myprofile",(req,res)=>{
    res.clearCookie('admin')

    blog.collection("messages").find().sort({_id:1}).toArray(function(error,mymessages){
        res.render("user/myprofile",{messages:mymessages,messegeg:"You can send message now"})
        console.log(mymessages)
    })


 })





app.get("/myprofile/messagewithrav34897",(req,res)=>{
    res.render('user/messaging')
})

app.get("/getform",(req,res)=>{

    res.cookie('username',req.query.username,{
        maxAge:300000 

    })
    res.cookie('password',req.query.password,{
        maxAge:300000 
    })
    blog.collection("messages").find().sort({_id:1}).toArray(function(error,mymessages){
        res.render("user/myprofile",{messages:mymessages,messegeg:"You can send message now"})
})
})


// const Cookiemiddle=(req,res,next)=>{
//     if(req.cookies.username){
//         next()
//     } else{
//         res.redirect("/message")
//     }
// }

app.post("/myprofile/sendmessage",(req,res)=>{
    console.log(req.body.comment)
   if(req.cookies.username){

//---------------------------------insert message in db--------------------------------------------------

blog.collection("messages").insertOne({
        
    "username":req.cookies.username,
    "password":req.cookies.password,
    "message":req.body.comment,

      
},function(error,data){
    res.json({

        'username':req.cookies.username,
        'password':req.cookies.password,
        'comment':req.body.comment
            })
})
   //---------------------------------------------------------------------------------------------
    



   } else{
  

  res.json({

    'comment':"Not logged in"
})
   }
       
   
})

app.get("/terminatesession",(req,res)=>{
    res.clearCookie('username')
    res.clearCookie('password')
    res.clearCookie('admin')
    res.redirect("/myprofile")
})

//-----------------------------------------------------------------------------------------------
http.listen(process.env.PORT || 3000,function(){
        console.log("connected")

    })
})