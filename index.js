const express = require('express');
const app = express();
const firebase = require('firebase');
const bodyParser = require('body-parser');
const cors = require("cors");

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
  
    firebase.firestore().collection('stores').doc(store).get()
  .then(docSnapshot => {
    if (!docSnapshot.exists) {
      firebase.firestore().collection('stores').doc(store).set({});
    }
    firebase.firestore().collection('stores').doc(store).collection('items').doc(itemName).get()
      .then(itemSnapshot => {
        if (itemSnapshot.exists) {
          res.status(400).json({ error: 'Item already exists' });
        } else {
          firebase.firestore().collection('stores').doc(store).collection('items').doc(itemName).set({
            name: itemName,
            stock: stock
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
        res.status(404).send({ error: 'Item not found in store' });
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


app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});