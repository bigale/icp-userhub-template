"""Forward WSL localhost ports to Docker container for Playwright/browser access."""
import socket, threading, sys

CONTAINER_IP = "172.17.0.2"
PORTS = [5173, 4943]  # Vite + dfx replica

def forward(src, dst):
    try:
        while True:
            data = src.recv(4096)
            if not data:
                break
            dst.sendall(data)
    except:
        pass
    finally:
        src.close()
        dst.close()

def serve(local_port, remote_port):
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("0.0.0.0", local_port))
    srv.listen(5)
    print(f"  localhost:{local_port} -> {CONTAINER_IP}:{remote_port}")
    while True:
        client, _ = srv.accept()
        try:
            remote = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            remote.connect((CONTAINER_IP, remote_port))
            threading.Thread(target=forward, args=(client, remote), daemon=True).start()
            threading.Thread(target=forward, args=(remote, client), daemon=True).start()
        except:
            client.close()

print("Port forwarding active:")
for p in PORTS:
    threading.Thread(target=serve, args=(p, p), daemon=True).start()

try:
    threading.Event().wait()
except KeyboardInterrupt:
    print("\nStopped.")
