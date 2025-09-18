const router = require("express").Router();

const userController = require("../controllers/UserController");

router.post("/cadastro", userController.cadastrar);

router.post("/login", userController.login);

module.exports = router;