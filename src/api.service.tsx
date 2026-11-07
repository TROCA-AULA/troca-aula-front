import axios from "axios";

// Uso EXCLUSIVAMENTE server-side (Route Handlers: login, classes, o proxy
// genérico em src/app/api/proxy/[...path]/route.ts). Componentes/hooks/
// services client-side devem usar src/api-client.service.tsx.
//
// Por isso o interceptor de request não tenta anexar Authorization a partir
// de cookie (document.cookie não existe no servidor, e o cookie de sessão é
// httpOnly de qualquer forma — cada Route Handler que usa este arquivo já
// lê o cookie via next/headers e monta o header Authorization manualmente).
//
// E por isso o interceptor de response NÃO chama toast: react-toastify
// depende do DOM do navegador, e chamar toast.error() aqui lançava um
// TypeError ("toast.error is not a function") que MASCARAVA o erro real
// (ex.: um 401 do backend virava um 500/502 genérico na resposta, porque o
// TypeError substituía o AxiosError original antes de o `throw` acontecer).
const api = axios.create({baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'})

api.interceptors.response.use((success) => {
    return success;
}, (error) => {
    console.error('[api.service] erro na chamada ao backend:', error?.response?.status, error?.response?.data);
    throw error;
})

export default api;
