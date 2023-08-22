const mongoose = require('mongoose')
const Schema = mongoose.Schema
const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
};
const StockEntry = new Schema({
    date: Date
}, schemaOptions)

module.exports = mongoose.model('StockEntry', StockEntry)