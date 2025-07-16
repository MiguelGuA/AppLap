import express from 'express';
import fetch from 'node-fetch';
import { autenticarToken } from '../auth.js';

const router = express.Router();


const TOKEN = process.env.APIS_NET_PE_TOKEN;

/**
 * @route   GET /consultas/dni/:dni
 * @desc    Consulta un DNI en la API externa de forma segura desde el backend.
 * @access  Privado
 */
router.get('/dni/:dni', autenticarToken, async (req, res) => {
  const { dni } = req.params;

  if (!dni || dni.length !== 8) {
    return res.status(400).json({ error: "El DNI debe tener 8 dígitos." });
  }

  const url = `https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`;

  try {
    const apiResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json({ error: data.message || 'Error en la API externa al consultar DNI.' });
    }
    
    res.json(data);

  } catch (error) {
    console.error("Error en el proxy de consulta DNI:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

/**
 * @route   GET /consultas/ruc/:ruc
 * @desc    Consulta un RUC en la API externa de forma segura desde el backend.
 * @access  Privado
 */
router.get('/ruc/:ruc', autenticarToken, async (req, res) => {
    const { ruc } = req.params;

    if (!ruc || ruc.length !== 11) {
      return res.status(400).json({ error: "El RUC debe tener 11 dígitos." });
    }
  
    const url = `https://api.apis.net.pe/v2/sunat/ruc?numero=${ruc}`;
  
    try {
      const apiResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
  
      const data = await apiResponse.json();
  
      if (!apiResponse.ok) {
        return res.status(apiResponse.status).json({ error: data.message || 'Error en la API externa al consultar RUC.' });
      }
      
      res.json(data);
  
    } catch (error) {
      console.error("Error en el proxy de consulta RUC:", error);
      res.status(500).json({ error: "Error interno del servidor." });
    }
});

export default router;
