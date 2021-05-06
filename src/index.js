const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const customers = [];

// Middleware
function verifyIfExistAccountCPF(req, res, next) {
  const { cpf } = req.headers;
  const customer = customers.find((c) => c.cpf === cpf);

  if (!customer) return res.status(404).json({ error: 'Customer not found.' });
  req.customer = customer;

  return next();
}

// Cria um cliente
app.post('/accounts', (req, res) => {
  const { cpf, name } = req.body;
  const customerAlreadyExists = customers.some((c) => c.cpf === cpf);

  if (customerAlreadyExists) {
    return res.status(400).send({ error: 'CPF already exists.' });
  }

  customers.push({ cpf, name, id: uuidv4(), statement: [] });

  return res.status(201).send();
});

// Busca o extrato bancário de um cliente
app.get('/statements', verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req;
  return res.json(customer.statement);
});

app.listen(3333);
