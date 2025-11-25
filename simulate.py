#!/usr/bin/env python3
"""
Script de simulación de carga para el sistema de chat
Mide latencias de operaciones y simula múltiples usuarios concurrentes
"""

import asyncio
import aiohttp
import websockets
import time
import json
import statistics
from datetime import datetime
from typing import List, Dict
import argparse

# Configuración
API_URL = "http://localhost:5000"
WS_URL = "ws://localhost:4000/ws"

class LatencyMetrics:
    """Clase para almacenar y calcular métricas de latencia"""
    def __init__(self):
        self.register_times: List[float] = []
        self.login_times: List[float] = []
        self.create_room_times: List[float] = []
        self.join_room_times: List[float] = []
        self.ws_connection_times: List[float] = []
        self.message_send_times: List[float] = []
        self.message_receive_times: List[float] = []
    
    def add_metric(self, metric_type: str, duration: float):
        """Agrega una medición de latencia"""
        if metric_type == "register":
            self.register_times.append(duration)
        elif metric_type == "login":
            self.login_times.append(duration)
        elif metric_type == "create_room":
            self.create_room_times.append(duration)
        elif metric_type == "join_room":
            self.join_room_times.append(duration)
        elif metric_type == "ws_connection":
            self.ws_connection_times.append(duration)
        elif metric_type == "message_send":
            self.message_send_times.append(duration)
        elif metric_type == "message_receive":
            self.message_receive_times.append(duration)
    
    def print_report(self):
        """Imprime un reporte detallado de métricas"""
        print("\n" + "="*70)
        print("📊 REPORTE DE LATENCIAS")
        print("="*70)
        
        metrics = {
            "🔐 Registro de usuarios": self.register_times,
            "🔑 Login": self.login_times,
            "🏠 Creación de salas": self.create_room_times,
            "🚪 Join a sala": self.join_room_times,
            "🔌 Conexión WebSocket": self.ws_connection_times,
            "📤 Envío de mensajes": self.message_send_times,
            "📥 Recepción de mensajes": self.message_receive_times,
        }
        
        for name, times in metrics.items():
            if times:
                print(f"\n{name}:")
                print(f"  Total operaciones: {len(times)}")
                print(f"  Mín:  {min(times)*1000:.2f} ms")
                print(f"  Máx:  {max(times)*1000:.2f} ms")
                print(f"  Media: {statistics.mean(times)*1000:.2f} ms")
                print(f"  Mediana: {statistics.median(times)*1000:.2f} ms")
                if len(times) > 1:
                    print(f"  Desv. Est: {statistics.stdev(times)*1000:.2f} ms")
        
        print("\n" + "="*70)

