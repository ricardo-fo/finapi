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

// Calcula o saldo
function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit') {
      return acc + operation.amount;
    } else if (operation.type === 'debit') {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
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

// Realiza um depósito
app.post('/deposits', verifyIfExistAccountCPF, (req, res) => {
  const { description, amount } = req.body;
  const { customer } = req;
  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit',
  }

  customer.statement.push(statementOperation);

  return res.status(201).send();
})

// Realiza um saque
app.post('/withdrawals', verifyIfExistAccountCPF, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;
  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(403).json({ error: 'Insufficient funds!' })
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit',
  }

  customer.statement.push(statementOperation);

  return res.status(201).send();
})

// Busca o extrato bancário de um cliente a partir de uma data
app.get('/statements/date', verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const dateFormat = new Date(date + " 00:00");
  const statement = customer.statement.filter((s) => {
    return s.created_at.toDateString() === new Date(dateFormat).toDateString();
  });

  return res.status(200).json(statement);
});

// Atualiza os dados de um cliente
app.put('/accounts', verifyIfExistAccountCPF, (req, res) => {
  const { name } = req.body;
  const { customer } = req;

  customer.name = name;

  return res.status(201).send();
});

// Busca por um cliente
app.get('/accounts', verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req;

  return res.status(200).json(customer);
})

// Remove um cliente
app.delete('/accounts', verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req;

  customers.splice(customer, 1);

  return res.status(200).json(customers);
});

// Busca pelo saldo de um cliente
app.get('/balances', verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req;
  const balance = getBalance(customer.statement);

  return res.status(200).json(balance);
});

app.listen(3333);
