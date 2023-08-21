
const Order = require('../../../Models/order')
const User = require('../../../Models/user')
const easyinvoice = require('easyinvoice');
const fs = require('fs')
const Product = require('../../../Models/product');
const { bucketName, s3, getPhoto } = require('../../..');
const { PutObjectCommand, S3, S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const Stock = require('../../../Models/stock')

const updateStockQuantities = async (order) => {
  const productsToUpdate = order.products;

  for (const productData of productsToUpdate) {
    const productId = productData.product;
    const orderQuantity = productData.quantity;

    // Find the stock entry for the product
    const stockEntry = await Stock.findOne({ product: productId });

    if (stockEntry) {
      // Decrement the stock quantity by the order quantity
      stockEntry.quantity -= orderQuantity;

      // Save the updated stock entry
      await stockEntry.save();
    }
  }
};

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
    const { products,userId,orderCreatedUserId} = req.body;
    const currentDate = new Date()
    const timeZoneOffsetMinutes = 330; // 5 hours * 60 minutes + 30 minutes

    // Calculate the local date and time
    const currentDateTimeLocal = new Date(currentDate.getTime() + timeZoneOffsetMinutes * 60000);

    const productPromises = products.map((p) =>
      Product.findById(p.product)
        .populate('product_category')
        .exec()
    );

    const oneDayAheadDateTimeLocal = new Date(currentDateTimeLocal.getTime() + 24 * 60 * 60 * 1000); // Add one day's worth of milliseconds

    const productsData = await Promise.all(productPromises);

    let totalPrice = 0;

    // calculate the total price of all products
    for (let i = 0; i < productsData.length; i++) {
      const { quantity } = products[i];
      const priceForUser = productsData[i].prices.find((price) => {
        return price.users.some((user) => user.toString() === orderCreatedUserId);
      });

      if (!priceForUser) {
        const productName = productsData[i]?.product_name;
        const userName = await User.findById(orderCreatedUserId).select('user_name').exec();
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
    const previousOrders = await Order.find({ orderCreatedUserId: orderCreatedUserId }).sort('-createdAt');
    const uncompletedOrders = previousOrders.filter(order => order.status !== 'Completed');
    if (uncompletedOrders.length > 0) {
      return res.status(200).json({
        success: false,
        message: 'You have uncompleted orders. Please complete your previous orders before creating a new one.'
      });
    }
    

    // Calculate the previousOrderDueAmount and totalAmount
    const previousOrderDueAmount = previousOrders.length ? previousOrders[previousOrders.length-1].duePayment : 0;
    const totalAmount = totalPrice + previousOrderDueAmount;

    // Create the new order and set its due amount to the total price plus the previous due amount (if any)
    const order = new Order({
      products: orderProducts,
      invoiceNumber,
      totalPrice,
      user: userId,
      orderCreatedUserId:orderCreatedUserId,
      orderDate: oneDayAheadDateTimeLocal,
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
    const { products ,orderCreatedUserId} = req.body;
   
    // Get the order data from the database
    const order = await Order.findById(req.params.rowId)
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
        return price.users.some((user) => user.toString() === orderCreatedUserId);
      });
      if (priceForUser && priceForUser.price) {
        totalPrice += priceForUser.price * quantity;
      }
    }



    // Update the order data and save it to the database
    order.totalPrice = totalPrice || 0;
    order.totalAmount = (order.previousOrderDueAmount + totalPrice) || 0;
    order.duePayment = (order.totalAmount - order.paidAmount) || 0;
    const updatedOrder = await order.save();
    res.status(200).json({ success: true, message: 'Order Updated', data: updatedOrder });
  } catch (error) {
    console.log('err', error);
    res.status(400).json({ success: false, message: error.message });
  }
};



// // Update Order Status
// exports.updateOrderStatus = (req, res) => {
//   const newStatus = req.body.status;

//   // Find the order by ID
//   Order.findById(req.params.id)
//     .then((order) => {
//       if (!order) {
//         throw new Error('Order not found');
//       }
//       // Calculate the remaining balance


//       // Update the order with new status and payment information
//       order.status = newStatus;
//       const date = new Date();
//       date.setHours(23);
//       date.setMinutes(59);
//       date.setSeconds(59);
//       date.setMilliseconds(999);

