import React, { useState, useMemo, useEffect } from 'react';
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/currency';
import { createOrder, getUserAddresses } from '../services/apiService'; // 🎯 Importar la función de direcciones
import { useAuth } from '../context/AuthContext'; 

const pageVariants = {
  initial: { opacity: 0, x: "50vw" },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: "-50vw" }
};

const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.4
};

// Componente simple para mostrar una dirección
const AddressCard = ({ address, isSelected, onSelect }) => (
    <div 
        className={`card p-3 mb-3 cursor-pointer ${isSelected ? 'border-primary border-2 shadow-sm' : 'border-gray-300'}`}
        onClick={() => onSelect(address.id)}
        style={{ cursor: 'pointer' }}
    >
        <p className="fw-bold mb-1">{address.street} {address.number}{address.apartment ? `, Dpto ${address.apartment}` : ''}</p>
        <p className="mb-0 text-muted small">{address.commune}, {address.region}, {address.zip_code}</p>
    </div>
);


export default function PaymentPage() { // Usamos PaymentPage para consistencia
  const navigate = useNavigate();
  // Asumo que 'isLoading' es el estado de carga del carrito (aunque no lo veo en el código de arriba)
  const { items, totalPrice, clearCart, isLoading: isCartLoading } = useCart(); 
  
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth(); 
  const userId = user?.id;

  // 🎯 Nuevos estados para la gestión de direcciones
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddressesLoading, setIsAddressesLoading] = useState(false); // Cambiado a false
  
  // 🎯 Estado para la nueva dirección
  const [newAddressData, setNewAddressData] = useState({
    street: '',
    number: '',
    commune: '',
    region: '',
    zip_code: '',
  });

  // Estado para controlar qué paso se muestra (1: Dirección, 2: Pago)
  const [step, setStep] = useState(1); 

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '4242424242424242', 
    cardHolder: user?.name || 'Nombre del titular', 
    expiryDate: '12/26',
    cvv: '123',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const totalItems = useMemo(
    () => (items || []).reduce((acc, it) => acc + Number(it.quantity ?? 0), 0),
    [items]
  );
  
  // ----------------------------------------------------
  // 🎯 EFECTO: Cargar Direcciones al inicio
  // ----------------------------------------------------
  useEffect(() => {
    // Si la autenticación ha cargado y el usuario existe
    if (!isAuthLoading && userId) { 
      setIsAddressesLoading(true);
      // Solo cargar si no hay orden exitosa (para evitar recargar)
      if (!orderSuccess) { 
          // 🎯 Llamar sin pasar userId
          getUserAddresses() 
            .then(data => {
              setAddresses(data); 
              if (data.length > 0) {
                setSelectedAddressId(data[0].id);
              } else {
                // Si no hay direcciones, asignamos un ID temporal (-1) para indicar 'Nueva'
                setSelectedAddressId(-1); 
              }
            })
            .catch(err => {
                console.error("Error al cargar direcciones:", err);
                setError("No se pudieron cargar las direcciones de envío. (Verifica el endpoint /address)");
                // Si falla la carga, asumimos un ID simulado (-1)
                setSelectedAddressId(-1); 
            })
            .finally(() => {
              setIsAddressesLoading(false);
            });
      } else {
        setIsAddressesLoading(false);
      }
    }
  }, [userId, isAuthLoading, orderSuccess]); 

  // ----------------------------------------------------
  // 🛡️ Guardias de Carga y Autenticación
  // ----------------------------------------------------
  // Si el carrito está vacío, redirige (asumiendo que isCartLoading es false si items.length > 0)
  if (!items.length && !orderSuccess && !isAuthLoading) { 
    navigate('/cart');
    return null;
  }

  // Muestra un estado de carga si la autenticación o las direcciones aún no terminan
  if (isAuthLoading || isAddressesLoading) {
    return (
      <motion.main className="main-content-padding py-5 text-center">
        <h1 className="mb-4">Cargando...</h1>
        <p className="text-muted">Verificando sesión y direcciones.</p>
        <span className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </span>
      </motion.main>
    );
  }
  
  // Si el usuario no está autenticado
  if (!isAuthenticated || !userId) {
    return (
      <motion.main className="main-content-padding py-5 text-center">
        <h1 className="mb-4 text-danger">Acceso Denegado</h1>
        <p className="lead">Debes iniciar sesión para completar la compra.</p>
        <button className="btn__text mt-3" onClick={() => navigate('/login', { state: { from: '/checkout/payment' } })}>
            Ir a Iniciar Sesión
        </button>
      </motion.main>
    );
  }
  
  // ----------------------------------------------------
  // Manejadores
  // ----------------------------------------------------

  const handlePaymentChange = (e) => {
    setPaymentInfo({ ...paymentInfo, [e.target.name]: e.target.value });
    setError(null);
  };
  
  // Maneja los cambios en el formulario de nueva dirección
  const handleNewAddressChange = (e) => {
      setNewAddressData({ ...newAddressData, [e.target.name]: e.target.value });
      setError(null);
  };


  const handleNextStep = () => {
    // Validación del Paso 1 (Dirección)
    if (step === 1) {
        
        // 1. Caso: Seleccionar Dirección Existente
        if (addresses.length > 0) {
            if (!selectedAddressId || selectedAddressId === -1) {
                 setError("Debes seleccionar una dirección guardada para continuar.");
                 return;
            }
        } 
        
        // 2. Caso: Agregar Nueva Dirección (solo si no hay guardadas)
        else { 
            // Validar campos mínimos del formulario de nueva dirección (simulación)
            if (!newAddressData.street || !newAddressData.number || !newAddressData.commune) {
                setError("Por favor, completa los campos de dirección: Calle, Número y Comuna.");
                return;
            }
            // Si el formulario está OK, el addressId ya es -1 (Nuevo)
        }
        
        setError(null);
        setStep(2); // Avanzar al Paso 2: Pago
    }
  };

  const handleFinalizeOrder = async (e) => {
    e.preventDefault();
    if (totalPrice <= 0) {
        setError("El total de la compra no puede ser cero.");
        return;
    }
    
    // Si selectedAddressId es -1, significa que usamos la nueva dirección simulada
    const addressToUse = selectedAddressId || 0; 
    
    if (!paymentInfo.cardNumber || paymentInfo.cardNumber.length < 16) {
      setError("Por favor, ingresa un número de tarjeta válido.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    // --- SIMULACIÓN DE PAGO ---
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    const paymentSuccessful = Math.random() > 0.1; 

    if (!paymentSuccessful) {
      setIsProcessing(false);
      setError("El pago fue rechazado por la pasarela de pago simulada. Intenta con otra tarjeta.");
      return;
    }
    
    // --- CREACIÓN DE LA ORDEN EN XANO (Paso 2 del flujo) ---
    try {
      // 🎯 Si la dirección es nueva (-1), Xano recibirá ese ID o 0 (si es null/undefined) 
      // y asumirá que debe usar los datos del usuario o crearla.
      const orderData = await createOrder(totalPrice, items, userId, addressToUse);
      
      setOrderSuccess(orderData);
      clearCart(); 
      
    } catch (apiError) {
      console.error("Error al crear la orden en Xano:", apiError);
      setError(apiError.message || "Error desconocido al crear la orden. Verifica la consola.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ----------------------------------------------------
  // Contenido de Éxito
  // ----------------------------------------------------
  if (orderSuccess) {
    const finalAddress = addresses.find(a => a.id === selectedAddressId);
    
    // Renderiza la dirección nueva si no había guardadas
    const newAddressSummary = selectedAddressId === -1 ? 
        `${newAddressData.street} ${newAddressData.number}, ${newAddressData.commune}` : null;

    return (
      <motion.main
        className="main-content-padding"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <div className="container py-5 text-center">
          <div className="card p-5 shadow-lg border-0 rounded-4">
            <h1 className="text-success mb-3">¡Orden Creada con Éxito!</h1>
            <p className="lead mb-4">Tu orden **#{orderSuccess.order_number || orderSuccess.id}** ha sido procesada.</p>
            {(finalAddress || newAddressSummary) && (
              <div className="mb-3">
                <p className="fw-semibold mb-1 small">Enviado a:</p>
                {finalAddress ? (
                    <>
                        <p className="mb-0 small">{finalAddress.street} {finalAddress.number}</p>
                        <p className="mb-0 small text-muted">{finalAddress.commune}</p>
                    </>
                ) : (
                    <p className="mb-0 small">{newAddressSummary}</p>
                )}
              </div>
            )}
            <p className="text-muted">Recibirás una confirmación por correo electrónico en breve.</p>
            <button 
              className="btn__text mt-4" 
              onClick={() => navigate('/')}
            >
              Volver a la tienda
            </button>
          </div>
        </div>
      </motion.main>
    );
  }

  // ----------------------------------------------------
  // Contenido Principal (Paso 1 o 2)
  // ----------------------------------------------------
  return (
    <motion.main
      className="main-content-padding"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <div className="container py-5">
        <h1 className="mb-4">Finalizar Compra</h1>
        <div className="row g-4">
          
          {/* Columna de Formulario (Dirección/Pago) */}
          <div className="col-12 col-lg-7">
            <div className="card p-4 rounded-4 shadow-sm h-100">
              
              {/* 🛑 Mensaje de error general */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {/* -------------------------------------- */}
              {/* PASO 1: DIRECCIÓN            */}
              {/* -------------------------------------- */}
              {step === 1 && (
                <div>
                    <h2 className="h5 mb-4">1. Dirección de Envío</h2>
                    
                    {addresses.length === 0 ? (
                        // 🎯 Formulario de Nueva Dirección (Simulado)
                        <div className="mb-4 p-3 border rounded-3 bg-light">
                            <p className="fw-semibold mb-3">Ingresa una nueva dirección:</p>
                            
                            <div className="row g-3">
                                <div className="col-md-9">
                                    <label htmlFor="street" className="form-label small">Calle</label>
                                    <input type="text" className="form-control" id="street" name="street" value={newAddressData.street} onChange={handleNewAddressChange} required placeholder="Av. Principal" />
                                </div>
                                <div className="col-md-3">
                                    <label htmlFor="number" className="form-label small">Número</label>
                                    <input type="text" className="form-control" id="number" name="number" value={newAddressData.number} onChange={handleNewAddressChange} required placeholder="123" />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="commune" className="form-label small">Comuna</label>
                                    <input type="text" className="form-control" id="commune" name="commune" value={newAddressData.commune} onChange={handleNewAddressChange} required placeholder="Santiago" />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="region" className="form-label small">Región/Estado</label>
                                    <input type="text" className="form-control" id="region" name="region" value={newAddressData.region} onChange={handleNewAddressChange} placeholder="Metropolitana" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Opción de seleccionar dirección existente
                        <div className="mb-4">
                            <p className="text-muted small">Selecciona una dirección guardada:</p>
                            {addresses.map(addr => (
                                <AddressCard
                                    key={addr.id}
                                    address={addr}
                                    isSelected={addr.id === selectedAddressId}
                                    onSelect={setSelectedAddressId}
                                />
                            ))}
                        </div>
                    )}
                    
                    <button
                        type="button"
                        className="btn__text w-100"
                        onClick={handleNextStep}
                        // Botón siempre habilitado si hay formulario o si se seleccionó una existente
                        disabled={addresses.length > 0 && selectedAddressId === null}
                    >
                        Continuar al Pago
                    </button>
                </div>
              )}

              {/* -------------------------------------- */}
              {/* PASO 2: PAGO               */}
              {/* -------------------------------------- */}
              {step === 2 && (
                <form onSubmit={handleFinalizeOrder}>
                    <h2 className="h5 mb-4">2. Datos de Pago (Simulación)</h2>
                    
                    {/* Botón para volver al paso 1 */}
                    <button type="button" className="btn btn-link p-0 mb-3" onClick={() => setStep(1)}>
                        &larr; Cambiar Dirección
                    </button>
                    
                    <div className="mb-3">
                        <label htmlFor="cardNumber" className="form-label">Número de Tarjeta</label>
                        <input
                            type="text"
                            className="form-control"
                            id="cardNumber"
                            name="cardNumber"
                            value={paymentInfo.cardNumber}
                            onChange={handlePaymentChange}
                            maxLength="16"
                            placeholder="**** **** **** 4242"
                            required
                            disabled={isProcessing}
                        />
                        <div className="form-text">Simulación: Puedes usar 4242... (Visa/Mastercard)</div>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="cardHolder" className="form-label">Nombre del Titular</label>
                        <input
                            type="text"
                            className="form-control"
                            id="cardHolder"
                            name="cardHolder"
                            value={paymentInfo.cardHolder}
                            onChange={handlePaymentChange}
                            required
                            disabled={isProcessing}
                        />
                    </div>

                    <div className="row mb-4">
                        <div className="col-6">
                            <label htmlFor="expiryDate" className="form-label">Fecha de Vencimiento</label>
                            <input
                            type="text"
                            className="form-control"
                            id="expiryDate"
                            name="expiryDate"
                            value={paymentInfo.expiryDate}
                            onChange={handlePaymentChange}
                            placeholder="MM/AA"
                            maxLength="5"
                            required
                            disabled={isProcessing}
                            />
                        </div>
                        <div className="col-6">
                            <label htmlFor="cvv" className="form-label">CVV</label>
                            <input
                            type="text"
                            className="form-control"
                            id="cvv"
                            name="cvv"
                            value={paymentInfo.cvv}
                            onChange={handlePaymentChange}
                            placeholder="123"
                            maxLength="4"
                            required
                            disabled={isProcessing}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn__text w-100"
                        disabled={isProcessing || totalPrice <= 0}
                    >
                        {isProcessing ? (
                            <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            {' Procesando...'}
                            </>
                        ) : (
                            `Confirmar Pago y Crear Orden - ${formatCurrency(totalPrice || 0)}`
                        )}
                    </button>
                </form>
              )}
            </div>
          </div>

          {/* Columna de Resumen del Pedido */}
          <div className="col-12 col-lg-5">
            <div className="p-4 rounded-4 shadow-sm bg-light h-100">
              <h2 className="h5 mb-3">Resumen de la Orden</h2>
              
              {/* 💡 Muestra la dirección seleccionada si es el Paso 2 */}
              {(step === 2 || orderSuccess) && (selectedAddressId || addresses.length === 0) && (
                <div className="mb-4 p-3 border rounded-3 bg-white">
                    <p className="fw-semibold mb-1 text-primary small">
                        Enviando a:
                    </p>
                    {selectedAddressId > 0 ? (
                        <>
                            <p className="mb-0 small">{addresses.find(a => a.id === selectedAddressId)?.street} {addresses.find(a => a.id === selectedAddressId)?.number}</p>
                            <p className="mb-0 small text-muted">{addresses.find(a => a.id === selectedAddressId)?.commune}</p>
                        </>
                    ) : (
                        <p className="mb-0 small text-muted">Nueva dirección (se simulará la creación).</p>
                    )}
                </div>
              )}
              
              <ul className="list-group mb-4">
                {items.map(item => (
                  <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="text-truncate" style={{ maxWidth: '70%' }}>
                        {item.product?.name || "Producto"} (x{item.quantity})
                    </span>
                    <span className="fw-semibold">
                      {formatCurrency((item.product?.price || 0) * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                <span className="fw-bold">
                  Total Final ({totalItems} {totalItems === 1 ? "artículo" : "artículos"})
                </span>
                <span className="fw-bold text-primary display-6">
                  {formatCurrency(totalPrice || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
}