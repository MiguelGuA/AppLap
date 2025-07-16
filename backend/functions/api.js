const express = require('express');
const serverless = require('serverless-http');
const app = express();

// Middlewares
app.use(express.json());

// Rutas
app.use('/api/auth', require('../src/routes/auth'));
app.use('/api/choferes', require('../src/routes/choferes'));
app.use('/api/citas', require('../src/routes/citas'));
app.use('/api/consultas', require('../src/routes/consultas'));
app.use('/api/incidentes', require('../src/routes/incidentes'));
app.use('/api/locadores', require('../src/routes/locadores'));
app.use('/api/proveedores', require('../src/routes/proveedores'));

// Handler para Netlify
module.exports.handler = serverless(app);
