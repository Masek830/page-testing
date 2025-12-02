import { motion } from "framer-motion";

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

export default function PaymentPage() {
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
        <h1 className="mb-4">Método de Pago y Confirmación</h1>
        <p className="text-muted">
          Este es el primer paso del proceso de Checkout.
          Aquí se seleccionará o agregará la información de pago.
        </p>

        <div className="p-4 rounded-4 shadow-sm bg-white mt-4">
            <h2 className="h5">Resumen de tu Compra</h2>
            <p>Total del Carrito: (Aquí irá el total del Contexto)</p>
            <button className="btn btn-primary mt-3" disabled>
                Continuar con la Orden (Inactivo por ahora)
            </button>
        </div>
      </div>
    </motion.main>
  );
}