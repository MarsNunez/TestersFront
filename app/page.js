"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Edit3,
  X,
  Sun,
  Moon,
  Filter,
  SortAsc,
  SortDesc,
  Loader,
  Check,
  Search,
  DollarSign,
  Package,
  BarChart2,
  AlertCircle,
  Download,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { debounce } from "lodash";
import { saveAs } from "file-saver";

/****************************
 * Utilidades
 ***************************/

const guardarTemaEnLS = (tema) => localStorage.setItem("tema-inventario", tema);
const leerTemaDeLS = () =>
  typeof window !== "undefined" && localStorage.getItem("tema-inventario");

const classMensaje = {
  success: "bg-green-600 border-green-700",
  error: "bg-red-600 border-red-700",
  info: "bg-blue-600 border-blue-700",
  warning: "bg-yellow-600 border-yellow-700",
};

const variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -30, scale: 0.95 },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
};

const ITEMS_POR_PAGINA = 5;

/****************************
 * Componentes Auxiliares
 ***************************/

const MensajeToast = ({ mensaje }) => (
  <AnimatePresence>
    {mensaje && (
      <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className={`fixed top-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-xl 
          text-white shadow-2xl z-50 border-l-8 ${
            classMensaje[mensaje.tipo]
          } flex items-center gap-3 max-w-lg`}
      >
        {mensaje.tipo === "success" && <Check size={24} />}
        {mensaje.tipo === "error" && <AlertCircle size={24} />}
        {mensaje.tipo === "info" && <Package size={24} />}
        {mensaje.tipo === "warning" && <AlertCircle size={24} />}
        <span className="font-medium">{mensaje.texto}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

const SkeletonCard = () => (
  <div
    className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 animate-pulse 
  flex flex-col gap-4 border border-gray-200 dark:border-gray-700"
  >
    <div className="flex justify-between">
      <div className="h-6 w-40 bg-gray-300 dark:bg-gray-700 rounded" />
      <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
    </div>
    <div className="h-4 w-64 bg-gray-300 dark:bg-gray-700 rounded" />
    <div className="flex gap-4">
      <div className="h-10 w-28 bg-gray-300 dark:bg-gray-700 rounded-lg" />
      <div className="h-10 w-28 bg-gray-300 dark:bg-gray-700 rounded-lg" />
    </div>
  </div>
);

const Modal = ({ abierto, onClose, onConfirm, nombre, tipo = "eliminar" }) => (
  <AnimatePresence>
    {abierto && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.85, y: 100 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.85, y: 100 }}
          className="bg-white dark:bg-gray-900 p-12 rounded-3xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-3">
            {tipo === "eliminar" ? (
              <>
                <Trash2 size={28} className="text-red-500" />
                ¿Eliminar "{nombre}"?
              </>
            ) : (
              <>
                <AlertCircle size={28} className="text-yellow-500" />
                Confirmar Acción
              </>
            )}
          </h3>
          <p className="mb-8 text-gray-600 dark:text-gray-400 text-lg">
            {tipo === "eliminar"
              ? "Esta acción no se puede deshacer. ¿Estás seguro?"
              : "Por favor, confirma para continuar."}
          </p>
          <div className="flex justify-end gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2 font-medium"
            >
              <X size={20} /> Cancelar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onConfirm}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition flex items-center gap-2 font-medium"
            >
              {tipo === "eliminar" ? (
                <>
                  <Trash2 size={20} /> Eliminar
                </>
              ) : (
                <>
                  <Check size={20} /> Confirmar
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ThemeToggle = ({ tema, toggle }) => (
  <motion.button
    whileHover={{ scale: 1.15, rotate: 15 }}
    whileTap={{ scale: 0.9 }}
    onClick={toggle}
    className="fixed bottom-10 right-10 bg-gradient-to-br from-gray-900 to-gray-800 
    dark:from-gray-200 dark:to-gray-300 text-white dark:text-gray-800 p-5 rounded-full shadow-2xl 
    hover:shadow-3xl transition-all duration-300 grid place-items-center z-40"
    title={tema === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
  >
    {tema === "light" ? <Moon size={28} /> : <Sun size={28} />}
  </motion.button>
);

const Estadisticas = ({ productos }) => {
  const totalProductos = productos.length;
  const precioPromedio = useMemo(
    () =>
      productos.length
        ? (
            productos.reduce((sum, p) => sum + parseFloat(p.precio), 0) /
            productos.length
          ).toFixed(2)
        : "0.00",
    [productos]
  );
  const precioMaximo = useMemo(
    () =>
      productos.length
        ? Math.max(...productos.map((p) => parseFloat(p.precio))).toFixed(2)
        : "0.00",
    [productos]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-3xl shadow-2xl p-8 mb-10 border border-gray-700 
      flex justify-between items-center"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-900 rounded-full">
          <Package size={28} className="text-blue-300" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">Total Productos</p>
          <p className="text-3xl font-bold text-gray-100">{totalProductos}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-green-900 rounded-full">
          <DollarSign size={28} className="text-green-300" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">Precio Promedio</p>
          <p className="text-3xl font-bold text-gray-100">
            S/. {precioPromedio}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-yellow-900 rounded-full">
          <BarChart2 size={28} className="text-yellow-300" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">Precio Máximo</p>
          <p className="text-3xl font-bold text-gray-100">S/. {precioMaximo}</p>
        </div>
      </div>
    </motion.div>
  );
};

const FilterOptions = ({
  textoBusqueda,
  setTextoBusqueda,
  sort,
  setSort,
  filtroPrecio,
  setFiltroPrecio,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 mb-10 border 
    border-gray-200 dark:border-gray-700"
  >
    <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-3">
      <Filter size={24} /> Opciones de Filtrado
    </h3>
    <div className="grid gap-6 md:grid-cols-3">
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium flex items-center gap-2">
          <Search size={20} /> Buscar
        </label>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={textoBusqueda}
          onChange={(e) => setTextoBusqueda(e.target.value)}
          className="w-full px-5 py-3 border rounded-lg focus:outline-none focus:ring-2 
          focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 transition"
        />
      </div>
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium flex items-center gap-2">
          <DollarSign size={20} /> Rango de Precio
        </label>
        <select
          value={filtroPrecio}
          onChange={(e) => setFiltroPrecio(e.target.value)}
          className="w-full px-5 py-3 border rounded-lg focus:outline-none focus:ring-2 
          focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 transition"
        >
          <option value="all">Todos</option>
          <option value="0-50">S/. 0 - 50</option>
          <option value="50-100">S/. 50 - 100</option>
          <option value="100+">S/. 100+</option>
        </select>
      </div>
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium flex items-center gap-2">
          <SortAsc size={20} /> Ordenar por Precio
        </label>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSort("asc")}
            className={`flex-1 px-5 py-3 rounded-lg transition flex items-center gap-2 ${
              sort === "asc"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            }`}
          >
            <SortAsc size={20} /> Asc
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSort("desc")}
            className={`flex-1 px-5 py-3 rounded-lg transition flex items-center gap-2 ${
              sort === "desc"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            }`}
          >
            <SortDesc size={20} /> Desc
          </motion.button>
        </div>
      </div>
    </div>
  </motion.div>
);

const HistorialAcciones = ({ historial }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 mb-10 border 
    border-gray-200 dark:border-gray-700"
  >
    <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-3">
      <History size={24} /> Historial de Acciones
    </h3>
    {historial.length === 0 ? (
      <p className="text-gray-600 dark:text-gray-400">
        No hay acciones registradas.
      </p>
    ) : (
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {historial.slice(0, 5).map((accion, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="py-4 flex items-center gap-4"
          >
            <div
              className={`p-2 rounded-full ${
                accion.tipo === "agregar"
                  ? "bg-green-100 dark:bg-green-900"
                  : accion.tipo === "editar"
                  ? "bg-yellow-100 dark:bg-yellow-900"
                  : "bg-red-100 dark:bg-red-900"
              }`}
            >
              {accion.tipo === "agregar" && <Check size={20} />}
              {accion.tipo === "editar" && <Edit3 size={20} />}
              {accion.tipo === "eliminar" && <Trash2 size={20} />}
            </div>
            <div>
              <p className="text-gray-800 dark:text-gray-100 font-medium">
                {accion.mensaje}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(accion.fecha).toLocaleString()}
              </p>
            </div>
          </motion.li>
        ))}
      </ul>
    )}
  </motion.div>
);

const Paginacion = ({ paginaActual, totalPaginas, onPageChange }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center justify-center gap-4 mt-8"
  >
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => onPageChange(paginaActual - 1)}
      disabled={paginaActual === 1}
      className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ChevronLeft size={24} />
    </motion.button>
    <div className="flex gap-2">
      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((page) => (
        <motion.button
          key={page}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-lg ${
            paginaActual === page
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          }`}
        >
          {page}
        </motion.button>
      ))}
    </div>
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => onPageChange(paginaActual + 1)}
      disabled={paginaActual === totalPaginas}
      className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ChevronRight size={24} />
    </motion.button>
  </motion.div>
);

/****************************
 * Componente Principal
 ***************************/

export default function InventoryAppExtended() {
  // Estados
  const [producto, setProducto] = useState({
    nombre: "",
    precio: "",
    descripcion: "",
  });

  const [productos, setProductos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [textoBusqueda, setTextoBusqueda] = useState(""); // Nuevo estado para el input de búsqueda
  const [busqueda, setBusqueda] = useState(""); // Estado para el valor de búsqueda usado en el filtrado
  const [sort, setSort] = useState("none");
  const [filtroPrecio, setFiltroPrecio] = useState("all");
  const [modalEliminar, setModalEliminar] = useState({
    abierto: false,
    id: null,
    nombre: "",
  });

  const [tema, setTema] = useState("light");
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(true);
  const [mostrarHistorial, setMostrarHistorial] = useState(true);
  const [historial, setHistorial] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);

  /* ----------------------------- Efectos ----------------------------- */

  useEffect(() => {
    const almacenado = leerTemaDeLS();
    if (almacenado) setTema(almacenado);
    fetchProductos();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "dark");
    guardarTemaEnLS(tema);
  }, [tema]);

  // Efecto para manejar la búsqueda con debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setBusqueda(textoBusqueda);
    }, 200);

    return () => clearTimeout(handler);
  }, [textoBusqueda]);

  /* --------------------- Funciones de utilidad ---------------------- */

  const mostrarMensaje = useCallback((texto, tipo = "info") => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 5000);
  }, []);

  const agregarHistorial = useCallback((mensaje, tipo) => {
    setHistorial((prev) => [
      { mensaje, tipo, fecha: new Date() },
      ...prev.slice(0, 49), // Limita a 50 entradas
    ]);
  }, []);

  const fetchProductos = async () => {
    setCargando(true);
    try {
      const res = await axios.get("http://localhost:8081/api/productos");
      setProductos(res.data);
      mostrarMensaje("Productos cargados exitosamente.", "success");
    } catch (err) {
      console.error("Error al obtener productos:", err);
      mostrarMensaje("No se pudieron cargar los productos.", "error");
    } finally {
      setCargando(false);
    }
  };

  const exportarCSV = () => {
    const csv = [
      "ID,Nombre,Precio,Descripción",
      ...productos.map(
        (p) => `${p.id},${p.nombre},${p.precio},${p.descripcion || ""}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `inventario_${new Date().toISOString().split("T")[0]}.csv`);
    mostrarMensaje("Inventario exportado como CSV.", "success");
    agregarHistorial("Exportación de inventario a CSV", "info");
  };

  /* --------------------------- Handlers ----------------------------- */

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
        agregarHistorial(`Producto "${producto.nombre}" actualizado`, "editar");
      } else {
        await axios.post("http://localhost:8081/api/productos", producto);
        mostrarMensaje("Producto agregado exitosamente.", "success");
        agregarHistorial(`Producto "${producto.nombre}" agregado`, "agregar");
      }

      setProducto({ nombre: "", precio: "", descripcion: "" });
      setEditandoId(null);
      fetchProductos();
    } catch (err) {
      console.error("Error al guardar producto:", err);
      mostrarMensaje("Ocurrió un error al guardar el producto.", "error");
    }
  };

  const solicitarEliminar = (id, nombre) => {
    setModalEliminar({ abierto: true, id, nombre });
  };

  const handleEliminar = async () => {
    try {
      await axios.delete(
        `http://localhost:8081/api/productos/${modalEliminar.id}`
      );
      fetchProductos();
      mostrarMensaje("Producto eliminado exitosamente.", "success");
      agregarHistorial(
        `Producto "${modalEliminar.nombre}" eliminado`,
        "eliminar"
      );
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      mostrarMensaje("Ocurrió un error al eliminar el producto.", "error");
    } finally {
      setModalEliminar({ abierto: false, id: null, nombre: "" });
    }
  };

  const handleEditar = (producto) => {
    setProducto({
      nombre: producto.nombre,
      precio: producto.precio,
      descripcion: producto.descripcion || "",
    });

    setEditandoId(producto.id);
  };

  const handleCancelar = () => {
    setProducto({ nombre: "", precio: "", descripcion: "" });
    setEditandoId(null);

    mostrarMensaje("Edición cancelada.", "info");
  };

  const toggleTema = () =>
    setTema((prev) => (prev === "light" ? "dark" : "light"));

  /* ---------------------- Lógica de filtrado y paginación ------------------------ */

  const productosFiltrados = useMemo(() => {
    console.log("Filtrando productos con:", { busqueda, filtroPrecio, sort });

    let filtered = productos
      .filter((p) => {
        const nombre = p.nombre ? p.nombre.toLowerCase() : "";
        const matchesSearch = nombre.includes(busqueda.toLowerCase());
        return matchesSearch;
      })
      .filter((p) => {
        const precio = parseFloat(p.precio);
        if (isNaN(precio)) return false; // Excluir precios no válidos
        if (filtroPrecio === "all") return true;
        if (filtroPrecio === "0-50") return precio >= 0 && precio <= 50;
        if (filtroPrecio === "50-100") return precio > 50 && precio <= 100;
        if (filtroPrecio === "100+") return precio > 100;
        return true;
      });

    // Ordenar después de filtrar
    filtered = filtered.sort((a, b) => {
      const precioA = parseFloat(a.precio);
      const precioB = parseFloat(b.precio);
      if (sort === "asc") return precioA - precioB;
      if (sort === "desc") return precioB - precioA;
      return 0;
    });

    console.log("Productos filtrados:", filtered);
    return filtered;
  }, [productos, busqueda, filtroPrecio, sort]);

  const totalPaginas = Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA);
  const productosPaginados = productosFiltrados.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  /****************************
   * Render
   ***************************/

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-950 
    dark:to-gray-900 transition-colors duration-700"
    >
      {/* ----------- Tema toggle ----------- */}
      <ThemeToggle tema={tema} toggle={toggleTema} />

      {/* ----------- Toast mensaje ----------- */}
      <MensajeToast mensaje={mensaje} />

      {/* ----------- Contenido principal ----------- */}
      <div className="max-w-7xl mx-auto p-10 pt-28">
        <motion.h1
          variants={variants}
          initial="hidden"
          animate="visible"
          className="text-6xl font-extrabold text-center mb-16 text-transparent bg-clip-text 
          bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
        >
          Sistema de Gestión de Inventario
        </motion.h1>

        {/* ------------------ Botones de control ------------------ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between mb-8"
        >
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMostrarEstadisticas((prev) => !prev)}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
              px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <BarChart2 size={20} />
              {mostrarEstadisticas ? "Ocultar" : "Mostrar"} Estadísticas
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMostrarHistorial((prev) => !prev)}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 
              py-3 rounded-lg flex items-center gap-2"
            >
              <History size={20} />
              {mostrarHistorial ? "Ocultar" : "Mostrar"} Historial
            </motion.button>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportarCSV}
            className="bg-green-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-md"
          >
            <Download size={20} /> Exportar CSV
          </motion.button>
        </motion.div>

        {/* ------------------ Estadísticas ------------------ */}
        {mostrarEstadisticas && <Estadisticas productos={productos} />}

        {/* ------------------ Formulario ------------------ */}
        <motion.form
          onSubmit={handleSubmit}
          variants={variants}
          initial="hidden"
          animate="visible"
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 mb-12 border 
          border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-4xl font-bold mb-8 text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <Package size={32} />
            {editandoId ? "Editar Producto" : "Agregar Producto"}
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                Nombre del Producto
              </label>
              <input
                type="text"
                name="nombre"
                value={producto.nombre}
                onChange={handleInputChange}
                className="w-full px-5 py-3 border rounded-lg focus:outline-none focus:ring-2 
                focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 transition"
                required
                placeholder="Ej. Smartphone Samsung Galaxy"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                Precio (S/.)
              </label>
              <input
                type="number"
                name="precio"
                value={producto.precio}
                onChange={handleInputChange}
                className="w-full px-5 py-3 border rounded-lg focus:outline-none 
                focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 
                dark:border-gray-700 transition"
                required
                step="0.01"
                min="0.01"
                max="1000000"
                placeholder="Ej. 2999.99"
              />
            </div>
            {/* <div className="md:col-span-2">
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                Descripción (Opcional)
              </label>
              <textarea
                name="descripcion"
                value={producto.descripcion}
                onChange={handleInputChange}
                className="w-full px-5 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 transition"
                rows="5"
                placeholder="Describe el producto en detalle..."
              />
            </div> */}
          </div>
          <div className="flex gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 
              py-3 rounded-lg hover:from-blue-700 hover:to-blue-900 transition flex 
              items-center gap-2 shadow-lg"
            >
              <Check size={24} />{" "}
              {editandoId ? "Actualizar" : "Agregar Producto"}
            </motion.button>
            {editandoId && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleCancelar}
                className="bg-gradient-to-r from-gray-500 to-gray-700 text-white 
                px-8 py-3 rounded-lg hover:from-gray-600 hover:to-gray-800 transition 
                flex items-center gap-2 shadow-lg"
              >
                <X size={24} /> Cancelar
              </motion.button>
            )}
          </div>
        </motion.form>

        {/* ------------------ Historial ------------------ */}
        {mostrarHistorial && <HistorialAcciones historial={historial} />}

        {/* ------------------ Filtros ------------------ */}
        <FilterOptions
          textoBusqueda={textoBusqueda}
          setTextoBusqueda={setTextoBusqueda}
          sort={sort}
          setSort={setSort}
          filtroPrecio={filtroPrecio}
          setFiltroPrecio={setFiltroPrecio}
        />

        {/* ------------------ Lista de productos ------------------ */}
        <motion.div
          variants={variants}
          initial="hidden"
          animate="visible"
          className="grid gap-8"
        >
          {cargando ? (
            Array.from({ length: ITEMS_POR_PAGINA }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          ) : productosPaginados.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl 
              shadow-2xl border border-gray-200 dark:border-gray-700"
            >
              <AlertCircle
                size={48}
                className="mx-auto mb-4 text-gray-400 dark:text-gray-500"
              />
              <p className="text-2xl text-gray-600 dark:text-gray-400">
                No hay productos que coincidan con los filtros.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {productosPaginados.map((p) => (
                <motion.div
                  key={p.id}
                  variants={variants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.4 }}
                  className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl p-8 flex flex-col 
                  md:flex-row items-start md:items-center justify-between border border-gray-200 
                  dark:border-gray-700 hover:shadow-3xl transition-shadow duration-500"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {p.nombre}
                      </h3>
                    </div>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">
                      S/. {parseFloat(p.precio).toFixed(2)}
                    </p>
                    {p.descripcion && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {p.descripcion}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-4 mt-4 md:mt-0">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEditar(p)}
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 
                      py-3 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition flex 
                      items-center gap-2 shadow-md"
                    >
                      <Edit3 size={20} /> Editar
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => solicitarEliminar(p.id, p.nombre)}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 
                      rounded-lg hover:from-red-600 hover:to-red-700 transition flex items-center gap-2 shadow-md"
                    >
                      <Trash2 size={20} /> Eliminar
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>

        {/* ------------------ Paginación ------------------ */}
        {totalPaginas > 1 && (
          <Paginacion
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            onPageChange={setPaginaActual}
          />
        )}
      </div>

      {/* ------------------ Modal de confirmación ------------------ */}
      <Modal
        abierto={modalEliminar.abierto}
        onClose={() =>
          setModalEliminar({ abierto: false, id: null, nombre: "" })
        }
        onConfirm={handleEliminar}
        nombre={modalEliminar.nombre}
      />
    </div>
  );
}
