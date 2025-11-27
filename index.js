// ======== index.js ========
// Controle da tela inicial (login, cadastro e esqueci senha)

console.log("index.js carregado 👍");

// Helpers para mostrar/esconder seções
function hideAllSections() {
  const mainButtons = document.getElementById("mainButtons");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const forgotForm = document.getElementById("forgotPasswordForm");

  if (mainButtons) mainButtons.style.display = "none";
  if (loginForm) loginForm.style.display = "none";
  if (registerForm) registerForm.style.display = "none";
  if (forgotForm) forgotForm.style.display = "none";
}

function showMain() {
  hideAllSections();
  const mainButtons = document.getElementById("mainButtons");
  if (mainButtons) mainButtons.style.display = "block";
}

function showLogin() {
  hideAllSections();
  const loginForm = document.getElementById("loginForm");
  if (loginForm) loginForm.style.display = "block";

  // limpar mensagens do esqueci senha se tiver vindo de lá
  const successMsg = document.getElementById("forgotSuccessMsg");
  const errorMsg = document.getElementById("forgotErrorMsg");
  if (successMsg) successMsg.style.display = "none";
  if (errorMsg) errorMsg.style.display = "none";
}

function showRegister() {
  hideAllSections();
  const registerForm = document.getElementById("registerForm");
  if (registerForm) registerForm.style.display = "block";
}

function showForgotPassword() {
  hideAllSections();
  const forgotForm = document.getElementById("forgotPasswordForm");
  if (forgotForm) forgotForm.style.display = "block";

  // limpar campos e mensagens
  const forgotEmail = document.getElementById("forgotEmail");
  const successMsg = document.getElementById("forgotSuccessMsg");
  const errorMsg = document.getElementById("forgotErrorMsg");

  if (forgotEmail) forgotEmail.value = "";
  if (successMsg) {
    successMsg.textContent = "";
    successMsg.style.display = "none";
  }
  if (errorMsg) {
    errorMsg.textContent = "";
    errorMsg.style.display = "none";
  }
}

// Deixa a tela principal aparecendo ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded em index.html, hash:", window.location.hash);

  // Se veio de um link de recuperação do Supabase (reset de senha)
  if (
    window.location.hash.includes("type=recovery") ||
    window.location.hash.includes("access_token")
  ) {
    console.log(
      "Detectado link de recuperação, redirecionando para reset-password.html"
    );
    // Redireciona para a página de reset, preservando o token no hash
    window.location.href = "reset-password.html" + window.location.hash;
    return;
  }

  // Fluxo normal: tela de login/cadastro
  showMain();
});

// ======== Autenticação: Login ========
async function login() {
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");

  if (!emailInput || !passwordInput) {
    alert("Erro interno: campos de login não encontrados.");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert("Preencha email e senha.");
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Erro no login:", error);
      alert("Erro ao fazer login. Verifique seus dados.");
      return;
    }

    // Login ok → manda pra página principal do sistema
    window.location.href = "menu.html";
  } catch (err) {
    console.error("Erro inesperado no login:", err);
    alert("Ocorreu um erro inesperado ao fazer login.");
  }
}

// ======== Autenticação: Cadastro ========
async function register() {
  const firstNameInput = document.getElementById("firstName");
  const lastNameInput = document.getElementById("lastName");
  const emailInput = document.getElementById("registerEmail");
  const passwordInput = document.getElementById("registerPassword");

  if (!firstNameInput || !lastNameInput || !emailInput || !passwordInput) {
    alert("Erro interno: campos de cadastro não encontrados.");
    return;
  }

  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!firstName || !lastName || !email || !password) {
    alert("Preencha todos os campos para cadastrar.");
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      console.error("Erro no cadastro:", error);
      alert("Não foi possível cadastrar. Tente novamente.");
      return;
    }

    alert("Cadastro realizado! Verifique seu e-mail para confirmar a conta.");
    showLogin();
  } catch (err) {
    console.error("Erro inesperado no cadastro:", err);
    alert("Ocorreu um erro inesperado ao cadastrar.");
  }
}

// ======== Esqueci minha senha (reset via e-mail Supabase) ========
async function sendResetPasswordEmail() {
  const emailInput = document.getElementById("forgotEmail");
  const successMsg = document.getElementById("forgotSuccessMsg");
  const errorMsg = document.getElementById("forgotErrorMsg");

  if (!emailInput) {
    alert("Erro interno: campo de e-mail não encontrado.");
    return;
  }

  const email = emailInput.value.trim();

  if (!email) {
    if (errorMsg) {
      errorMsg.textContent = "Informe um e-mail.";
      errorMsg.style.display = "block";
    } else {
      alert("Informe um e-mail.");
    }
    return;
  }

  // Limpa mensagens anteriores
  if (successMsg) {
    successMsg.textContent = "";
    successMsg.style.display = "none";
  }
  if (errorMsg) {
    errorMsg.textContent = "";
    errorMsg.style.display = "none";
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // para dev: http://localhost:3000/reset-password.html
      // em produção: o origin será o domínio do site
      redirectTo: `${window.location.origin}/reset-password.html`,
    });

    if (error) {
      console.error("Erro ao enviar link de reset:", error);
      if (errorMsg) {
        errorMsg.textContent =
          "Não foi possível enviar o e-mail. Tente novamente em alguns minutos.";
        errorMsg.style.display = "block";
      } else {
        alert("Não foi possível enviar o e-mail. Tente novamente.");
      }
      return;
    }

    if (successMsg) {
      successMsg.textContent =
        "Se este e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.";
      successMsg.style.display = "block";
    } else {
      alert(
        "Se este e-mail estiver cadastrado, enviaremos um link para redefinir sua senha."
      );
    }
  } catch (err) {
    console.error("Erro inesperado ao enviar link de reset:", err);
    if (errorMsg) {
      errorMsg.textContent = "Ocorreu um erro inesperado. Tente novamente.";
      errorMsg.style.display = "block";
    } else {
      alert("Ocorreu um erro inesperado. Tente novamente.");
    }
  }
}

// ======== Expor funções no escopo global (para onclick="...") ========
window.showMain = showMain;
window.showLogin = showLogin;
window.showRegister = showRegister;
window.showForgotPassword = showForgotPassword;
window.login = login;
window.register = register;
window.sendResetPasswordEmail = sendResetPasswordEmail;
