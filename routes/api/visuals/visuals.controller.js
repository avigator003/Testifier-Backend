const order = require("../../../Models/order");

const daysInMonth = {
    January: 31,
    February: 28, // Default days for February, will adjust dynamically
    March: 31,
    April: 30,
    May: 31,
    June: 30,
    July: 31,
    August: 31,
    September: 30,
    October: 31,
    November: 30,
    December: 31,
  };

exports.graphsDay = async (req, res )=> {
    try{
        const month = parseInt(req.body.value);
        const year = parseInt(req.body.value2);
        console.log(month);
        console.log(year);
        const currentYear = year;
        const startOfMonth = new Date(currentYear, month - 1, 1); // Start of the month (month is 1-based)
        const endOfMonth = new Date(currentYear, month, 1);
        console.log('startOfMonth',startOfMonth, endOfMonth);

        const entries = await order.find({
            created_at: {
              $gte: startOfMonth, // Greater than or equal to the start of the month
              $lt: endOfMonth // Less than the start of the next month
            }
          });
        //  console.log('startOfMonth',entries);
          const dailySums = {};
          entries.forEach(entry => {
            const day = entry.created_at.getDate(); // Get the day of the month (1-31)
            const value = entry.totalPrice; // Get the value of the field (e.g., `amount`)
      
            // If the day doesn't exist in the object, initialize it to 0
            if (!dailySums[day]) {
              dailySums[day] = 0;
            }
      
            // Add the current entry's value to the corresponding day's sum
            dailySums[day] += value;
          });
      
          // Return the daily sums object
            return res.status(200).json({ success: true, data: dailySums });
    }catch(e){
        console.log(e);
        return res.status(400).json({ success: false, message: e });
    }
}

exports.graphsMonth = async (req, res) => {
    try {
      const year = parseInt(req.body.value); // The year passed in the request body
      const nextYear = year + 1;
      console.log('Year:', year);
      console.log('nextYear:', nextYear);

      // Set the start and end of the given year (including full time range for start and end of the year)
      const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)); // Start of the year in UTC
      const endOfYear = new Date(Date.UTC(nextYear, 0, 1, 0, 0, 0, 0)); 
  
      console.log('Start of Year:', startOfYear);
      console.log('End of Year:', endOfYear);
  
      // Query for entries created in the given year
      const entries = await order.find({
        created_at: {
          $gte: startOfYear, // Greater than or equal to the start of the year
          $lt: endOfYear // Less than the start of the next year
        }
      });
  
    //   console.log('Entries for the year:', entries);
  
      // Initialize an object to store the monthly sums (start with 0 for each month)
      const monthlySums = {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
        7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0
      };
  
      if (entries.length === 0) {
        // If no entries exist for the given year, return a message indicating no data
        return res.status(200).json({ success: true, data: monthlySums });
      }
  
      // Iterate over the entries and sum by month
      entries.forEach(entry => {
        const month = entry.created_at.getMonth() + 1; // Get the month (1-based: 1 = January, 12 = December)
        const value = entry.totalPrice; // Get the value of the field (e.g., `totalAmount`)
  
        // Add the current entry's value to the corresponding month's sum
        monthlySums[month] += value;
      });
  
      // Return the monthly sums object as a response
      return res.status(200).json({ success: true, data: monthlySums });
    } catch (e) {
      console.log(e);
      return res.status(400).json({ success: false, message: e });
    }
  };
  
exports.graphsYear = async (req, res)=> {
    try {
        const currentYear = new Date().getFullYear(); // Get the current year
    
        // Calculate the start of the 5th year ago (current year - 5)
        const startYear = currentYear - 4;
    
        // Initialize an object to store the total sum for each year
        const yearlySums = {};
    
        // Loop through the last 5 years (from current year - 5 to current year)
        for (let year = startYear; year <= currentYear; year++) {
          const startOfYear = new Date(year, 0, 1); // Start of the year (January 1st)
          const endOfYear = new Date(year + 1, 0, 1); // Start of the next year (January 1st)
    
          // Query for entries created within the given year
          const entries = await order.find({
            created_at: {
              $gte: startOfYear, // Greater than or equal to the start of the year
              $lt: endOfYear // Less than the start of the next year
            }
          });
    
          // Calculate the sum for the current year
          let yearlySum = 0;
          entries.forEach(entry => {
            yearlySum += entry.totalPrice; // Sum up the totalAmount for the year
          });
    
          // Store the yearly sum in the object
          yearlySums[year] = yearlySum;
        }
    
        // Return the yearly sums object as a response
        return res.status(200).json({ success: true, data: yearlySums });
      } catch (e) {
        console.log(e);
        return res.status(400).json({ success: false, message: e });
      }
}