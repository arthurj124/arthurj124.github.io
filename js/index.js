// ======== index.js ========

// Interface
function showLogin() {
  document.getElementById("mainButtons").style.display = "none";
  document.getElementById("loginForm").classList.add("visible");
  document.getElementById("registerForm").classList.remove("visible");
}

function showRegister() {
  document.getElementById("mainButtons").style.display = "none";
  document.getElementById("registerForm").classList.add("visible");
  document.getElementById("loginForm").classList.remove("visible");
}

function showMain() {
  document.getElementById("mainButtons").style.display = "block";
  document.getElementById("loginForm").classList.remove("visible");
  document.getElementById("registerForm").classList.remove("visible");
}

// ======== LOGIN ========
async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("Preencha todos os campos!");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert("Erro ao fazer login: Credenciais inválidas!!") // + error.message);
    return;
  }

  // Login bem-sucedido
  window.location.href = "menu.html";
}

// ======== CADASTRO ========
async function register() {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();

  if (!firstName || !lastName || !email || !password) {
    alert("Preencha todos os campos para se cadastrar!");
    return;
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    alert("Erro ao cadastrar: " + error.message);
    return;
  }

  if (data.user) {
    const { error: insertError } = await supabase.from("usuarios").insert([
      {
        id: data.user.id,
        nome: firstName,
        sobrenome: lastName,
        email: email,
      },
    ]);

    if (insertError) {
      console.error("Erro ao salvar dados adicionais:", insertError);
      alert("Conta criada, mas houve um problema ao salvar seus dados.");
    } else {
      alert("Conta criada com sucesso! Faça login para continuar.");
      showLogin();
    }
  }
}

// ======== CHECAGEM DE SESSÃO ========
window.addEventListener("load", async () => {
  const user = await getCurrentUser();
  if (user) {
    window.location.href = "menu.html";
  }
});
