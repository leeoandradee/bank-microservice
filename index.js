const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Account = require("./model/account");
const { check, validationResult } = require("express-validator");
const auth = require("./middleware/auth");
const getTokenInfo = require("./utils/token");

const app = express();
app.use(express.json());

app.use(cors());

const url =
  "";

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

app.get("/bank", (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const tokenData = getTokenInfo(token);

  Account.find({ username: tokenData.user }, (error, data) => {
    if (error) {
      return res.status(500).send({ output: `Erro ao tentar listar contas` });
    }
    return res.status(200).send(data);
  });
  //Account.collection.drop();
});

app.post(
  "/bank",
  check("bankName").notEmpty().withMessage("bankName can not be empty"),
  check("accountType").notEmpty().withMessage("accountType can not be empty"),
  check("creditCardLimit")
    .notEmpty()
    .withMessage("creditCardLimit can not be empty"),
  auth,
  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const token = req.headers.authorization.split(" ")[1];
    const tokenData = getTokenInfo(token);

    const account = new Account({
      username: tokenData.user,
      bankName: req.body.bankName,
      accountType: req.body.accountType,
      ownerName: tokenData.name,
      creditCardLimit: req.body.creditCardLimit,
    });
    Account.findOne(
      { username: tokenData.user, bankName: req.body.bankName },
      (error, bankAccount) => {
        if (error) {
          return res
            .status(500)
            .send({ output: `Erro ao tentar localizar a conta do banco` });
        }
        if (bankAccount) {
          return res.status(400).send({
            output: `Conta do banco ${req.body.bankName} já foi cadastrada.`,
          });
        }

        account
          .save()
          .then((success) => {
            res
              .status(201)
              .send({ output: `Nova conta cadastrada`, payload: success });
          })
          .catch((error) => {
            console.log(error);
            if (error && error.code === 11000) {
              res.status(400).send({
                output: `A conta do banco ${req.body.bankName} já foi cadastrada`,
              });

              return;
            }
            res.status(500).send({ output: `Cadastro não realizado` });
          });
      }
    );
  }
);

app.put(
  "/bank",
  check("bankName").notEmpty().withMessage("bankName can not be empty"),
  check("accountType").notEmpty().withMessage("accountType can not be empty"),
  check("creditCardLimit")
    .notEmpty()
    .withMessage("creditCardLimit can not be empty"),
  auth,
  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const token = req.headers.authorization.split(" ")[1];
    const tokenData = getTokenInfo(token);

    const accountUpdate = {
      bankName: req.body.bankName,
      accountType: req.body.accountType,
      creditCardLimit: req.body.creditCardLimit,
    };

    Account.findOneAndUpdate(
      { username: tokenData.user, bankName: req.body.bankName },
      accountUpdate,
      { new: true },
      (error, data) => {
        if (error) {
          console.error(error);
          return res
            .status(500)
            .send({ output: `Erro ao tentar localizar a conta` });
        }
        if (!data) {
          return res.status(403).send({ output: `Conta não localizada` });
        }
        return res.status(200).send(data);
      }
    );
  }
);

app.listen(5000, () => {
  console.log("Servidor online em http://localhost:5000");
});
