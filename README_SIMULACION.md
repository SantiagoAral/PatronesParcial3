# 🎯 Guía de Simulación de Carga

Este documento explica cómo usar el script `simulate.py` para probar y medir el rendimiento del sistema de chat.

## 📋 Pre-requisitos

1. **Python 3.8 o superior** instalado
2. **Docker y Docker Compose** ejecutándose
3. **Servicios del sistema** corriendo:
   - Base de datos PostgreSQL
   - RabbitMQ
   - API Gateway (puerto 5000)
   - WebSocket Server (puerto 4000)

## 🚀 Instalación

### Paso 1: Instalar dependencias Python

```bash
pip install -r requirements.txt
```

O manualmente:
```bash
pip install aiohttp websockets
```

### Paso 2: Iniciar los servicios

```bash
# Detener servicios previos (si existen)
docker-compose down

# Eliminar volumen de DB para reiniciar (OPCIONAL, borra datos)
docker volume rm patronesparcial3_postgres_data

# Iniciar todos los servicios
docker-compose up -d

# Esperar a que los servicios estén listos (unos 10-15 segundos)
```

### Paso 3: Verificar que los servicios estén corriendo

```bash
# Ver logs del API Gateway
docker-compose logs api

# Ver logs del WebSocket Server
docker-compose logs websocket

# Verificar que la DB está lista
docker-compose logs db
```

## 🎬 Escenarios de Prueba

### Escenario 1: Usuarios Básicos (Default)

Simula un flujo completo con pocos usuarios:
- Registra usuarios
- Los loguea
- Crea una sala
- Se unen a la sala
- Conectan por WebSocket
- Envían mensajes
- Mide latencias de cada operación

**Ejecución:**
```bash
python simulate.py --scenario 1 --users 5
```

**Qué esperar:**
- ✅ Usuarios registrados
- ✅ Login exitoso
- ✅ Sala creada
- ✅ WebSockets conectados
- ✅ Mensajes enviados y recibidos
- 📊 Reporte de latencias al final

### Escenario 2: Prueba de Carga

Simula alta carga con múltiples usuarios enviando muchos mensajes simultáneamente:

**Ejecución:**
```bash
python simulate.py --scenario 2 --users 10 --messages 50
```

**Parámetros:**
- `--users`: Número de usuarios concurrentes (default: 10)
- `--messages`: Mensajes por usuario (default: 50)

**Ejemplo con más carga:**
```bash
# 20 usuarios enviando 100 mensajes cada uno = 2000 mensajes totales
python simulate.py --scenario 2 --users 20 --messages 100
```

## 📊 Interpretación de Resultados

El script genera un reporte con las siguientes métricas:

```
📊 REPORTE DE LATENCIAS
======================================================================

🔐 Registro de usuarios:
  Total operaciones: 5
  Mín:  45.23 ms
  Máx:  120.45 ms
  Media: 78.34 ms
  Mediana: 75.12 ms
  Desv. Est: 25.67 ms

🔑 Login:
  Total operaciones: 5
  Mín:  23.45 ms
  Máx:  67.89 ms
  Media: 41.23 ms
  ...

💬 Envío de mensajes:
  Total operaciones: 15
  Mín:  5.12 ms
  Máx:  45.67 ms
  Media: 15.34 ms
  ...
```

### ¿Qué significa cada métrica?

- **Total operaciones**: Número de veces que se ejecutó esa operación
- **Mín**: Tiempo más rápido observado
- **Máx**: Tiempo más lento observado
- **Media**: Promedio de todos los tiempos
- **Mediana**: Valor central (50% más rápido, 50% más lento)
- **Desv. Est**: Qué tan dispersos están los tiempos (menor = más consistente)

### Valores buenos vs malos

| Operación | Bueno | Aceptable | Malo |
|-----------|-------|-----------|------|
| Registro | < 100ms | 100-300ms | > 300ms |
| Login | < 50ms | 50-150ms | > 150ms |
| Crear sala | < 100ms | 100-200ms | > 200ms |
| Join sala | < 50ms | 50-100ms | > 100ms |
| WebSocket conn | < 100ms | 100-300ms | > 300ms |
| Envío mensaje | < 20ms | 20-50ms | > 50ms |
| Recepción | < 50ms | 50-150ms | > 150ms |

## 🛠️ Resolución de Problemas

### Error: "Connection refused"
```
❌ Error login user_0: Cannot connect to host localhost:5000
```

**Solución:**
- Verifica que los servicios estén corriendo: `docker-compose ps`
- Revisa los logs: `docker-compose logs api`
- Reinicia los servicios: `docker-compose restart`

### Error: "relation users does not exist"
```
❌ Error registrando user_0: Internal Server Error
```

**Solución:**
- La base de datos no está inicializada
- Ejecuta los comandos del README principal para recrear la DB:
  ```bash
  docker-compose down
  docker volume rm patronesparcial3_postgres_data
  docker-compose up -d
  ```

### Los mensajes no se reciben

**Posibles causas:**
1. RabbitMQ no está corriendo
2. Problema de red entre contenedores
3. WebSocket no se suscribió correctamente a la sala

**Verificación:**
```bash
# Ver logs de RabbitMQ
docker-compose logs rabbit

# Ver logs del WebSocket Server
docker-compose logs websocket -f
```

## 🧪 Casos de Uso Sugeridos

### 1. Validación Funcional (5 usuarios)
```bash
python simulate.py --scenario 1 --users 5
```
✅ Verifica que todo funciona correctamente

### 2. Prueba Moderada (20 usuarios, 30 mensajes)
```bash
python simulate.py --scenario 2 --users 20 --messages 30
```
✅ 600 mensajes totales - prueba realista

### 3. Prueba de Estrés (50 usuarios, 100 mensajes)
```bash
python simulate.py --scenario 2 --users 50 --messages 100
```
⚠️ 5000 mensajes - puede revelar cuellos de botella

### 4. Prueba Extrema (100 usuarios, 50 mensajes)
```bash
python simulate.py --scenario 2 --users 100 --messages 50
```
🔥 5000 mensajes con máxima concurrencia

## 📈 Monitoreo en Tiempo Real

Mientras ejecutas el script, puedes monitorear en tiempo real:

**Terminal 1: Logs del API Gateway**
```bash
docker-compose logs -f api
```

**Terminal 2: Logs del WebSocket Server**
```bash
docker-compose logs -f websocket
```

**Terminal 3: Ejecutar simulación**
```bash
python simulate.py --scenario 2 --users 10 --messages 50
```

## 🎓 Para tu Presentación

### Demostración sugerida:

1. **Mostrar arquitectura** (diagrama hexagonal)
2. **Ejecutar Escenario 1** (explicar capas mientras corre)
   ```bash
   python simulate.py --scenario 1 --users 5
   ```
3. **Mostrar logs** en paralelo para evidenciar la separación de capas
4. **Ejecutar Escenario 2** para mostrar escalabilidad
   ```bash
   python simulate.py --scenario 2 --users 20 --messages 50
   ```
5. **Analizar métricas** del reporte generado

### Puntos clave a destacar:

- ✅ **Separación de capas**: Domain, Application, Infrastructure, Interfaces
- ✅ **Inversión de dependencias**: Infrastructure depende de Domain
- ✅ **Testabilidad**: Las capas pueden probarse independientemente
- ✅ **Escalabilidad**: El sistema maneja múltiples usuarios concurrentes
- ✅ **Mantenibilidad**: Fácil cambiar un adaptador sin afectar la lógica de negocio

## 📚 Referencias

- Clean Architecture: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- Hexagonal Architecture: https://alistair.cockburn.us/hexagonal-architecture/
