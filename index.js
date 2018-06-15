const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017';
const dbName = 'mydb';
const collectionName = 'user';

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.set('views', './views');
app.set('view engine', 'pug');

// MongoDB access using callback
app.get('/regist', function(req, res) {
    res.render('regist', {action: req.path});
});
app.post('/regist', function(req, res) {
    const name = req.body.name;
    const mail = req.body.mail;

    MongoClient.connect(url, function(err, client) {
        if (err) {
            console.log(err);
            res.status(500).send();
            return;
        }
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        collection.findOne({mail: mail}, function(err, result) {
            if (err) {
                console.log(err);
                res.status(500).send();
                client.close();
                return;
            }
            if (result) {
                res.render('regist', {action: req.path, message: 'already registered'});
                client.close();
            } else {
                collection.insertOne({name: name, mail: mail}, function(err, result) {
                    if (err) {
                        console.log(err);
                        res.status(500).send();
                        client.close();
                        return;
                    }
                    res.render('regist', {action: req.path, message: 'registration is success'});
                    client.close();
                });
            }
        });
    });
});

// MongoDB access using Promise
app.get('/regist-promise', function(req, res) {
    res.render('regist', {action: req.path});
});
app.post('/regist-promise', function(req, res) {
    const name = req.body.name;
    const mail = req.body.mail;

    let client;
    let collection;
    MongoClient.connect(url)
    .then(function(client_) {
        client = client_;
        const db = client.db(dbName);
        collection = db.collection(collectionName);
        return collection.findOne({mail: mail});
    })
    .then(function(result) {
        if (result) {
            res.render('regist', {action: req.path, message: 'already registered'});
        } else {
            collection.insertOne({name: name, mail: mail})
            .then(function(result) {
                res.render('regist', {action: req.path, message: 'registration is success'});
            })
            .catch(function(err) {
                console.log(err);
                res.status(500).send();
                if (client) client.close();
            });
        }
    })
    .then(function() {
        if (client) client.close();
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send();
        if (client) client.close();
    });
});

// MongoDB access using await
app.get('/regist-await', function(req, res) {
    res.render('regist', {action: req.path});
});
app.post('/regist-await', async function(req, res) {
    const name = req.body.name;
    const mail = req.body.mail;

    let client;
    try {
        client = await MongoClient.connect(url);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const user = await collection.findOne({mail: mail});
        if (user) {
            res.render('regist', {action: req.path, message: 'already registered'});
        } else {
            await collection.insertOne({name: name, mail: mail});
            res.render('regist', {action: req.path, message: 'registration is success'});
        }
    } catch (err) {
        console.log(err);
        res.status(500).send();
    } finally {
        if (client) client.close();
    }
});

app.listen(3000, function() {
    console.log('server started');
});
