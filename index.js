const express = require("express");
const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const { ObjectID } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.znbod.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload());
const admin = require("firebase-admin");

const port = 5000;

const serviceAccount = require(`${__dirname}/private.json`);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://creative-agency-dd81b.firebaseio.com",
});

app.get("/", (req, res) => {
  admin
    .auth()
    .verifyIdToken(req.headers.token)
    .then((result) => {
      res.send(result);
    });
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const servicesCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("services");

  const ordersCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("orders");

  const reviewsCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("reviews");

  const adminsCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("admins");

  app.post("/add-service", (req, res) => {
    const file = req.files.file;
    const serviceTitle = req.body.serviceTitle;
    const description = req.body.description;
    const encImg = file.data.toString("base64");
    const image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer(encImg, "base64"),
    };
    servicesCollection
      .insertOne({
        img: image,
        description,
        serviceTitle,
      })
      .then((result) => {
        res.send(result.insertedCount > 0);
        console.log(result);
      });
  });

  app.get("/show-all-service", (req, res) => {
    servicesCollection.find({}).toArray((error, documents) => {
      res.send(documents);
    });
  });

  app.post("/add-admin", (req, res) => {
    adminsCollection
      .insertOne({ admin: req.body.admin })
      .then((result) => {
        res.send(result.insertedCount > 0);
      })
      .catch((err) => console.log(err));
  });

  app.post("/add-review", (req, res) => {
    reviewsCollection
      .insertOne(req.body)
      .then((result) => {
        res.send(result.insertedCount > 0);
      })
      .catch((err) => {
        console.log(err);
      });
  });

  app.get("/show-feedbacks", (req, res) => {
    reviewsCollection.find({}).toArray((error, documents) => {
      res.send(documents);
    });
  });

  app.post("/add-order", (req, res) => {
    ordersCollection
      .insertOne(req.body)
      .then((result) => {
        res.send(result.insertedCount > 0);
      })
      .catch((error) => console.log(error));
  });

  app.get("/show-orders", (req, res) => {
    ordersCollection.find({}).toArray((error, documents) => {
      res.send(documents);
    });
  });

  app.get("/show-order-by-mail", (req, res) => {
    ordersCollection
      .find({ email: req.headers.email })
      .toArray((error, documents) => {
        res.send(documents);
      });
  });

  app.get("/check-admin", (req, res) => {
    adminsCollection
      .find({ admin: req.headers.email })
      .toArray((error, documents) => {
        res.send(documents.length > 0);
      });
  });

  app.patch("/update-status", (req, res) => {
    ordersCollection
      .updateOne(
        { _id: ObjectID(req.body.id) },
        {
          $set: { status: req.body.status },
        }
      )
      .then((result) => {
        res.send(result.modifiedCount > 0);
      })
      .catch((err) => console.log(err));
  });

  app.delete("/delete-feedback", (req, res) => {
    reviewsCollection
      .deleteOne({ _id: ObjectID(req.headers.id) })
      .then((result) => {
        res.send(result.deletedCount > 0);
      })
      .catch((err) => {
        console.log(err);
      });
  });
});

app.listen(process.env.PORT || port);
