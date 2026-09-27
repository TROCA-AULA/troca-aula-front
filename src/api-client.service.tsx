import axios from 'axios';
import { toast } from 'react-toastify';

// Cliente axios para uso em componentes/hooks/services CLIENT-SIDE
// ('use client'). Aponta para o proxy Next.js (/api/proxy/*, ver
// src/app/api/proxy/[...path]/route.ts), que roda no servidor e anexa o
// Authorization a partir do cookie httpOnly de sessão.
//
// Por que não usar src/api.service.tsx (que aponta direto pro backend)
// aqui: aquele instance tenta ler o token via document.cookie, mas o
// cookie é httpOnly — o navegador nunca expõe esse valor ao JS, então
// qualquer chamada direta ao backend feita a partir do navegador NUNCA
// teria o header Authorization anexado (bug real: login funcionava,
// toda chamada seguinte dava 401). O relative baseURL '/api/proxy' já
// é same-origin, então o navegador manda o cookie automaticamente — não
// precisa de interceptor de request aqui, só o proxy do lado do servidor
// precisa lê-lo.
const apiClient = axios.create({ baseURL: '/api/proxy' });

apiClient.interceptors.response.use(
  (success) => success,
  (error) => {
    const message = error?.response?.data?.message;
    if (Array.isArray(message)) {
      toast.error(message.join('\n'));
    } else if (typeof message === 'string') {
      toast.error(message);
    } else {
      toast.error('Erro inesperado na requisicao');
    }
    throw error;
  },
);

export default apiClient;
