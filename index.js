const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.render("Home");
});

const userRoutes = require("./routes/UserRoutes");
app.use("/cadastro", userRoutes);

const userController = require("./controllers/UserController");

app.get("/areaLogada", userController.verificaLogin, (req, res, next) => {
  res.json({
    msg:
      "Você está loogado sobre o ID" +
      req.usuarioId +
      "e pode acessar esta rota",
  });
});

app.listen(1414, (err) => {
  console.log("A aplicação esta rodando na porta 1414");
});
