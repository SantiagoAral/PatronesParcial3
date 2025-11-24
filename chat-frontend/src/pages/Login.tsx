import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  async function login() {
  try {
    const res = await axios.post("http://localhost:5000/auth/login", {
      username: user,
      password: pass,
    });

    localStorage.setItem("token", res.data.token);
    nav("/rooms");
  } catch (err) {
    console.error("ERROR LOGIN:", err);
    alert("Usuario o contraseña incorrectos");
  }
}

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-6 rounded w-96 text-white">
        <h1 className="text-xl mb-4">Login</h1>

        <input placeholder="Usuario"
          className="w-full p-2 mb-3 rounded bg-gray-700"
          onChange={(e) => setUser(e.target.value)}
        />

        <input type="password" placeholder="Contraseña"
          className="w-full p-2 mb-3 rounded bg-gray-700"
          onChange={(e) => setPass(e.target.value)}
        />

        <button onClick={login}
          className="w-full bg-blue-500 p-2 rounded">Entrar</button>
      </div>
    </div>
  );
}
