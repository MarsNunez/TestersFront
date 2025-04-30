"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const [producto, setProducto] = useState({ nombre: "", precio: "" });
  const [productos, setProductos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      const res = await axios.get("http://localhost:8081/api/productos");
      setProductos(res.data);
    } catch (err) {
      console.error("Error al obtener productos:", err);
    }
  };

  const mostrarMensaje = (texto, tipo = "info") => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProducto({ ...producto, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!producto.nombre.trim()) {
      mostrarMensaje("El nombre no puede estar vacío.", "error");
      return;
    }
    if (!producto.precio || parseFloat(producto.precio) <= 0) {
      mostrarMensaje("El precio debe ser mayor que cero.", "error");
      return;
    }

    try {
      if (editandoId) {
        await axios.put(
          `http://localhost:8081/api/productos/${editandoId}`,
          producto
        );
        mostrarMensaje("Producto actualizado exitosamente.", "success");
      } else {
        await axios.post("http://localhost:8081/api/productos", producto);
        mostrarMensaje("Producto agregado exitosamente.", "success");
      }
      setProducto({ nombre: "", precio: "" });
      setEditandoId(null);
      fetchProductos();
    } catch (err) {
      console.error("Error al guardar producto:", err);
      mostrarMensaje("Ocurrió un error al guardar el producto.", "error");
    }
  };

  const handleEliminar = async (id) => {
    try {
      await axios.delete(`http://localhost:8081/api/productos/${id}`);
      fetchProductos();
      mostrarMensaje("Producto eliminado exitosamente.", "success");
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      mostrarMensaje("Ocurrió un error al eliminar el producto.", "error");
    }
  };

  const handleEditar = (producto) => {
    setProducto({ nombre: producto.nombre, precio: producto.precio });
    setEditandoId(producto.id);
  };

  const handleCancelar = () => {
    setProducto({ nombre: "", precio: "" });
    setEditandoId(null);
    mostrarMensaje("Edición cancelada.", "info");
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-center mb-8">
        Control de Inventario
      </h1>

      {mensaje && (
        <div
          className={`mb-6 px-4 py-2 rounded text-white ${
            mensaje.tipo === "success"
              ? "bg-green-500"
              : mensaje.tipo === "error"
              ? "bg-red-500"
              : "bg-blue-500"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow p-6 mb-10"
      >
        <h2 className="text-2xl font-semibold mb-4">
          {editandoId ? "Editar Producto" : "Agregar Producto"}
        </h2>
        <div className="mb-4">
          <label className="block text-gray-700">Nombre:</label>
          <input
            type="text"
            name="nombre"
            value={producto.nombre}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Precio:</label>
          <input
            type="number"
            name="precio"
            value={producto.precio}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            required
            step="0.01"
            min="0.01"
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {editandoId ? "Aceptar" : "Agregar Producto"}
          </button>
          {editandoId && (
            <button
              type="button"
              onClick={handleCancelar}
              className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-4">
        {productos.map((p) => (
          <div
            key={p.id}
            className="bg-white shadow rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                {p.nombre}
              </h3>
              <p className="text-gray-500">
                S/. {parseFloat(p.precio).toFixed(2)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditar(p)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
              >
                Editar
              </button>
              <button
                onClick={() => handleEliminar(p.id)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
