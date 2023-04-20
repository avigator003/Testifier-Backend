const { Invoice } = require('react-simple-invoice');
const Order = require('../../../Models/order')
const easyinvoice = require('easyinvoice');
const fs = require('fs')

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


// Create New Order
exports.createOrder = async (req, res) => {
  try {
    var orderData = req.body
    const count = await Order.countDocuments();
    const invoiceNumber = count + 1;
    const order = new Order({ ...orderData, invoiceNumber });
    await order.save();
    res.status(200).json({ success: true, message: 'Order Created', data: order });
  } catch (error) {
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
  Order.findByIdAndUpdate(
    req.params.id,
    { status: newStatus },
    { new: true }
  )
    .then((data) => {
      res.status(200).json({ success: true, message: 'Order status updated', data });
    })
    .catch((err) => {
      res.status(400).json({ success: false, message: err });
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
  const { date, user } = req.body;
  console.log("Date",date,user)

  let query = {};
  if (date && user) {
    query = {
      created_at: {
        $gte: new Date(date),
        $lt: new Date(date + 'T23:59:59.999Z')
      },
      user: user
    };
  } else if (date) {
    query = {
      created_at: {
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
  var invoiceNumber=0;
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
     invoiceNumber=order?.invoiceNumber;
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



