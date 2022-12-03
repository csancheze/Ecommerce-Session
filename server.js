import express from 'express'
import products from './routes/products.js'
import handlebars from 'express-handlebars'
import  path from 'path'
import { Server } from "socket.io"
import MessagesService from './utils/messagesService.js'
import ProductsService from './utils/productsService.js'
import mongoose from 'mongoose';
import * as dotenv from 'dotenv' 
import { normalize, schema, denormalize } from "normalizr";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
dotenv.config()

import {fileURLToPath} from 'url';

const database = process.env.DATABASE || "mongodb"

if (database == "mongodb") {
    let uri = 'mongodb://localhost:27017/ecommerce2'
    if (process.env.MONGO_PASS) {
        uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.8aaoc.mongodb.net/ecommerce2?`
    }
    mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    }, error=>{
        if(error) throw new Error(`connection failed ${error}`);
        console.log("conexion exitosa")
    });
}
const app = express();

app.use(cookieParser());

app.use(session({
    store: MongoStore.create({
        mongoUrl: `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.8aaoc.mongodb.net/sessionsDB?retryWrites=true&w=majority`
    }),
    secret:"claveSecreta",
    resave:false,
    saveUninitialized: false,
    rolling: true,
    cookie:{
        maxAge:10 * 60 * 1000
    }
}));

const authorSchema = new schema.Entity("authors",{}, {idAttribute:"email"});
const messageSchema = new schema.Entity("messages", {author: authorSchema});
const chatSchema = new schema.Entity("chat", {
    messages:[messageSchema]
}, {idAttribute:"id"});

const normalizeData = (data)=>{
    const normalizeData = normalize({id:"chatHistory", messages:data}, chatSchema);
    return normalizeData;
};

const normalizeMensajes = async()=>{
    const results = await MessagesService.todosLosMensajes();;
    const messagesNormalized = normalizeData(results);
    return messagesNormalized;
}


const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename)



const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, ()=>console.log(`listening on port ${PORT}`));

const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.engine("handlebars",handlebars.engine());

app.use(express.static(path.join(__dirname, 'public')))

app.set("views", path.join(__dirname, "views"));

app.set("view engine", "handlebars");

app.use("/", products) 

io.on("connection",async (socket)=>{
    console.log("nuevo socket o cliente conectado", socket.id);
    socket.emit("messageFromServer","se ha conectado exitosamente")

    const products = await ProductsService.buscarTodos();
    socket.emit("productos",products)
    socket.emit("historico", await normalizeMensajes())
    socket.on("message",async data=>{
            console.log(data);
            console.log("hola", normalizeMensajes())
            await MessagesService.agregarMensaje(data);
            io.sockets.emit("historico", await normalizeMensajes());
        })
    socket.on("form",async data =>{
        console.log(data);
        const productos = await ProductsService.agregarProducto(data)
        io.sockets.emit("productos",productos)
    })
    
    
}) 