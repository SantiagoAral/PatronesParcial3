import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  async function register() {
  try {
    const res = await axios.post("http://localhost:5000/auth/register", {
      username: user,
      password: pass,
    });

    console.log("Respuesta backend:", res.data);

    alert("Usuario registrado correctamente");
    nav("/login");
  } catch (err) {
    alert("Error al registrarse");
    console.error(err);
  }
}


  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-6 rounded w-96 text-white">
        <h1 className="text-xl mb-4">Registrarse</h1>

        <input
          placeholder="Usuario"
          className="w-full p-2 mb-3 rounded bg-gray-700"
          onChange={(e) => setUser(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full p-2 mb-3 rounded bg-gray-700"
          onChange={(e) => setPass(e.target.value)}
        />

        <button
          onClick={register}
          className="w-full bg-green-500 p-2 rounded"
        >
          Crear Cuenta
        </button>
      </div>
    </div>
  );
}