class ChatUser:
    """Simula un usuario del sistema de chat"""
    def __init__(self, user_id: int, metrics: LatencyMetrics):
        self.user_id = user_id
        self.username = f"user_{user_id}"
        self.password = "password123"
        self.token = None
        self.ws = None
        self.metrics = metrics
        self.messages_received = []
        self.session = None
    
    async def register(self):
        """Registra el usuario"""
        start = time.time()
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{API_URL}/auth/register",
                    json={"username": self.username, "password": self.password}
                ) as resp:
                    duration = time.time() - start
                    self.metrics.add_metric("register", duration)
                    if resp.status == 200:
                        print(f"✅ Usuario {self.username} registrado ({duration*1000:.0f}ms)")
                        return True
                    else:
                        text = await resp.text()
                        print(f"⚠️  Usuario {self.username} ya existe o error: {text}")
                        return True  # Continuar de todas formas
            except Exception as e:
                print(f"❌ Error registrando {self.username}: {e}")
                return False
    
    async def login(self):
        """Inicia sesión y obtiene el token JWT"""
        start = time.time()
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{API_URL}/auth/login",
                    json={"username": self.username, "password": self.password}
                ) as resp:
                    duration = time.time() - start
                    self.metrics.add_metric("login", duration)
                    if resp.status == 200:
                        data = await resp.json()
                        self.token = data["token"]
                        print(f"✅ Usuario {self.username} logueado ({duration*1000:.0f}ms)")
                        return True
                    else:
                        print(f"❌ Error login {self.username}: {resp.status}")
                        return False
            except Exception as e:
                print(f"❌ Error login {self.username}: {e}")
                return False
    
    async def create_room(self, room_name: str):
        """Crea una sala de chat"""
        start = time.time()
        async with aiohttp.ClientSession() as session:
            headers = {"Authorization": f"Bearer {self.token}"}
            try:
                async with session.post(
                    f"{API_URL}/rooms/create",
                    json={"name": room_name, "is_private": False},
                    headers=headers
                ) as resp:
                    duration = time.time() - start
                    self.metrics.add_metric("create_room", duration)
                    if resp.status == 200:
                        data = await resp.json()
                        print(f"✅ Sala '{room_name}' creada ({duration*1000:.0f}ms)")
                        return data["id"]
                    else:
                        print(f"❌ Error creando sala: {resp.status}")
                        return None
            except Exception as e:
                print(f"❌ Error creando sala: {e}")
                return None
    
    async def join_room(self, room_id: int):
        """Une el usuario a una sala"""
        start = time.time()
        async with aiohttp.ClientSession() as session:
            headers = {"Authorization": f"Bearer {self.token}"}
            try:
                async with session.post(
                    f"{API_URL}/rooms/{room_id}/join",
                    json={},
                    headers=headers
                ) as resp:
                    duration = time.time() - start
                    self.metrics.add_metric("join_room", duration)
                    if resp.status == 200:
                        print(f"✅ Usuario {self.username} unido a sala {room_id} ({duration*1000:.0f}ms)")
                        return True
                    else:
                        print(f"❌ Error uniendo a sala: {resp.status}")
                        return False
            except Exception as e:
                print(f"❌ Error uniendo a sala: {e}")
                return False
    
    async def connect_websocket(self, room_id: int):
        """Conecta por WebSocket"""
        start = time.time()
        try:
            self.ws = await websockets.connect(f"{WS_URL}?token={self.token}")
            duration = time.time() - start
            self.metrics.add_metric("ws_connection", duration)
            print(f"✅ WebSocket conectado para {self.username} ({duration*1000:.0f}ms)")
            
            # Suscribirse a la sala
            await self.ws.send(json.dumps({"type": "SUBSCRIBE", "roomId": room_id}))
            
            # Esperar mensaje de bienvenida
            asyncio.create_task(self._listen_messages())
            return True
        except Exception as e:
            print(f"❌ Error conectando WebSocket {self.username}: {e}")
            return False
    
    async def _listen_messages(self):
        """Escucha mensajes del WebSocket"""
        try:
            async for message in self.ws:
                receive_time = time.time()
                data = json.loads(message)
                
                if data.get("type") == "MESSAGE":
                    # Calcular latencia de recepción
                    send_time = data.get("send_timestamp")
                    if send_time:
                        latency = receive_time - send_time
                        self.metrics.add_metric("message_receive", latency)
                    
                    self.messages_received.append(data)
                    print(f"📨 {self.username} recibió: {data.get('content', '')[:30]}...")
        except websockets.exceptions.ConnectionClosed:
            print(f"🔌 WebSocket cerrado para {self.username}")
        except Exception as e:
            print(f"❌ Error escuchando mensajes {self.username}: {e}")
    
    async def send_message(self, room_id: int, content: str):
        """Envía un mensaje por WebSocket"""
        start = time.time()
        try:
            message = {
                "type": "MESSAGE",
                "roomId": room_id,
                "content": content,
                "send_timestamp": start
            }
            await self.ws.send(json.dumps(message))
            duration = time.time() - start
            self.metrics.add_metric("message_send", duration)
            print(f"📤 {self.username} envió: {content[:30]}...")
            return True
        except Exception as e:
            print(f"❌ Error enviando mensaje {self.username}: {e}")
            return False
    
    async def disconnect(self):
        """Desconecta el WebSocket"""
        if self.ws:
            await self.ws.close()

