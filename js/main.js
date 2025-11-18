// ======== main.js ========
// Controle global de sessão e inicialização do Supabase

// Configuração única do Supabase
const SUPABASE_URL = "https://zpajujvdvqtszugpzxhd.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwYWp1anZkdnF0c3p1Z3B6eGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjUyMDksImV4cCI6MjA3Njg0MTIwOX0.FzbCySUT5OXCnYJiOXLHRkGqvzj-K6bk9KSvKkpcGRk";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ======== Funções Globais ========

// ✅ Obtém o usuário atual
async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Erro ao obter usuário:", error);
    return null;
  }
  return data.user;
}

// ✅ Verifica sessão e redireciona se não estiver logado
async function checkSession(redirectIfNotLogged = true) {
  const user = await getCurrentUser();
  if (!user && redirectIfNotLogged) {
    alert("Você precisa estar logado!");
    window.location.href = "index.html";
    return null;
  }
  return user;
}

// ✅ Mantém sessão ativa mesmo recarregando a página
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    window.location.href = "index.html";
  }
});

// ✅ Logout global
async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

// ======== Uso ========
// Nas páginas internas (menu, consultas, etc.):
// const user = await checkSession();   ← verifica login
// logout();                            ← encerra login
// const user = await getCurrentUser(); ← apenas lê usuário
function voltarPagina() {
  if (history.length > 1) {
    history.back();
  } else {
    window.location.href = "menu.html"; // fallback, caso não tenha histórico
  }
}
