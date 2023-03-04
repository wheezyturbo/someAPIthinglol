// const firebaseConfig = require('../firebaseConfig');
const firebase = require('firebase')
// firebase.initializeApp(firebaseConfig);
const express = require('express');
const app = express();
const cors = require("cors");
const path = require('path');

app.use(cors());


exports.addItemsToStoreGet = (req,res)=>{
  const filepath = path.join(__dirname,'../public/AddItems.html');
  res.sendFile(filepath);
}
exports.updateStockStoreGet = (req,res)=>{
  const filepath = path.join(__dirname,'../public/UpdateStock.html');
  res.sendFile(filepath);
}
exports.addNewStoreGet = (req,res)=>{
  const filepath = path.join(__dirname,'../public/AddStore.html');
  res.sendFile(filepath);
}

exports.addItemsToStore = (req, res) => {
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
};

exports.updateStockStore=(req, res) => {
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
  };

  exports.addNewStore = (req, res) => {
    const storeName = req.body.store;
    const lat = parseFloat(req.body.lat);
    const long = parseFloat(req.body.long);
    console.log(lat,typeof lat,long,typeof long);
    const password = req.body.password;
    firebase.firestore().collection('stores').doc(storeName).get()
      .then(doc => {
        if (doc.exists) {
          console.log(`Store already exists with store name: ${storeName}`);
          res.status(200).send({ "status": "store already exists", "store Name": `${storeName}` });
        } else {
          firebase.firestore().collection('stores').doc(storeName).set({
            lat: lat,
            long: long,
            password: password
          })
            .then(() => {
              console.log(`Store added with store name: ${storeName}`);
              res.status(200).send({ "status": "added", "store Name": `${storeName}` });
            })
            .catch(error => {
              console.error(error);
              res.status(500).send('Error adding store: ', error);
            });
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Error checking store: ', error);
      });
  }
  