async def simulate_scenario_1(num_users: int = 5):
    """
    Escenario 1: Usuarios básicos
    - Registra usuarios
    - Los loguea
    - Crea una sala
    - Envía algunos mensajes
    """
    print("\n🎬 ESCENARIO 1: Usuarios Básicos")
    print(f"Simulando {num_users} usuarios...")
    
    metrics = LatencyMetrics()
    users: List[ChatUser] = []
    
    # Crear usuarios
    for i in range(num_users):
        users.append(ChatUser(i, metrics))
    
    # Registrar todos
    print("\n📝 Registrando usuarios...")
    register_tasks = [user.register() for user in users]
    await asyncio.gather(*register_tasks)
    
    # Login todos
    print("\n🔑 Logueando usuarios...")
    login_tasks = [user.login() for user in users]
    results = await asyncio.gather(*login_tasks)
    
    if not all(results):
        print("❌ Algunos usuarios no pudieron loguearse")
        return metrics
    
    # Primer usuario crea sala
    print("\n🏠 Creando sala...")
    room_id = await users[0].create_room("Sala de Prueba")
    
    if not room_id:
        print("❌ No se pudo crear la sala")
        return metrics
    
    # Todos se unen a la sala
    print("\n🚪 Uniendo usuarios a la sala...")
    join_tasks = [user.join_room(room_id) for user in users]
    await asyncio.gather(*join_tasks)
    
    # Conectar WebSockets
    print("\n🔌 Conectando WebSockets...")
    ws_tasks = [user.connect_websocket(room_id) for user in users]
    await asyncio.gather(*ws_tasks)
    
    # Esperar un momento para que se establezcan las conexiones
    await asyncio.sleep(2)
    
    # Enviar mensajes
    print("\n💬 Enviando mensajes...")
    for i in range(3):
        for user in users:
            await user.send_message(room_id, f"Mensaje {i+1} de {user.username}")
            await asyncio.sleep(0.1)  # Pequeña pausa entre mensajes
    
    # Esperar a que se reciban los mensajes
    await asyncio.sleep(3)
    
    # Desconectar
    print("\n🔌 Desconectando usuarios...")
    for user in users:
        await user.disconnect()
    
    return metrics

async def simulate_scenario_2(num_users: int = 10, num_messages: int = 50):
    """
    Escenario 2: Carga de mensajes
    - Múltiples usuarios enviando mensajes simultáneamente
    """
    print(f"\n🎬 ESCENARIO 2: Carga de Mensajes")
    print(f"Simulando {num_users} usuarios enviando {num_messages} mensajes cada uno...")
    
    metrics = LatencyMetrics()
    users: List[ChatUser] = []
    
    # Crear y preparar usuarios
    for i in range(num_users):
        user = ChatUser(i, metrics)
        await user.register()
        await user.login()
        users.append(user)
    
    # Crear sala
    room_id = await users[0].create_room("Sala de Carga")
    
    # Todos se unen
    join_tasks = [user.join_room(room_id) for user in users]
    await asyncio.gather(*join_tasks)
    
    # Conectar WebSockets
    ws_tasks = [user.connect_websocket(room_id) for user in users]
    await asyncio.gather(*ws_tasks)
    
    await asyncio.sleep(2)
    
    # Enviar mensajes en paralelo
    print("\n💬 Enviando mensajes en paralelo...")
    
    async def send_user_messages(user):
        for i in range(num_messages):
            await user.send_message(room_id, f"Mensaje {i} de {user.username}")
            await asyncio.sleep(0.05)  # Pequeña pausa
    
    send_tasks = [send_user_messages(user) for user in users]
    await asyncio.gather(*send_tasks)
    
    # Esperar recepción
    await asyncio.sleep(5)
    
    # Desconectar
    for user in users:
        await user.disconnect()
    
    return metrics

async def main():
    parser = argparse.ArgumentParser(description="Simulador de carga para sistema de chat")
    parser.add_argument("--scenario", type=int, default=1, choices=[1, 2], 
                       help="Escenario a ejecutar (1: básico, 2: carga)")
    parser.add_argument("--users", type=int, default=5, 
                       help="Número de usuarios a simular")
    parser.add_argument("--messages", type=int, default=50,
                       help="Número de mensajes por usuario (escenario 2)")
    
    args = parser.parse_args()
    
    print("="*70)
    print("🚀 SIMULADOR DE CARGA - SISTEMA DE CHAT")
    print("="*70)
    print(f"API Gateway: {API_URL}")
    print(f"WebSocket: {WS_URL}")
    print("="*70)
    
    try:
        if args.scenario == 1:
            metrics = await simulate_scenario_1(args.users)
        else:
            metrics = await simulate_scenario_2(args.users, args.messages)
        
        metrics.print_report()
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Simulación interrumpida por el usuario")
    except Exception as e:
        print(f"\n\n❌ Error durante la simulación: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
