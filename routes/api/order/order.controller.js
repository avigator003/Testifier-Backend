const { Invoice } = require('react-simple-invoice');
const Order = require('../../../Models/order')
const User = require('../../../Models/user')
const easyinvoice = require('easyinvoice');
const fs = require('fs')
const Product = require('../../../Models/product')
const moment = require('moment-timezone');

exports.list = (req, res) => {
  Order.find().populate({
    path: 'products.product',
    populate: {
      path: 'product_category',
      model: 'Category'
    }
  }).populate("user").then(data => {
    res.status(200).json({ 'success': true, 'message': 'All Orders fetched', data });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

exports.deletOrder = (req, res) => {
  Order.findByIdAndRemove(req.params.id).then(data => {
    res.status(200).json({ 'success': true, 'message': 'order removed' });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

exports.createOrder = async (req, res) => {
  try {
    const { products, userId } = req.body;
    const currentDate = new Date()
    const productPromises = products.map((p) =>
      Product.findById(p.product)
        .populate('product_category')
        .exec()
    );

    const productsData = await Promise.all(productPromises);

    let totalPrice = 0;

    // calculate the total price of all products
    for (let i = 0; i < productsData.length; i++) {
      const { quantity } = products[i];
      const priceForUser = productsData[i].prices.find((price) => {
        return price.users.some((user) => user.toString() === userId);
      });

      if (!priceForUser) {
        const productName = productsData[i]?.product_name;
        const userName = await User.findById(userId).select('user_name').exec();
        return res.status(200).json({
          success: false,
          message: `The price for product ${productName} is not associated with user ${userName.user_name}.`
        });
      }

      totalPrice += priceForUser?.price * quantity;
    }

    const count = await Order.countDocuments();
    const invoiceNumber = count + 1;
    const orderProducts = products.map(({ product, quantity }) => ({
      product,
      quantity
    }));

    // Find all unpaid orders for the user and calculate the total due amount
    const previousOrders = await Order.find({ user: userId }).sort('-createdAt');
    const uncompletedOrders = previousOrders.filter(order => order.status !== 'Completed');
    if (uncompletedOrders.length > 0) {
      return res.status(200).json({
        success: false,
        message: 'You have uncompleted orders. Please complete your previous orders before creating a new one.'
      });
    }
    
    const previousDueAmount = previousOrders.length ? previousOrders[previousOrders.length-1].duePayment : 0;

    // Calculate the previousOrderDueAmount and totalAmount
    const previousOrderDueAmount = previousOrders.length ? previousOrders[previousOrders.length-1].duePayment : 0;
    const totalAmount = totalPrice + previousOrderDueAmount;

    // Create the new order and set its due amount to the total price plus the previous due amount (if any)
    const order = new Order({
      products: orderProducts,
      invoiceNumber,
      totalPrice,
      user: userId,
      orderDate: currentDate,
      previousOrderDueAmount, // Set the previousOrderDueAmount
      totalAmount, // Set the totalAmount
      duePayment: totalAmount, // Set the duePayment to the totalAmount
    });

    await order.save();
    res.status(200).json({ success: true, message: 'Order Created', data: order });
  } catch (error) {
    console.log('err', error);
    res.status(400).json({ success: false, message: error.message });
  }
};



exports.updateOrder = async (req, res) => {
  try {
    const { products, userId } = req.body;
    const currentDate = new Date();

    // Get the order data from the database
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'products.product',
        populate: {
          path: 'prices.user',
          model: 'User'
        }
      })
      .exec();

    // Update the quantities of the products in the order
    for (let i = 0; i < products.length; i++) {
      const { product: productId, quantity } = products[i];
      const productIndex = order.products.findIndex(
        (p) => p.product._id.toString() === productId.toString()
      );
      if (productIndex !== -1) {
        order.products[productIndex].quantity = quantity;
      }
      else {
        // Product not found in the order, add it to the array
        const productData = await Product.findById(productId)
          .populate('product_category')
          .exec();
        order.products.push({ product: productData, quantity });
      }
    }

    // Check if any products were removed from the database and update the order accordingly
    const orderProductIds = order.products.map((p) => p.product._id.toString());
    const databaseProductIds = products.map((p) => p.product.toString());
    const removedProductIds = orderProductIds.filter((id) => !databaseProductIds.includes(id));
    if (removedProductIds.length > 0) {
      // Remove the products from the order that were removed from the database
      for (let i = 0; i < removedProductIds.length; i++) {
        const productIndex = order.products.findIndex((p) => p.product._id.toString() === removedProductIds[i]);
        if (productIndex !== -1) {
          order.products.splice(productIndex, 1);
        }
      }
    }

    // Recalculate the total price of the order based on the updated product quantities
    let totalPrice = 0;
    for (let i = 0; i < order.products.length; i++) {
      const { product, quantity } = order.products[i];
      const priceForUser = product.prices.find((price) => {
        return price.users.some((user) => user.toString() === userId);
      });
      if (priceForUser && priceForUser.price) {
        totalPrice += priceForUser.price * quantity;
      }
    }

    // Update the order data and save it to the database
    order.totalPrice = totalPrice || 0;
    order.orderDate = currentDate;
    const updatedOrder = await order.save();
    res.status(200).json({ success: true, message: 'Order Updated', data: updatedOrder });
  } catch (error) {
    console.log('err', error);
    res.status(400).json({ success: false, message: error.message });
  }
};



// Update Order Status
exports.updateOrderStatus = (req, res) => {
  const newStatus = req.body.status;

  // Find the order by ID
  Order.findById(req.params.id)
    .then((order) => {
      if (!order) {
        throw new Error('Order not found');
      }
      // Calculate the remaining balance


      // Update the order with new status and payment information
      order.status = newStatus;
      const date = new Date();
      date.setHours(23);
      date.setMinutes(59);
      date.setSeconds(59);
      date.setMilliseconds(999);
      return order.save();
    })
    .then((data) => {
      res.status(200).json({ success: true, message: 'Order status updated', data });
    })
    .catch((err) => {
      res.status(400).json({ success: false, message: err.message });
    });
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, payment } = req.body;

    const order = await Order.findById(req.params.id).exec();
    if (!order) {
      throw new Error('Order not found');
    }

    const userId=order.user;

    const orders = await Order.find({
      user: order.user,
      paymentStatus: { $ne: 'Cancelled' }
    }).sort({ createdAt: 1 }).exec();

    let previousDueAmount = 0;
    const index = orders.findIndex((o) => o._id.toString() === order._id.toString())
    if (index > 0) {
      previousDueAmount = orders.slice(0, index).reduce((acc, val) => acc + val.duePayment, 0)
    }

    const newDueAmount = order.duePayment - payment;
    let updatedLastDueAmount = newDueAmount;
    order.paymentStatus = paymentStatus;
    order.paidAmount = Number(order.paidAmount)+Number(payment);
    order.duePayment = newDueAmount;
    await order.save();

    const unpaidOrders = orders.filter((o) => o.paymentStatus === 'Unpaid' || o.paymentStatus === 'Partial Payment');

    for (let i = 0; i < unpaidOrders.length; i++) {
      const unpaidOrder = unpaidOrders[i];
      if (unpaidOrder._id.toString() !== order._id.toString()) {
        if (unpaidOrder.orderDate >= order.orderDate) {
          previousDueAmount += unpaidOrder.totalPrice;
          unpaidOrder.duePayment = unpaidOrder.totalPrice + updatedLastDueAmount - unpaidOrder.paidAmount;
          updatedLastDueAmount = unpaidOrder.duePayment;
          await unpaidOrder.save();
        }
      }
    }

    if (paymentStatus === 'Paid') {
      const userOrders = await Order.find({ user: order.user }).exec();
      for (let i = 0; i < userOrders.length; i++) {
        const userOrder = userOrders[i];
        userOrder.paidAmount = userOrder.totalPrice;
        userOrder.duePayment = userOrder.totalAmount-userOrder.totalPrice;
        userOrder.paymentStatus="Paid"
        await userOrder.save();
      }
    }




    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating payment status'
    });
  }
};


