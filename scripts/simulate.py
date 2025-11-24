import asyncio
import websockets
import json, time

async def client(token, id):
    uri = f"ws://localhost:4000/ws?token={token}"
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({"type":"SUBSCRIBE","roomId":"1"}))
        for i in range(10):
            start = time.time()
            await ws.send(json.dumps({"type":"MESSAGE","roomId":"1","content":f"msg {id}-{i}"}))
            try:
                _ = await asyncio.wait_for(ws.recv(), timeout=2)
            except Exception:
                pass
            print('sent', id, i, 'latency', (time.time()-start)*1000)
            await asyncio.sleep(0.2)

async def main():
    token = 'REPLACE_WITH_VALID_TOKEN'
    clients = [client(token, i) for i in range(5)]
    await asyncio.gather(*clients)

if __name__ == '__main__':
    asyncio.run(main())
