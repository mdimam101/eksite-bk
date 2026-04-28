const userModel = require("../../models/userModel");

async function userSignUpController(req, res) {
  try {
    const { email, password, name, deviceId } = req.body;

    if (!deviceId) {
      const user = await userModel.findOne({ email });
      // console.log("user", user);

      if (user) {
        throw new Error("Already user exist");
      }

      // to hash password
      const bcrypt = require("bcrypt");
      const saltRounds = 10;

      // check available email, password, name

      if (!email) {
        throw new Error("please provide email");
      }
      if (!password) {
        throw new Error("please provide password");
      }
      if (!name) {
        throw new Error("please provide name");
      }
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashPassword = bcrypt.hashSync(password, salt);

      if (!hashPassword) {
        throw new Error("Something is wrong");
      }

      const payload = {
        ...req.body,
        role: "GENEREL",
        password: hashPassword,
      };

      //every time user new register get email,name,password from body
      const userData = new userModel(payload);
      const saveUser = await userData.save();

      res.status(201).json({
        data: saveUser,
        success: true,
        error: false,
        message: "User created successfully",
      });
    } else if (deviceId) {
      // when login guest user
      const payload = {
        ...req.body,
        role: "GENEREL",
      };

      //every time user new register get email,name,password from body
      const userData = new userModel(payload);
      const saveUser = await userData.save();

      res.status(201).json({
        data: saveUser,
        success: true,
        error: false,
        message: "User created successfully",
      });
    }
  } catch (err) {
    res.json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}
module.exports = userSignUpController;
