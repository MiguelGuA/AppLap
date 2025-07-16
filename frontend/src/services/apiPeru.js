// Este archivo ahora llama a nuestro propio backend, que actúa como un proxy seguro.
import api from '../api'; // Asumiendo que tienes un cliente axios configurado en esta ruta.

/**
 * Consulta los datos de una persona a partir de su DNI, llamando a nuestro propio backend.
 * @param {string} dni - El número de DNI de 8 dígitos.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la persona.
 * @throws {Error} Si la consulta a la API falla o el DNI no es válido.
 */
export const consultarDni = async (dni) => {
  try {
    // Llama al nuevo endpoint del backend
    const response = await api.get(`/consultas/dni/${dni}`);
    return response.data;
  } catch (error) {
    // Lanza el error para que el componente que llama lo pueda manejar
    console.error("Error desde el servicio apiPeru (DNI):", error.response);
    throw new Error(error.response?.data?.error || 'No se pudo conectar con el servidor para consultar el DNI.');
  }
};

/**
 * Consulta los datos de una empresa a partir de su RUC, llamando a nuestro propio backend.
 * @param {string} ruc - El número de RUC de 11 dígitos.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la empresa.
 * @throws {Error} Si la consulta a la API falla o el RUC no es válido.
 */
export const consultarRuc = async (ruc) => {
  try {
    // Llama al nuevo endpoint del backend
    const response = await api.get(`/consultas/ruc/${ruc}`);
    return response.data;
  } catch (error) {
    // Lanza el error para que el componente que llama lo pueda manejar
    console.error("Error desde el servicio apiPeru (RUC):", error.response);
    throw new Error(error.response?.data?.error || 'No se pudo conectar con el servidor para consultar el RUC.');
  }
};
