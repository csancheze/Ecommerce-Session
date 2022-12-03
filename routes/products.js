import express from "express"
import ProductsService from "../utils/productsService.js"
import {faker} from "@faker-js/faker";
const  products = express.Router();
const {commerce, image} = faker;
faker.locale = "es";

const checkLogin = (request,response,next)=>{
    if(request.session.username){
        next();
    } else{
        response.redirect("/login");
    }
}

products.get("/login", (request, response) => {
    response.render("login")
})

products.post("/login", (request, response) => {
    console.log(request.body)
    if (request.body.username){
        request.session.username = request.body.username
    }

    response.redirect("/")
})

products.get("/logout", (request, response) => {
    let user = {
        name: request.session.username
    }
    response.render("logout", {user})
})

products.post("/logout", (request, response) => {
    request.session.destroy();
    response.redirect("/login")
})


products.get("/", checkLogin, async (request, response)=>{
    let user = {
        name: request.session.username
    }
    response.render("form", {user})
})

products.post("/productos", checkLogin, async(request,response)=>{
    const newProduct = request.body;
    const productos = await ProductsService.agregarProducto(newProduct);
    console.log(productos)
    response.redirect("/")
})

products.get("/api/productos-test", checkLogin, async (request, response)=>{
    let user = {
        name: request.session.username
    }
    let productos=[];
    for(let i=0;i<5;i++){
        
        productos.push(
            {
                title: commerce.productName(),
                thumbnail: image.imageUrl(100,100,"product",true),
                price: commerce.price()
            }
        )
    }
   response.render("test", {productos,user})
})
    

export default products