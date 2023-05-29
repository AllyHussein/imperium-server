import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
// import bcrypt from "bcryptjs";

/* CONFIGURATION */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
mongoose.set("strictQuery", false);

// Define reservation schema
const reservationSchema = new mongoose.Schema({
  name: String,
  date: Date,
  time: String,
  persons: Number,
  message: String,
  phone: Number,
  reservationID: Number,
  // tableId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Table",
  // },
});
// reservationSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: "tableId",
//     select: "number -_id",
//   });
//   next();
// });

// const tableSchema = new mongoose.Schema({
//   number: String,
//   isAvailable: Boolean,
// });
const menuItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  category: String,
});

const specialDishSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  category: String,
});
const adminSchema = new mongoose.Schema({
  email: String,
  password: String,
});
const Admin = mongoose.model("Admin", adminSchema);
// const Table = mongoose.model("Table", tableSchema);
const Reservation = mongoose.model("Reservation", reservationSchema);
const MenuItem = mongoose.model("MenuItem", menuItemSchema);
const SpecialDish = mongoose.model("SpecialDish", specialDishSchema);

// Define API routes
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "public/assets");
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email, password });

  if (admin) {
    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET_KEY);

    res.status(200).json({ data: admin, token });
  } else {
    res.status(403).json("Invalid Credentials");
  }
});

app.post("/api/reservations", async (req, res) => {
  try {
    const newReservation = await Reservation.create(req.body);
    res.status(200).json(newReservation);
  } catch (error) {
    res.status(500).json("Error saving reservation");
  }
  // const newReservation = new Reservation(req.body);
  // await newReservation
  //   .save()
  //   .then(async () => {
  //     // const savedReservation = await Reservation.findById(newReservation._id);
  //     // await Table.findByIdAndUpdate(req.body.tableId, { isAvailable: false });
  //     res.status(200).json(savedReservation);
  //   })
  //   .catch((error) => {
  //     console.error(error);
  //     res.status(500).json("Error saving reservation");
  //   });
});
app.get("/api/reservations", async (req, res) => {
  try {
    const reservations = await Reservation.find();
    res.status(200).json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.get("/api/reservations/:reservationId", async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.reservationId);
    res.status(200).json(reservation);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});
app.delete("/api/reservations/:reservationId", async (req, res) => {
  try {
    await Reservation.findByIdAndDelete(req.params.reservationId);
    res.status(200).json("Reservation Deleted");
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// app.get("/api/tables", async (req, res) => {
//   try {
//     const Tables = await Table.find();
//     res.status(200).json(Tables);
//   } catch (error) {
//     res.status(404).json({ message: error.message });
//   }
// });

// app.put("/api/tables/:id", async (req, res) => {
//   const { id } = req.params;
//   const table = await Table.findById(id);
//   var updateData;
//   if (table.isAvailable) {
//     updateData = false;
//   } else {
//     updateData = true;
//   }

//   try {
//     const updatedTables = await Table.findByIdAndUpdate(
//       id,
//       { isAvailable: updateData },
//       {
//         new: true,
//       }
//     );
//     await updatedTables.save();
//     res.status(200).json(updatedTables);
//   } catch (error) {
//     res.status(404).json({ message: error.message });
//   }
// });

// app.get("/api/check-availability", async (req, res) => {
//   try {
//     const availableTables = await Table.find({ isAvailable: true });
//     res.status(200).json(availableTables);
//   } catch (error) {
//     res.status(404).json({ message: error.message });
//   }
// });

app.get("/api/menus", async (req, res) => {
  try {
    const MenuItems = await MenuItem.find();
    res.status(200).json(MenuItems);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});
app.post("/api/menus", upload.single("image"), async (req, res) => {
  try {
    const { name, description, category, price } = req.body;
    const imageUrl = req.file.filename;
    const Item = await MenuItem.create({
      name,
      description,
      category,
      price,
      image: imageUrl,
    });
    res.status(200).json(Item);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});
app.get("/api/menus/:menuId", async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.menuId);
    res.status(200).json(menuItem);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});
app.delete("/api/menus/:menuId", async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.menuId);
    res.status(200).json("Menu Item Deleted");
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});
app.put("/api/menus/:menuId", upload.single("image"), async (req, res) => {
  const { menuId } = req.params;
  const { name, description, category, price } = req.body;
  const imageUrl = req.file.filename;

  try {
    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      menuId,
      {
        name,
        description,
        category,
        price,
        image: imageUrl,
      },
      {
        new: true,
      }
    );
    await updatedMenuItem.save();
    res.status(200).json(updatedMenuItem);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

app.get("/api/special-dish", async (req, res) => {
  try {
    const Dish = await SpecialDish.find();
    res.status(200).json(Dish);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

app.post("/api/special-dish", upload.single("image"), async (req, res) => {
  try {
    const { name, description, category, price } = req.body;
    const imageUrl = req.file.filename;
    // Create a new document in the database
    const newDish = await SpecialDish.create({
      name,
      description,
      category,
      price,
      image: imageUrl,
    });

    // Delete all other documents from the collection
    await SpecialDish.deleteMany({ _id: { $ne: newDish._id } });

    // Send a response indicating success
    res.status(201).json(newDish);
  } catch (error) {
    // Send a response indicating an error
    res.status(500).json({ message: error.message });
  }
});

const port = process.env.PORT || 5000;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    // Start server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => console.log(`${error} Could Not Connect`));
