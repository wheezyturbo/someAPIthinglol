const easyinvoice = require('easyinvoice');
const firebase = require('firebase');
const path = require('path');

exports.getStoreStock = async (req, res) => {
    try {
      const storeName = req.params.storeName;
  
      // Fetch the store details from Firestore
      const storeSnapshot = await firebase.firestore().collection('stores').doc(storeName).get();
      if (!storeSnapshot.exists) {
        return res.status(404).send({"status": "Store not found", "store Name": `${storeName}`});
      }
      const storeData = storeSnapshot.data();
  
      // Fetch the items for the store from Firestore
      const itemsSnapshot = await firebase.firestore().collection('stores').doc(storeName).collection('items').get();
      const items = [];
      itemsSnapshot.forEach(doc => {
        const item = doc.data();
        item.id = doc.id;
        items.push(item);
        // console.log(item);
      });
  
      // Send the store details to the client
      res.json({
        // storeName: storeName,
        // latitude: storeData.latitude,
        // longitude: storeData.longitude,
        items: items,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'Error fetching store details: ', error });
    }
  }


  exports.billingApp = (req, res) => {
    const filepath = path.join(__dirname,'../public/billing.html');
    res.sendFile(filepath);
  };

  exports.billingInvoice = async (req, res) => {
    try {
      // Extract store name and products from request body
      const store = req.body.store;
      const products = req.body.items;
  
      // Generate invoice date
      const invoiceDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
  
      // Generate invoice number
      const invoiceNumber = generateInvoiceNumber();
  
      // Generate invoice data object

      const data = {
        documentTitle: "Invoice", 
        locale: "en-US",
        currency: "INR",
        marginTop: 25,
        marginRight: 25,
        marginLeft: 25,
        marginBottom: 25,
        sender: {
          company: store,
        },
        "images":{
            "logo":"https://w7.pngwing.com/pngs/151/227/png-transparent-black-logo-illustration-minimalism-tattoo-geometry-logo-free-buckle-triangle-element-angle-free-logo-design-template-triangle.png",
        },
        client: {},
        "information": {
          "number": invoiceNumber,
          "date": invoiceDate,
          "due-date":"none",
        },
        products: products.map((product) => ({
          "quantity": product.quantity,
          "description": product.name,
          "tax-rate":0,
          "price": parseFloat(product.price),
        })),
        // Remove VAT from the invoice
        taxes: [],
        // Remove due date from the invoice
        paymentTerms: "",
        bottomNotice: `Thank you for shopping at ${store}.`,
        "settings":{
          "currency": "INR",
          "tax-notation": "gst",
        }
      };
  
      // Generate PDF invoice using easyinvoice
      const result = await easyinvoice.createInvoice(data);
      const pdfContent = new Buffer.from(result.pdf, 'base64');
      // Set response headers
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice_${invoiceNumber}.pdf`,
        "Content-Length": result.pdf.length,
      });
  
      // Send PDF file to client
      res.send(pdfContent);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  };
  exports.itemsOfStore = async (req, res) => {
    try {
      const storeName = req.params.storeName;
  
      // Fetch the store details from Firestore
      const storeSnapshot = await firebase.firestore().collection('stores').doc(storeName).get();
      if (!storeSnapshot.exists) {
        return res.status(404).send({"status": "Store not found", "store Name": `${storeName}`});
      }
      const storeData = storeSnapshot.data();
  
      // Fetch the items for the store from Firestore
      const itemsSnapshot = await firebase.firestore().collection('stores').doc(storeName).collection('items').get();
      const items = [];
      itemsSnapshot.forEach(doc => {
        const item = doc.data();
        item.id = doc.id;
        items.push(item);
        // console.log(item);
      });
  
      // Send the store details to the client
      res.json({
        // storeName: storeName,
        // latitude: storeData.latitude,
        // longitude: storeData.longitude,
        items: items,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'Error fetching store details: ', error });
    }
  };


  exports.billItem = (req, res) => {
    const store = req.body.store;
    const itemName = req.body.itemName;
    const quantity = req.body.quantity;
    const pricePerUnit = req.body.pricePerUnit;
    const timestamp = new Date().toISOString();
    // console.log(req.body);
  
    // calculate the total cost of the item(s)
    const totalCost = quantity * pricePerUnit;
  
    // update the stock of the item(s)
    firebase.firestore().collection('stores').doc(store).collection('items').where('name', '==', itemName).get()
      .then(querySnapshot => {
        if (querySnapshot.empty) {
          res.status(404).send({"error":"Item not found in store","store Name":`${store}`});
        } else {
          querySnapshot.forEach(doc => {
            const currentStock = doc.data().stock;
            if (currentStock < quantity) {
              res.status(400).send({"error":"Not enough stock available"});
            } else {
              const newStock = currentStock - quantity;
              firebase.firestore().collection('stores').doc(store).collection('items').doc(doc.id).update({
                stock: newStock,
              })
                .then(() => {
                  // add the billing details to the database
                  firebase.firestore().collection('stores').doc(store).collection('billing').add({
                    item: itemName,
                    quantity: quantity,
                    pricePerUnit: pricePerUnit,
                    totalCost: totalCost,
                    timestamp: timestamp,
                  })
                    .then(() => {
                    //   console.log('done');
                      res.json({ message: 'Item billed successfully' });
                    })
                    .catch(error => {
                      console.error(error);
                      res.status(500).send({ error: 'Error adding billing details: ', error });
                    });
                })
                .catch(error => {
                  console.error(error);
                  res.status(500).send({ error: 'Error updating item stock: ', error });
                });
            }
          });
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).send({ error: 'Error fetching item: ', error });
      });
  };


  function generateInvoiceNumber() {
    const currentDate = new Date();
    const year = currentDate.getFullYear().toString();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const hour = currentDate.getHours().toString().padStart(2, '0');
    const minute = currentDate.getMinutes().toString().padStart(2, '0');
    const second = currentDate.getSeconds().toString().padStart(2, '0');
    const millisecond = currentDate.getMilliseconds().toString().padStart(3, '0');
    return `${year}${month}${day}${hour}${minute}${second}${millisecond}`;
  }

  
function generateInvoiceNumber() {
    const currentDate = new Date();
    const year = currentDate.getFullYear().toString();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const hour = currentDate.getHours().toString().padStart(2, '0');
    const minute = currentDate.getMinutes().toString().padStart(2, '0');
    const second = currentDate.getSeconds().toString().padStart(2, '0');
    const millisecond = currentDate.getMilliseconds().toString().padStart(3, '0');
    return `${year}${month}${day}${hour}${minute}${second}${millisecond}`;
  }
  