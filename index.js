// const firebaseConfig = require('./firebaseConfig');
// const firebase = require('firebase');
// const haversine = require('haversine');
// const pdfkit = require('pdfkit');
// const easyinvoice = require('easyinvoice');
// const fs = require('fs');
// const path = require('path');
// const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require("cors");
const session = require('express-session');



app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your secret key',
    resave: false,
    saveUninitialized: true
  }));

// firebase.initializeApp(firebaseConfig);

//controllers
const itemsController = require('./controllers/ItemsController');
const storesController = require('./controllers/StoresController');
const billsController = require('./controllers/BillsController');
const authcontroller = require('./controllers/AuthController');



app.get('/:item', itemsController.itemInQueryString);
app.get('/api/fetch-item/:item', itemsController.haversineQueryStringForApp);
app.get('/api/autocomplete/:item',itemsController.suggestions);



app.get('/stores/additems',storesController.addItemsToStoreGet);
app.get('/stores/update-stock',storesController.updateStockStoreGet);
app.get('/stores/add-store',storesController.addNewStoreGet);

app.post('/add', storesController.addItemsToStore);
app.patch('/update-stock', storesController.updateStockStore);
app.post('/add-store', storesController.addNewStore);


app.get('/store/:storeName',billsController.getStoreStock);
app.post('/billing/bill-item',billsController.billItem);
app.get('/billing/app',billsController.billingApp);
app.post('/billing/invoice',billsController.billingInvoice);

app.get('/stores/login',authcontroller.loginGet);
app.post('/stores/login',authcontroller.loginPost);
app.post('/stores/logout',authcontroller.logout);


app.get('/admin/login',authcontroller.adminloginGet);
app.post('/admin/login',authcontroller.adminloginPost);
app.get('/stores/remove-store',storesController.removestoreGet);
app.post('/stores/remove-store',storesController.removestorePost);
app.get('/stores/getstores',storesController.getStorenames);


app.get('/',storesController.showhome)




app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});