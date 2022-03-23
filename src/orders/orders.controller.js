const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

// list function
function list(request, response) {
    response.json({ data: orders });
}

//create function
function create(request, response) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = request.body;

    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes
    }
    orders.push(newOrder);
    response.status(201).json({ data: newOrder });
}

// read function
function read(request, response) {
    const order = response.locals.order;
    response.json({ data: order });
}

// update function 
function update(request, response) {
    const order = response.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = request.body;

    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;
    response.json({ data: order });
}

// destroy function
function destroy(request, response) {
    const orderId = Number(request.params.orderId);

    const index = orders.findIndex((order) => order.id === orderId);
    orders.splice(index, 1);
    response.sendStatus(204);
}

// order exists
function orderExists(request, response, next) {
    const orderId = request.params.orderId;
    const foundOrder = orders.find((order) => order.id === orderId);

    if (foundOrder) {
        response.locals.order = foundOrder;
        return next();
    }
    return next({
        status: 404, 
        message: `Order id not found: ${orderId}`
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

// dishes validation
function dishesIsArray(request, response, next) {
    const { data: { dishes } = {} } = request.body;

    if (dishes.length && Array.isArray(dishes)) {
        return next();
    }
    return next({
        status: 400,
        message: "Order must include at least one dish"
    });
}

// validates each dish 
function validDishes(request, response, next) {
    const { data: { dishes } = {} } = request.body;

    dishes.forEach((dish, index) => {
        if (!dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity)) {
            next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            });
        }
    });
    return next();
}

// validates the status
function validStatus(request, response, next) {
    const { data: { status } = {} } = request.body;
    const validEntries = ["pending", "preparing", "out-for-delivery"]

    if (!status || !validEntries.includes(status)) {
        return next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
        });
    } else if (status === "delivered") {
        return next({
            status: 400,
            message: `A delivered order cannot be changed`
        });
    }
    next();
}

// update order body and order id validation
function sameOrderId(request, response, next) {
    const orderId = request.params.orderId;
    const { data: { id } = {} } = request.body;

    if (orderId === id || !id) {
        return next();
    }
    return next({
        status: 400, 
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`
    });
}

// destroy order status validation
function orderPending(request, response, next) {
    const orderStatus = response.locals.order.status;

    if (orderStatus === "pending") {
        return next();
    }
    return next({
        status: 400,
        message: `An order cannot be deleted unless it is pending`
    });
}

module.exports = {
    list,
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        dishesIsArray,
        validDishes,
        create
    ],
    read: [
        orderExists,
        read
    ],
    update: [
        orderExists,
        sameOrderId,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        dishesIsArray,
        validDishes,
        validStatus,
        update
    ],
    delete: [
        orderExists,
        orderPending,
        destroy
    ]
}