//       return order.save();
//     })
//     .then((data) => {
//       res.status(200).json({ success: true, message: 'Order status updated', data });
//     })
//     .catch((err) => {
//       res.status(400).json({ success: false, message: err.message });
//     });
// };


exports.updateOrderStatus = async (req, res) => {
  const newStatus = req.body.status;

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new Error('Order not found');
    }

    // Update the order status
    order.status = newStatus;

    if (newStatus === 'Completed') {
      // Update stock quantities
      await updateStockQuantities(order);
    }

    // Save the updated order
    await order.save();

    res.status(200).json({ success: true, message: 'Order status updated', data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, payment } = req.body;

    const order = await Order.findById(req.params.id).exec();
    if (!order) {
      throw new Error('Order not found');
    }

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
    else if (paymentStatus === 'Unpaid') {
      const userOrders = await Order.find({ user: order.user }).exec();
      for (let i = 0; i < userOrders.length; i++) {
        const userOrder = userOrders[i];
        userOrder.paidAmount = 0;
        userOrder.duePayment = userOrder.totalAmount;
        userOrder.paymentStatus="Unpaid"
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
    .populate('user') 
    .populate('orderCreatedUserId')
    .populate('products.product', 'product_name price') // populate the 'product' field of the 'products' array with the specified fields
    .exec()
    .then(data => {
      res.status(200).json({ 'success': true, 'message': 'order fetched', 'orders': data });
    }).catch(err => {
      res.status(400).json({ 'success': false, 'message': err });
    })
}

exports.viewOrderByDateOrUser = (req, res) => {
  const { startDate, endDate, orderCreatedUserId} = req.body;

  const user = orderCreatedUserId;

  let query = {};
  if (startDate && endDate && user) {
    query = {
      orderDate: {
        $gte: new Date(startDate),
        $lt: new Date(endDate + 'T23:59:59.999Z')
      },
      orderCreatedUserId: user
    };
  } else if (startDate && endDate) {
    query = {
      orderDate: {
        $gte: new Date(startDate),
        $lt: new Date(endDate + 'T23:59:59.999Z')
      }
    };
  } else if (user) {
    query = { orderCreatedUserId: user };
  }

  Order.find(query)
    .populate('products.product')
    .populate('user')
    .populate('orderCreatedUserId')
    .sort({ orderDate: -1 })
    .then(data => {
      res.status(200).json({ 'success': true, 'message': 'orders fetched', 'orders': data });
    })
    .catch(err => {
      res.status(400).json({ 'success': false, 'message': err });
    })
}


// exports.donwloadInvoice = async (req, res) => {
//   var orderId = req.params.id;
//   var invoiceNumber = 0;
//   var routeName="";
//   const productsList = await Order.findById(orderId)
//     .populate({
//       path: 'products.product',
//       populate: {
//         path: 'product_category',
//         model: 'Category',
//       },
//     })
//     .populate("user")
//     .populate("orderCreatedUserId")
//     .then(order => {
//       invoiceNumber = order?.invoiceNumber;
//       const userId = order.orderCreatedUserId._id;

//       routeName=order.orderCreatedUserId.route_name;
//       const products = order.products.map(productObj => {
//         const product = productObj.product;
//         const description = product.product_name;
//         const priceForUser = product.prices?.find(price => {
//           return price.users.some(user => JSON.stringify(user) === JSON.stringify(userId)
//           );
//         });
//         const price = priceForUser.price;
//         const quantity = productObj.quantity;
//         const taxRate = 0;

//         return { quantity, description, "tax-rate": taxRate, price };
//       });
//       return products;
//     })
//     .catch(error => {
//       console.error(error);
//     });
//   const currentDate = new Date();
//   const formattedDate = currentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
//   const htmlFilePath = './white_invoice.html'; // Replace with the actual file path
//   const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');

// // Encode the HTML content to base64

//   var data = {
//      "customize": {
//         // btoa === base64 encode
//         "template": btoa(htmlContent) // Your template must be base64 encoded
//     },
//     "images": {
//       // The logo on top of your invoice
//       "logo": "https://starbakery.s3.ap-northeast-1.amazonaws.com/logo_whitebg.png",
//       // The invoice background
//     },
//     "marginBottom": 5,
//     "marginTop": 5,
//     // Your own data
//     "sender": {
//       "company": "Star Bakery",
//       "address": "Opp. Kuskal Patiya, Nr.Banas Oil Mill,Palanpur Deesa Highway,At,Badarpura,Ta.Planpur, Dist. Banaskantha",
//       "zip": "385001",
//       "city": "Ahemdabad",
//       "country": "India"
//     },
//     "client": {
//       "company": routeName
//   },
//     // Your recipient
//     "information": {
//       // Invoice number
//       "number": invoiceNumber,
//       // Invoice data
//       "date": formattedDate,
//     },
//     "products": productsList,
//     // The message you would like to display on the bottom of your invoice
//     "bottom-notice": "Kindly pay your invoice within 15 days.",
//     // Settings to customize your invoice
//     "settings": {
//       "currency": "INR",
//       "marginBottom": 5,
//       "marginTop": 5,
//     },
//   };

//   const pdfBufferObject = await easyinvoice.createInvoice(data);
//   const pdfBuffer = Buffer.from(pdfBufferObject.pdf, 'base64');
 
//   var orderPdfName = `order-${orderId}.pdf`
//   const uploadParams = {
//     Bucket: bucketName,
//     Key: orderPdfName,
//     Body: pdfBuffer,
//     ContentEncoding: "base64", // required
//     ContentType: 'application/pdf',
//   };
//   try {
//     const command=new PutObjectCommand(uploadParams)
//     const response = await s3.send(command);
//   } catch (error) {
//     console.error('Error uploading PDF:', error);
//   }
//      const filePath=await getPhoto(orderPdfName);
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="${filePath}"`);
//     res.status(200);
    
//     const getObjectParams = {
//       Bucket: bucketName,
//       Key: orderPdfName,
//     };

//     const getCommand = new GetObjectCommand(getObjectParams);
//     const response = await s3.send(getCommand);
//     response.Body.pipe(res);
// }




exports.donwloadInvoice = async (req, res) => {
  var orderId = req.params.id;
  var invoiceNumber = 0;
  var routeName="";
  var myOrder="";
  const productsList = await Order.findById(orderId)
    .populate({
      path: 'products.product',
      populate: {
        path: 'product_category',
        model: 'Category',
      },
    })
    .populate("user")
    .populate("orderCreatedUserId")
    .then(order => {
       myOrder=order;
      invoiceNumber = order?.invoiceNumber;
      const userId = order.orderCreatedUserId._id;

      routeName=order.orderCreatedUserId.route_name;
      const products = order.products.map(productObj => {
        const product = productObj.product;
        const description = product.product_name;
        const priceForUser = product.prices?.find(price => {
          return price.users.some(user => JSON.stringify(user) === JSON.stringify(userId)
          );
        });
        const price = priceForUser.price;
        const quantity = productObj.quantity;
        const taxRate = 0;

        return { quantity, description, "tax-rate": taxRate, price };
      });
      return products;
    })
    .catch(error => {
      console.error(error);
    });
  const currentDate = myOrder.orderDate;
  const formattedDate = currentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const htmlFilePath = './white_invoice.html'; // Replace with the actual file path
  const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');

// Encode the HTML content to base64

const dynamicData = {
  invoiceNumber: `Invoice :- ${invoiceNumber}`,
  routeName:`Route Name :- ${routeName}`,
  date:`Date :- ${formattedDate}`,
  products:JSON.stringify(productsList)
  // Add more dynamic data here
};

  // Render the EJS template with dynamic data
  const renderedHtml = ejs.render(htmlContent, dynamicData);
  const pdfBuffer = await generatePDF(renderedHtml);
  var orderPdfName = `order-${orderId}.pdf`


  const uploadParams = {
    Bucket: bucketName,
    Key: orderPdfName,
    Body: pdfBuffer,
    ContentEncoding: "base64", // required
    ContentType: 'application/pdf',
  };
  try {
    const command=new PutObjectCommand(uploadParams)
    const response = await s3.send(command);
  } catch (error) {
    console.error('Error uploading PDF:', error);
  }
     const filePath=await getPhoto(orderPdfName);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filePath}"`);
    res.status(200);
    res.send(pdfBuffer);

    
    const getObjectParams = {
      Bucket: bucketName,
      Key: orderPdfName,
    };

    const getCommand = new GetObjectCommand(getObjectParams);
    const response = await s3.send(getCommand);
    // response.Body.pipe(res);
}

async function generatePDF(htmlContent) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdfBuffer;
}




