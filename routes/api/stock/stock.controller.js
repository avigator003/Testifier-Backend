const Stock = require('../../../Models/stock')
const Order = require('../../../Models/order');
const StockEntry = require('../../../Models/stockEntry')
const { query } = require('express');

// exports.list = (req, res) => {
//     Stock.find().populate('product').then(data => {
//         res.status(200).json({ 'success': true, 'message': 'All stock fetched', data});
//     }).catch(err => {
//         res.status(400).json({ 'success': false, 'message': err });
//     })

// }

exports.list = async (req, res) => {
    try {
      var orderDate = req.body.orderDate; // Retrieve the targetDate query parameter
      var categoryId = req.body.categoryId; // Retrieve the categoryId query parameter
      let query ={};
      if(orderDate !==undefined)
      {
      query = {
        orderDate: {
          $gte: new Date(orderDate),
          $lt: new Date(orderDate+'T23:59:59.999Z')
        },
        status: { $ne: 'Completed' }
      };
    }
      // Fetch all stock entries along with associated product information
      var stockData = await Stock.find()
      .populate({
        path: 'product',
        populate: {
          path: 'product_category',
          model: 'Category', // Make sure this matches the actual model name
        },
      })
      .exec();

      if (categoryId) {
        stockData = stockData.filter(stock => stock.product.product_category._id.toString() === categoryId);
      }

      // Fetch orders for the specified date
      try {
        var orders = await Order.find(query)
          .populate('products.product')
          .populate('user')
          .populate('orderCreatedUserId')
          .sort({ orderDate: -1 })
          .exec(); // Use .exec() to execute the query and return a promise
       } catch (err) {
        res.status(400).json({ success: false, message: err });
      }      

      // Create a map to store total quantities for each product
      const productTotalQuantities = new Map();
  
      // Loop through orders and calculate total quantities
      for (const order of orders) {
        for (const product of order.products) {
          const productId = product.product._id.toString();
          const quantity = product.quantity;
          
          if (productTotalQuantities.has(productId)) {
            productTotalQuantities.set(productId, productTotalQuantities.get(productId) + quantity);
          } else {
            productTotalQuantities.set(productId, quantity);
          }
        }
      }
  
      // Combine stock and total quantity data
      const result = stockData.map(stockEntry => ({
        id:stockEntry._id,
        product: stockEntry.product,
        current_quantity: stockEntry.quantity,
        quantity_type:stockEntry.quantity_type,
        quantity_ordered_on_date: productTotalQuantities.get(stockEntry.product._id.toString()) || 0,
      }));
  
      res.status(200).json({ success: true, message: 'All stock fetched', data: result });
    } catch (error) {
      console.log('err', error);
      res.status(400).json({ success: false, message: error.message });
    }
  };
  

exports.deleteStock = (req, res) => {
    Stock.findByIdAndRemove(req.params.id).then(data => {
        res.status(200).json({ 'success': true, 'message': 'Stock removed' });
    }).catch(err => {
        res.status(400).json({ 'success': false, 'message': err });
    })

}

exports.updateStock = (req, res) => {
    var quantity=req.body.newQuantity;
    Stock.findByIdAndUpdate(
        req.params.id,
        {quantity:quantity},
        { new: true }
      )
        .then((data) => {
          res.status(200).json({ success: true, message: 'Stock Updated Successfully', data });
        })
        .catch((err) => {
          res.status(400).json({ success: false, message: err });
        });
}

exports.updateQuanityType = (req, res) => {
  var type = req.body.qunatityType; // Typo here, it should be 'quantityType'
  console.log("hgey",type)
  Stock.updateMany(
    { quantity_type: "KG" }, // Assuming 'quantity_type' is the field name in your collection
    { $set: { quantity_type: type } } // Replace 'newType' with the new value you want to set
  )
    .then((data) => {
      res.status(200).json({ success: true, message: 'Stock Updated Successfully', data });
    })
    .catch((err) => {
      res.status(400).json({ success: false, message: err });
    });
}


exports.updateCurrentQuantity = (req, res) => {
  Stock.updateMany(
    {}, // Assuming 'quantity_type' is the field name in your collection
    { $set: { quantity: 0 } } // Replace 'newType' with the new value you want to set
  )
    .then((data) => {
      res.status(200).json({ success: true, message: 'Stock Updated Successfully', data });
    })
    .catch((err) => {
      res.status(400).json({ success: false, message: err });
    });
}


exports.completeWork = async (req, res) => {
  const { date,productData } = req.body;
  try {

    const existingEntry = await StockEntry.findOne({ date: date });

    if (existingEntry) {
      return res.status(400).json({ error: 'Work for this date is already completed' });
    }

    // Loop through the productData array and update the stock for each product
    for (const data of productData) {
      const { productId, updatedQuantity } = data;

      // Find the stock entry for the given productId
      const stockEntry = await Stock.findOne({ product: productId });

      if (!stockEntry) {
        return res.status(404).json({ error: 'Stock entry not found for the given product' });
      }

      // Update the current_quantity directly with the updatedQuantity value
      stockEntry.quantity = updatedQuantity >= 0 ? updatedQuantity : 0;

      // Save the updated stock entry
      await stockEntry.save();
    }
    await StockEntry.create({ date: date });

    // Return a success response
    return res.status(200).json({ message: 'Work completed successfully' });
  } catch (error) {
    console.error('Error completing work:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


exports.createStock = async (req, res) => {
    try {
      // Check if a stock entry with the same product already exists
      const existingStock = await Stock.findOne({ product: req.body.product });
  
      if (existingStock) {
        return res.status(400).json({ success: false, message: 'Stock entry for this product already exists' });
      }
  
      // Create the stock entry
      const newStock = await Stock.create(req.body);
  
      res.status(200).json({ success: true, message: 'Stock Created', data: newStock });
    } catch (err) {
      res.status(400).json({ success: false, message: err });
    }
  };

exports.viewStock = (req, res) => {
    Stock.findById(req.params.id).populate('product').then(data => {
        res.status(200).json({ 'success': true, 'message': 'stock fetched','stock':data });
    }).catch(err => {
        res.status(400).json({ 'success': false, 'message': err });
    })
}

