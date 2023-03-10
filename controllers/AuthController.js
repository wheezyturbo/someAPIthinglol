const firebase = require('firebase');
const session = require('express-session');
const path = require('path');


exports.loginGet  = (req, res)=> {
    const filepath = path.join(__dirname,'../public/login.html');
    res.sendFile(filepath);
  }

  exports.loginPost = async (req, res) => {
    const storeName = req.body.storeName;
    const password = req.body.password;
    // console.log("storeName =", storeName)
    // Retrieve the store from Firestore based on the store name
    const storeRef = firebase.firestore().collection('stores').doc(storeName);
    const storeDoc = await storeRef.get();
    console.log(storeDoc.exists);
    
    // Check if the store exists and if the password is correct
    if (storeDoc.exists && storeDoc.data().password === password) {
      // Store the store name in a cookie
      res.cookie('storeName', storeName);
      // Redirect to the billing page
      res.redirect('/billing/app');
    } else {
      // Render the login page with an error message
      res.redirect('/stores/login');
    }
  }

  exports.logout = (req, res) => {
    // Clear the storeName cookie
    res.clearCookie('storeName');
    // Redirect to the login page
    res.redirect('/stores/login');
  };