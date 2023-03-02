const express = require('express');
const app = express();
const firebase = require('firebase');
const bodyParser = require('body-parser');
const cors = require("cors");
const haversine = require('haversine');
const pdfkit = require('pdfkit')
const easyinvoice = require('easyinvoice');
const fs = require('fs')
const path = require('path')
app.set('view engine', 'ejs');

// Initialize Firebase
const config = {
    apiKey: "AIzaSyCxdFY1zn5nyXj2sXS0xkTum8iyXsAd4Ds",
    authDomain: "collegeproject001-76372.firebaseapp.com",
    projectId: "collegeproject001-76372",
    storageBucket: "collegeproject001-76372.appspot.com",
    messagingSenderId: "584262148519",
    appId: "1:584262148519:web:eea8992c867549f8471682",
    measurementId: "G-XBKPG6EDLE"
};

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

firebase.initializeApp(config);

// // Get the specified item's availability on each store
// app.get('/:item', (req, res) => {
//     const itemName = req.params.item;
//     var availability = {};
//     firebase.firestore().collection('stores').get()
//       .then(snapshot => {
//         snapshot.forEach(store => {
//             console.log(store.id);
//           firebase.firestore().collection('stores').doc(store.id).collection('items').where('name', '==', itemName).get()
//             .then(itemSnapshot => {
//               itemSnapshot.forEach(item => {
//                 console.log(item.data());
//                 availability[store.id] = item.data().stock;
//                 console.log(availability);
//               });
//             })
//             .catch(error => {
//               console.error(error);
//               res.status(500).send('Error getting item availability: ', error);
//             });
//         });
//         console.log("reached");
//         setTimeout(()=>{
//             console.log("availability : ",availability);
//             res.send(availability);
//         },500)
//       })
//       .catch(error => {
//         console.error(error);
//         res.status(500).send('Error getting stores: ', error);
//       });
//   });



//another represenation of the get request
app.get('/:item', (req, res) => {
    const itemName = req.params.item;
    var availability = [];
    let p1 = new Promise((resolve,reject)=>{
        firebase.firestore().collection('stores').get()
        .then(snapshot => {
            snapshot.forEach(store => {
                console.log(store.id);
                firebase.firestore().collection('stores').doc(store.id).collection('items').where('name', '==', itemName).get()
                    .then(itemSnapshot => {
                        itemSnapshot.forEach(item => {
                            console.log(item.data());
                            availability.push({ "store_name": store.id, "stock": item.data().stock,"lat":store.data().lat,"long":store.data().long });
                            console.log(availability);
                        });
                    })
                    .catch(error => {
                        console.error(error);
                        res.status(500).send('Error getting item availability: ', error);
                    });
            });
            console.log("reached");
            setTimeout(() => {
                console.log("availability : ", availability);
                resolve(true);
            }, 500)
        })
        .catch(error => {
            reject(true);
            console.error(error);
            res.status(500).send('Error getting stores: ', error);
        });  
    })
    p1.then(()=>{
        console.log(availability.length)
        if(availability.length!=0){
        res.send(availability)
        }
        else{
            setTimeout(()=>{
                if(availability.length==0){
                res.status(204).send({error:"no items found"})
                }
                else{
                    res.send(availability);
                }
            },1000)
        }
    })
});


//const haversine = require('haversine');

