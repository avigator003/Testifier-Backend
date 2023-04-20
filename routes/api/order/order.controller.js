const { Invoice } = require('react-simple-invoice');
const Order = require('../../../Models/order')
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
    // currentDate.setHours(23);
    // currentDate.setMinutes(59);
    // currentDate.setSeconds(59);
    // currentDate.setMilliseconds(999);
    const productPromises = products.products.map((p) =>
      Product.findById(p.product)
        .populate('product_category')
        .exec()
    );

    const productsData = await Promise.all(productPromises);

    let totalPrice = 0;

    // calculate the total price of all products
    for (let i = 0; i < products.products.length; i++) {
      const { quantity } = products.products[i];
      const priceForUser = productsData[i].prices.find((price) => {
        return price.users.some((user) => user.toString() === userId);
      });
      totalPrice += priceForUser.price * quantity;
    }

    const count = await Order.countDocuments();
    const invoiceNumber = count + 1;
    const order = new Order({ ...req.body, invoiceNumber, totalPrice, user: userId, orderDate: currentDate });
    await order.save();
    res.status(200).json({ success: true, message: 'Order Created', data: order });
  } catch (error) {
    console.log('err', error);
    res.status(400).json({ success: false, message: error.message });
  }
};


// Update Order
exports.updateOrder = (req, res) => {
  var orderData = req.body
  Order.findByIdAndUpdate(
    req.params.id,
    orderData,
    { new: true }
  )
    .then((data) => {
      res.status(200).json({ success: true, message: 'Order Updated', data });
    })
    .catch((err) => {
      res.status(400).json({ success: false, message: err });
    });
};

// Update Order Status
exports.updateOrderStatus = (req, res) => {
  const newStatus = req.body.status;
  const { payment, paymentStatus } = req.body;

  // Find the order by ID
  Order.findById(req.params.id)
    .then((order) => {
      if (!order) {
        throw new Error('Order not found');
      }
      // Calculate the remaining balance
      const remainingBalance = order.totalPrice - payment;

      if (remainingBalance < 0) {
        // Payment is more than total price
        throw new Error('Payment is more than the total price');
      }

      // Update the order with new status and payment information
      order.status = newStatus;
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'Paid') {
        order.duePayment = 0;
      } else {
        order.duePayment = remainingBalance;
      }
      const date= new Date();
      date.setHours(23);
      date.setMinutes(59);
      date.setSeconds(59);
      date.setMilliseconds(999);
      if (payment) {
        const paymentDate = new Date();
        order.paymentDate = paymentDate;
      }
      return order.save();
    })
    .then((data) => {
      res.status(200).json({ success: true, message: 'Order status updated', data });
    })
    .catch((err) => {
      res.status(400).json({ success: false, message: err.message });
    });
};


exports.updatePaymentStatus = (req, res) => {
  const { paymentStatus, payment } = req.body;

  // Find the order by ID
  Order.findById(req.params.id)
    .then((order) => {
      if (!order) {
        throw new Error('Order not found');
      }

      // Update the order with new payment status
      order.paymentStatus = paymentStatus;

      if (paymentStatus === 'Paid') {
        // If payment status is Paid, set due payment to 0
        order.duePayment = 0;
      } else if (paymentStatus === 'Partial Payment') {
        // If payment status is Partial Payment, calculate the remaining balance
        const remainingBalance = order.totalPrice - payment;

        if (remainingBalance < 0) {
          // Payment is more than total price
          throw new Error('Payment is more than the total price');
        }

        order.duePayment = remainingBalance;
      } else {
        // If payment status is Unpaid, set due payment to total price
        order.duePayment = order.totalPrice;
      }

      // Save the updated order
      return order.save();
    })
    .then((data) => {
      res.status(200).json({ success: true, message: 'Payment status updated', data });
    })
    .catch((err) => {
      res.status(400).json({ success: false, message: err.message });
    });
};



exports.viewOrder = (req, res) => {
  Order.findById(req.params.id).then(data => {
    res.status(200).json({ 'success': true, 'message': 'order fetched', 'orders': data });
  }).catch(err => {
    res.status(400).json({ 'success': false, 'message': err });
  })
}

exports.viewOrderByDateOrUser = (req, res) => {
  const { date, userId } = req.body;
  const user = userId;

  let query = {};
  if (date && user) {
    query = {
      orderDate: {
        $gte: new Date(date),
        $lt: new Date(date + 'T23:59:59.999Z')
      },
      user: user
    };
  } else if (date) {
    query = {
      orderDate: {
        $gte: new Date(date),
        $lt: new Date(date + 'T23:59:59.999Z')
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



