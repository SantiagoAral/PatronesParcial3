import { useNavigate } from "react-router-dom";

export default function AuthChoice() {
  const nav = useNavigate();

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-6 rounded w-96 text-white text-center">
        <h1 className="text-2xl mb-6 font-bold">Bienvenido</h1>

        <p className="mb-6 text-gray-300">
          Elige una opción para continuar
        </p>

        <button
          onClick={() => nav("/login")}
          className="w-full bg-blue-500 p-2 rounded mb-4"
        >
          Iniciar Sesión
        </button>

        <button
          onClick={() => nav("/register")}
          className="w-full bg-green-500 p-2 rounded"
        >
          Registrarse
        </button>
      </div>
    </div>
  );
}
