// Tenta a porta preferida e as seguintes sem encerrar outros processos.
// Se todas estiverem ocupadas, o sistema operacional escolhe uma porta livre.
export async function listenAvailable(server, preferredPort = 3000) {
  if (!Number.isInteger(preferredPort) || preferredPort < 0 || preferredPort > 65535) {
    throw new Error('PORT deve ser um número inteiro entre 0 e 65535.');
  }
  const candidates = preferredPort === 0 ? [0] : [
    ...Array.from({ length: Math.min(10, 65536 - preferredPort) }, (_, index) => preferredPort + index),
    0,
  ];
  for (const port of candidates) {
    try {
      await new Promise((resolve, reject) => {
        const cleanup = () => {
          server.off('error', onError);
          server.off('listening', onListening);
        };
        const onError = error => { cleanup(); reject(error); };
        const onListening = () => { cleanup(); resolve(); };
        server.once('error', onError);
        server.once('listening', onListening);
        try { server.listen(port, '0.0.0',resolve); }
        catch (error) { cleanup(); reject(error); }
      });
      return server.address().port;
    } catch (error) {
      if (error.code !== 'EADDRINUSE' || port === 0) throw error;
    }
  }
}
