
const firebaseConfig = require('../firebaseConfig');
const firebase = require('firebase')
require('firebase/firestore');
firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();
const haversine = require('haversine');


exports.itemInQueryString = async (req, res) => {
    const itemName = req.params.item;
    const promises = [];
  
    firebase.firestore()
      .collection('stores')
      .get()
      .then(snapshot => {
        snapshot.forEach(store => {
          const promise = firebase.firestore()
            .collection('stores')
            .doc(store.id)
            .collection('items')
            .where('name', '==', itemName)
            .get()
            .then(itemSnapshot => {
              const availability = itemSnapshot.docs.map(item => {
                return {
                  store_name: store.id,
                  stock: item.data().stock,
                  lat: store.data().lat,
                  long: store.data().long
                };
              });
              return availability;
            })
            .catch(error => {
              console.error(error);
              throw error;
            });
  
          promises.push(promise);
        });
  
        return Promise.all(promises);
      })
      .then(results => {
        const availability = results.flat();
        if (availability.length > 0) {
          res.send(availability);
        } else {
          res.status(204).send({ error: 'no items found' });
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).send({ error: 'Error getting item availability' });
      });
  };
  



    exports.haversineQueryStringForApp=(req, res) => {
    const itemName = req.params.item;
    const userLat = req.query.latitude;
    const userLong = req.query.longitude;
    // console.log(userLat, userLong);
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
                //   console.log(store.data());
  
                  const storeLat = store.data().lat;
                  const storeLong = store.data().long;
                  const price = item.data().price;
                  const distance = haversine(
                    { latitude: userLat, longitude: userLong },
                    { latitude: storeLat, longitude: storeLong }
                  );
                //   console.log(distance);
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
        // console.log('availability : ', availability);
        if (availability.length > 0) {
        //   console.log(availability);
          res.send(availability);
        } else {
          res.status(204).send({ error: 'no items found' });
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Error getting stores: ', error);
      })
    };

    

// define your route for fetching item suggestions

exports.suggestions = async (req, res) => {
  try {
    const query = req.params.item.toLowerCase();
    console.log(req);
    console.log(query);
    const snapshot = await firestore.collectionGroup('items').get();
    const items = snapshot.docs.map(doc => doc.data());
    const matchingItems = items.filter(item => item.name && item.name.toLowerCase().includes(query));
    console.log(matchingItems)
    const matchingItemNames = matchingItems.map(item => item.name);
    res.json(matchingItemNames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};



