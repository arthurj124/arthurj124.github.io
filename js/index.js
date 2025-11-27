// ======== index.js ========
// Controle da tela inicial (login, cadastro e esqueci senha)

// Helpers para mostrar/esconder seções
function hideAllSections() {
  document.getElementById("mainButtons").style.display = "none";
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "none";
  document.getElementById("forgotPasswordForm").style.display = "none";
}

function showMain() {
  hideAllSections();
  document.getElementById("mainButtons").style.display = "block";
}

function showLogin() {
  hideAllSections();
  document.getElementById("loginForm").style.display = "block";

  // limpar mensagens do esqueci senha se tiver vindo de lá
  const successMsg = document.getElementById("forgotSuccessMsg");
  const errorMsg = document.getElementById("forgotErrorMsg");
  if (successMsg) successMsg.style.display = "none";
  if (errorMsg) errorMsg.style.display = "none";
}

function showRegister() {
  hideAllSections();
  document.getElementById("registerForm").style.display = "block";
}

function showForgotPassword() {
  hideAllSections();
  document.getElementById("forgotPasswordForm").style.display = "block";

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
  showMain();
});

// ======== Autenticação: Login ========
async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

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
    // ajuste o caminho se seu menu estiver em outro arquivo
    window.location.href = "menu.html";
  } catch (err) {
    console.error("Erro inesperado no login:", err);
    alert("Ocorreu um erro inesperado ao fazer login.");
  }
}

// ======== Autenticação: Cadastro ========
async function register() {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;

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
  const email = document.getElementById("forgotEmail").value.trim();
  const successMsg = document.getElementById("forgotSuccessMsg");
  const errorMsg = document.getElementById("forgotErrorMsg");

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
      // URL de redirecionamento após o usuário clicar no link do e-mail
      // Ajuste esse caminho conforme onde ficará sua página de redefinição de senha.
      redirectTo: `${window.location.origin}/reset-password.html`,
      // Exemplo:
      // - se você servir em http://localhost:5500/pages/index.html → redirectTo = http://localhost:5500/pages/reset-password.html
      // - se estiver em produção, ajuste para a URL do seu site.
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
