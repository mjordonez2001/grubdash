const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

// list function
function list(request, response) {
    response.json({ data: dishes });
}

// create function
function create(request, response) {
    const { data: { name, description, price, image_url } = {} } = request.body;

    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url
    };
    dishes.push(newDish);
    response.status(201).json({ data: newDish });
}

// read function
function read(request, response) {
    const dish = response.locals.dish;
    response.json({ data: dish });
}

// update function
function update(request, response) {
    const dish = response.locals.dish;
    const { data: { name, description, price, image_url } = {} } = request.body;

    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;
    response.json({ data: dish });
}

// dish exists validation
function dishExists(request, response, next) {
    const dishId = request.params.dishId;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    
    if (foundDish) {
        response.locals.dish = foundDish;
        return next();
    }
    return next({
        status: 404,
        message: `Dish id not found: ${dishId}`
    });
}

// body data has validation
function bodyDataHas(propertyName) {
    return function (request, response, next) {
        const { data = {} } = request.body;
        if (data[propertyName]) {
          return next();
        }
        next({
            status: 400, 
            message: `Must include a ${propertyName}` 
        });
    };
}

// price validation 
function validPrice(request, response, next) {
    const { data: { price } = {} } = request.body;
    if (price <= 0 || !Number.isInteger(price)) {
        return next({
          status: 400,
          message: "Dish must have a price that is an integer greater than 0",
        });
    }
    next();
}

// update dish body and dish id validation
function sameDishId(request, response, next) {
    const dishId = request.params.dishId;
    const { data: { id } = {} } = request.body;

    if (dishId === id || !id) {
        return next();
    }
    return next({
        status: 400, 
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
    });
}

module.exports = {
    list,
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        validPrice,
        bodyDataHas("image_url"),
        create
    ],
    read: [
        dishExists,
        read
    ],
    update: [
        dishExists,
        sameDishId,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        validPrice,
        bodyDataHas("image_url"),
        update
    ]
    
}