app.get('/api/fetch-item/:item', (req, res) => {
  const itemName = req.params.item;
  const userLat = req.query.latitude;
  const userLong = req.query.longitude;
  console.log(userLat, userLong);
  const maxDistance = 3; // km
  const availability = [];

  firebase
    .firestore()
    .collection('stores')
    .get()
    .then(snapshot => {
      const promises = [];
      snapshot.forEach(store => {
        const promise = firebase
          .firestore()
          .collection('stores')
          .doc(store.id)
          .collection('items')
          .where('name', '==', itemName)
          .get()
          .then(itemSnapshot => {
            itemSnapshot.forEach(item => {
              const stock = item.data().stock;
              if (stock > 0) {
                console.log(store.data());

                const storeLat = store.data().lat;
                const storeLong = store.data().long;
                const price = item.data().price;
                const distance = haversine(
                  { latitude: userLat, longitude: userLong },
                  { latitude: storeLat, longitude: storeLong }
                );
                console.log(distance);
                if (distance <= maxDistance) {
                  availability.push({
                    store_name: store.id,
                    stock,
                    lat: storeLat,
                    long: storeLong,
                    price: price
                  });
                }
              }
            });
          })
          .catch(error => {
            console.error(error);
            res
              .status(500)
              .send('Error getting item availability: ', error);
          });
        promises.push(promise);
      });
      return Promise.all(promises);
    })
    .then(() => {
      console.log('availability : ', availability);
      if (availability.length > 0) {
        console.log(availability);
        res.send(availability);
      } else {
        res.status(204).send({ error: 'no items found' });
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error getting stores: ', error);
    });
});








// //post request to add items to the store also updates item if already exists
// app.post('/add', (req, res) => {
//     const store = req.body.store;
//     const itemName = req.body.item;
//     const stock = req.body.stock;
  
//     firebase.firestore().collection('stores').doc(store).get()
//   .then(docSnapshot => {
//     if (!docSnapshot.exists) {
//       firebase.firestore().collection('stores').doc(store).set({});
//     }
//     firebase.firestore().collection('stores').doc(store).collection('items').doc(itemName).set({
//       name: itemName,
//       stock: stock
//     })
//     .then(() => {
//       res.json({ message: 'Item added successfully' });
//     })
//     .catch(error => {
//       console.error(error);
//       res.status(500).send('Error adding item: ', error);
//     });
//   });
//   });



//post request to add items to the store
app.post('/add', (req, res) => {
    const store = req.body.store;
    const itemName = req.body.item;
    const stock = req.body.stock;
    const price = req.body.price;
  
    firebase.firestore().collection('stores').doc(store).get()
  .then(docSnapshot => {
    if (!docSnapshot.exists) {
      // firebase.firestore().collection('stores').doc(store).set({});
      res.status(400).json({ error: 'Store does not exist' })
    }
    firebase.firestore().collection('stores').doc(store).collection('items').doc(itemName).get()
      .then(itemSnapshot => {
        if (itemSnapshot.exists) {
          res.status(400).json({ error: 'Item already exists' });
        } else {
          firebase.firestore().collection('stores').doc(store).collection('items').doc(itemName).set({
            name: itemName,
            stock: stock,
            price:price,
          })
          .then(() => {
            res.json({ message: 'Item added successfully' });
          })
          .catch(error => {
            console.error(error);
            res.status(500).send('Error adding item: ', error);
          });
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Error checking if item exists: ', error);
      });
  });
});






//not adding items to existing stores
// app.post('/add', (req, res) => {
//   const store = req.body.store;
//   const itemName = req.body.item;
//   const stock = req.body.stock;

//   firebase.firestore().collection('stores').doc(store).get()
//     .then(docSnapshot => {
//       if (!docSnapshot.exists) {
//         return res.status(400).json({ error: 'Store not found' });
//       }
//       firebase.firestore().collection('stores').doc(store).collection('items').doc(itemName).get()
//         .then(itemSnapshot => {
//           if (itemSnapshot.exists) {
//             res.status(400).json({ error: 'Item already exists' });
//           } else {
//             firebase.firestore().collection('stores').doc(store).collection('items').doc(itemName).set({
//               name: itemName,
//               stock: parseInt(stock)
//             })
//               .then(() => {
//                 res.json({ message: 'Item added successfully' });
//               })
//               .catch(error => {
//                 console.error(error);
//                 res.status(500).send('Error adding item: ', error);
//               });
//           }
//         })
//         .catch(error => {
//           console.error(error);
//           res.status(500).send('Error checking if item exists: ', error);
//         });
//     })
//     .catch(error => {
//       console.error(error);
//       res.status(500).send('Error checking if store exists: ', error);
//     });
// });






  // //update the stock 
  // app.post('/update-stock', (req, res) => {
  //   const store = req.body.store;
  //   const itemName = req.body.item;
  //   const newStock = req.body.stock;
  
  //   firebase.firestore().collection('stores').doc(store).collection('items').where('name', '==', itemName).get()
  //   .then(querySnapshot => {
  //     if (querySnapshot.empty) {
  //       res.status(404).send({ error: 'Item not found in store' });
  //     } else {
  //       querySnapshot.forEach(doc => {
  //         firebase.firestore().collection('stores').doc(store).collection('items').doc(doc.id).update({
  //           stock: newStock,
  //         })
  //         .then(() => {
  //           res.json({ message: 'Item stock updated successfully' });
  //         })
  //         .catch(error => {
  //           console.error(error);
  //           res.status(500).send({ error: 'Error updating item stock: ', error });
  //         });
  //       });
  //     }
  //   })
  //   .catch(error => {
  //     console.error(error);
  //     res.status(500).send({ error: 'Error fetching item: ', error });
  //   });
  // });




//update the stock
app.patch('/update-stock', (req, res) => {
  const store = req.body.store;
  const itemName = req.body.item;
  const newStock = req.body.stock;
  firebase.firestore().collection('stores').doc(store).collection('items').where('name', '==', itemName).get()
    .then(querySnapshot => {
      if (querySnapshot.empty) {
        res.status(200).send({"status":"Item not found in store","store Name":`${store}`});
      } else {
        querySnapshot.forEach(doc => {
          firebase.firestore().collection('stores').doc(store).collection('items').doc(doc.id).update({
            stock: newStock,
          })
            .then(() => {
              res.json({ message: 'Item stock updated successfully' });
            })
            .catch(error => {
              console.error(error);
              res.status(500).send({ error: 'Error updating item stock: ', error });
            });
        });
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send({ error: 'Error fetching item: ', error });
    });
});







// //add stores
// app.post('/add-store', (req, res) => {
//     const storeName = req.body.name;
//     const lat = req.body.lat;
//     const long = req.body.long;
  
//     firebase.firestore().collection('stores').doc(storeName).set({
//       lat: lat,
//       long: long
//     })
//       .then(() => {
//         console.log(`Store added with store name: ${storeName}`);
//         res.status(200).send({"status":"added","store Name":`${storeName}`});
//       })
//       .catch(error => {
//         console.error(error);
//         res.status(500).send('Error adding store: ', error);
//       });
//   });


//add store that checks if the store is already present
app.post('/add-store', (req, res) => {
    const storeName = req.body.name;
    const lat = req.body.lat;
    const long = req.body.long;
    firebase.firestore().collection('stores').doc(storeName).get()
    .then(doc => {
      if (!doc.exists) {
        firebase.firestore().collection('stores').doc(storeName).set({
          lat: lat,
          long: long
        })
          .then(() => {
            console.log(`Store added with store name: ${storeName}`);
            res.status(200).send({"status":"added","store Name":`${storeName}`});
          })
          .catch(error => {
            console.error(error);
            res.status(500).send('Error adding store: ', error);
          });
      } else {
        console.log(`Store already exists with store name: ${storeName}`);
        res.status(200).send({"status":"store already exists","store Name":`${storeName}`});
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error checking store: ', error);
    });
})





// //billing
// app.post('/bill-item', async (req, res) => {
//   try {
//     const store = req.body.store;
//     const itemName = req.body.item;
//     const quantity = req.body.quantity;
//     const pricePerUnit = req.body.pricePerUnit;
    
//     // Fetch the item from the store
//     const itemSnapshot = await firebase.firestore().collection('stores').doc(store).collection('items').where('name', '==', itemName).get();
//     if (itemSnapshot.empty) {
//       return res.status(404).send({"status": "Item not found in store", "store Name": `${store}`});
//     }
    
//     // Calculate the total price and update the stock
//     let totalPrice = 0;
//     itemSnapshot.forEach(async doc => {
//       const item = doc.data();
//       const updatedStock = item.stock - quantity;
//       if (updatedStock < 0) {
//         return res.status(400).send({"status": "Insufficient stock"});
//       }
//       await firebase.firestore().collection('stores').doc(store).collection('items').doc(doc.id).update({
//         stock: updatedStock,
//       });
//       totalPrice += quantity * pricePerUnit;
//     });
    
//     // Send the billing details
//     res.json({ message: 'Item billed successfully', totalPrice: totalPrice });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ error: 'Error billing item: ', error });
//   }
// });


app.get('/store/:storeName', async (req, res) => {
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
      console.log(item);
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
});




app.post('/billing/bill-item', (req, res) => {
  const store = req.body.store;
  const itemName = req.body.itemName;
  const quantity = req.body.quantity;
  const pricePerUnit = req.body.pricePerUnit;
  const timestamp = new Date().toISOString();
  console.log(req.body);

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
                    console.log('done');
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
});



// app.post('/bill-items', async (req, res) => {
//   try {
//     const items = req.body.items; // an array of items with their details
//     const totalBill = 0;

//     // Use a batched write to perform the stock updates and calculate the total price
//     const batch = firebase.firestore().batch();
//     items.forEach((item) => {
//       const storeName = item.storeName;
//       const itemName = item.itemName;
//       const quantity = item.quantity;
//       const pricePerUnit = item.pricePerUnit;

//       const storeRef = firebase.firestore().collection('stores').doc(storeName);
//       const itemRef = storeRef.collection('items').doc(itemName);

//       const itemDoc = itemRef.get();
//       const itemData = itemDoc.data();
//       if (!itemDoc.exists || itemData.stock < quantity) {
//         throw new Error('Item not found or insufficient stock');
//       }
//       const updatedStock = itemData.stock - quantity;
//       const totalPrice = quantity * pricePerUnit;
//       batch.update(itemRef, { stock: updatedStock });
//       totalBill += totalPrice;
//     });

//     await batch.commit();

//     // Send the billing details
//     res.json({ message: 'Items billed successfully', totalBill });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ error: 'Error billing items: ', error });
//   }
// });

app.get('/billing/app', (req, res) => {
  res.sendFile(__dirname + '/public/billing.html');
});













app.get('/api/get/items', async (req, res) => {
  try {
    const snapshot = await db.collection('stores')
      .doc(req.query.store_name)
      .collection('items')
      .get();
    const items = snapshot.docs.map(doc => doc.data());
    res.json(items);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post('/api/get/items', async (req, res) => {
  try {
    await db.collection('stores')
      .doc(req.body.store_name)
      .collection('items')
      .doc(req.body.item_name)
      .set(req.body);
    res.json({ message: 'Item created successfully.' });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.put('/items/:store_name/:item_name', async (req, res) => {
  try {
    await db.collection('stores')
      .doc(req.params.store_name)
      .collection('items')
      .doc(req.params.item_name)
      .update(req.body);
    res.json({ message: 'Item updated successfully.' });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.delete('/items/:store_name/:item_name', async (req, res) => {
  try {
    await db.collection('stores')
      .doc(req.params.store_name)
      .collection('items')
      .doc(req.params.item_name)
      .delete();
    res.json({ message: 'Item deleted successfully.' });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Billing feature endpoint
app.post('/invoice', async (req, res) => {
  try {
    const storeDoc = await db.collection('stores')
      .doc(req.body.store_name)
      .get();
    const storeData = storeDoc.data();
    const items = req.body.items;

    // Calculate total amount
    let total = 0;
    for (const item of items) {
      const itemDoc = await db.collection('stores')
        .doc(req.body.store_name)
        .collection('items')
        .doc(item.name)
        .get();
      const itemData = itemDoc.data();
      total += item.quantity * itemData.price;
    }

    // Generate PDF invoice using pdfkit
    const doc = new pdfkit();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${req.body.customer_name}.pdf`);
    doc.pipe(res);
    doc.fontSize(18).text(`Invoice for ${req.body.customer_name}`);
    doc.fontSize(14).text(`Store: ${storeData.store_name}`);
    doc.fontSize(12).text('Items:');
    for (const item of items) {
      doc.fontSize(10).text(`${item.name}: ${item.quantity} x ${itemData.price} = ${item.quantity * itemData.price}`);
    }
    doc.fontSize(12).text(`Total: ${total}`);
    doc.end();
  } catch (error) {
    res.status(500).send(error);
  }
});



app.post("/billing/invoice", async (req, res) => {
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
});





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



app.get('/stores/login', function(req, res) {
  res.render('login', { title: 'My App',errorMessage:'' });
});


app.post('/stores/login', async (req, res) => {
  const storeName = req.body.storeName;
  const password = req.body.password;
  console.log("storeName =", storeName)
  // Retrieve the store from Firestore based on the store name
  const storeRef = firebase.firestore().collection('stores').doc(storeName);
  const storeDoc = await storeRef.get();
  console.log(storeDoc.data)

  // Check if the store exists and if the password is correct
  if (storeDoc.exists && storeDoc.data().password === password) {
    // Render the main page and pass the store name as a local variable
    res.render('billing', { title: storeName });
  } else {
    // Render the login page with an error message
    res.render('login', { errorMessage: 'Invalid store name or password' });
  }
});






app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});




// this is my firestore database :
// stores ->collection ,store_name document with fields lat,long and password -> items collection -> item_name document -> item_name,stock and price fields