exports.viewOrder = (req, res) => {
  Order.findById(req.params.id)
    .populate('products.product', 'product_name price') // populate the 'product' field of the 'products' array with the specified fields
    .exec()
    .then(data => {
      res.status(200).json({ 'success': true, 'message': 'order fetched', 'orders': data });
    }).catch(err => {
      res.status(400).json({ 'success': false, 'message': err });
    })
}

exports.viewOrderByDateOrUser = (req, res) => {
  const { startDate, endDate, userId } = req.body;
  const user = userId;

  let query = {};
  if (startDate && endDate && user) {
    query = {
      orderDate: {
        $gte: new Date(startDate),
        $lt: new Date(endDate + 'T23:59:59.999Z')
      },
      user: user
    };
  } else if (startDate && endDate) {
    query = {
      orderDate: {
        $gte: new Date(startDate),
        $lt: new Date(endDate + 'T23:59:59.999Z')
      }
    };
  } else if (user) {
    query = { user: user };
  }

  Order.find(query)
    .populate('products.product')
    .populate('user')
    .then(data => {
      res.status(200).json({ 'success': true, 'message': 'orders fetched', 'orders': data });
    })
    .catch(err => {
      res.status(400).json({ 'success': false, 'message': err });
    })
}


exports.donwloadInvoice = async (req, res) => {
  var orderId = req.params.id;
  var invoiceNumber = 0;
  const productsList = await Order.findById(orderId)
    .populate({
      path: 'products.product',
      populate: {
        path: 'product_category',
        model: 'Category',
      },
    })
    .populate("user")
    .then(order => {
      invoiceNumber = order?.invoiceNumber;
      const userId = order.user._id
      const products = order.products.map(productObj => {
        const product = productObj.product;
        const description = product.product_name;
        const priceForUser = product.prices?.find(price => {
          return price.users.some(user => JSON.stringify(user) === JSON.stringify(userId)
          );
        });
        const price = priceForUser.price;
        const quantity = productObj.quantity;
        const taxRate = 18;

        return { quantity, description, "tax-rate": taxRate, price };
      });
      return products;
    })
    .catch(error => {
      console.error(error);
    });
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  var data = {
    "images": {
      // The logo on top of your invoice
      "logo": "https://public.easyinvoice.cloud/img/logo_en_original.png",
      // The invoice background
      "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
    },
    // Your own data
    "sender": {
      "company": "Star Bakery",
      "address": "Sample Street 123",
      "zip": "1234 AB",
      "city": "Ahemdabad",
      "country": "India"
    },
    // Your recipient
    "client": {
      "company": "Client Corp",
      "address": "Clientstreet 456",
      "zip": "4567 CD",
      "city": "Ahemdabad",
      "country": "India"
    },
    "information": {
      // Invoice number
      "number": invoiceNumber,
      // Invoice data
      "date": formattedDate,
    },
    "products": productsList,
    // The message you would like to display on the bottom of your invoice
    "bottom-notice": "Kindly pay your invoice within 15 days.",
    // Settings to customize your invoice
    "settings": {
      "currency": "INR"
    },
  };

  easyinvoice.createInvoice(data, async function (result) {
    var orderPdfName = `order-${orderId}.pdf`
    var filePath = `public/invoices/${orderPdfName}`;
    await fs.writeFileSync(filePath, result.pdf, 'base64');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filePath}"`);
    res.status(200);
    xw
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  })

}



