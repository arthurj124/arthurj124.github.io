// ======== CONSULTAS-SCRIPT.JS ========

// ======== VARIÁVEIS ========
let usuarioId = null;
let consultas = [];

const lista = document.getElementById("listaConsultas");
const modal = document.getElementById("modal");
const addBtn = document.getElementById("addBtn");
const cancelarBtn = document.getElementById("cancelarBtn");
const salvarBtn = document.getElementById("salvarBtn");

let editandoId = null;

// ======== AUTENTICAÇÃO ========
async function verificarLogin() {
  const user = await checkSession();
  if (!user) return false;
  usuarioId = user.id;
  return true;
}

// ======== CONSULTAS ========
async function carregarConsultas() {
  const logado = await verificarLogin();
  if (!logado) return;

  const { data, error } = await supabase
    .from("consultas")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("data", { ascending: true });

  if (error) {
    console.error("Erro ao carregar consultas:", error);
    lista.innerHTML = "<p>Erro ao carregar lista.</p>";
    return;
  }

  consultas = data || [];
  renderizarLista();
}

function renderizarLista() {
  lista.innerHTML = "";

  if (consultas.length === 0) {
    lista.innerHTML = "<p>Nenhuma consulta cadastrada.</p>";
    return;
  }

  consultas.forEach((c) => {
    const horaFmt = c.hora
      ? new Date(`1970-01-01T${c.hora}`).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "—";

    const item = document.createElement("div");
    item.classList.add("item");

    item.innerHTML = `
      <strong>${c.nome}</strong>
      <div class="info-linha">Motivo: ${c.motivo || "—"}</div>
      <div class="info-linha">Data: ${c.data || "—"} às ${horaFmt}</div>
      <div class="info-linha">Local: ${c.local || "—"}</div>
      <div class="acoes">
        <button class="btn view" onclick="visualizar(${
          c.id
        })"><i class="fas fa-eye"></i></button>
        <button class="btn edit" onclick="editar(${
          c.id
        })"><i class="fas fa-pen"></i></button>
        <button class="btn delete" onclick="remover(${
          c.id
        })"><i class="fas fa-trash"></i></button>
      </div>
    `;
    lista.appendChild(item);
  });
}

// ======== MODAL ========
function abrirModal(titulo) {
  document.getElementById("modalTitle").innerText = titulo;
  modal.style.display = "flex";
}

function fecharModal() {
  modal.style.display = "none";
  limparCampos();
  editandoId = null;
}

function limparCampos() {
  document.getElementById("nome").value = "";
  document.getElementById("motivo").value = "";
  document.getElementById("data").value = "";
  document.getElementById("hora").value = "";
  document.getElementById("local").value = "";
}

// ======== CRUD ========
async function salvarConsulta() {
  const nome = document.getElementById("nome").value.trim();
  const dataConsulta = document.getElementById("data").value;
  const horaConsulta = document.getElementById("hora").value;

  if (!nome) {
    alert("O nome da consulta é obrigatório!");
    return;
  }

  // Validação de data não retroativa
  const hoje = new Date().toISOString().split("T")[0];
  if (dataConsulta && dataConsulta < hoje) {
    alert("A data da consulta não pode ser anterior ao dia atual!");
    return;
  }

  // Validação de hora
  if (!horaConsulta) {
    alert("Informe um horário válido para a consulta!");
    return;
  }

  const consulta = {
    usuario_id: usuarioId,
    nome,
    motivo: document.getElementById("motivo").value,
    data: dataConsulta,
    hora: horaConsulta,
    local: document.getElementById("local").value,
    // lembretes removidos
  };

  let error;
  if (editandoId) {
    ({ error } = await supabase
      .from("consultas")
      .update(consulta)
      .eq("id", editandoId));
  } else {
    ({ error } = await supabase.from("consultas").insert([consulta]));
  }

  if (error) {
    alert("Erro ao salvar consulta. Veja o console.");
    console.error(error);
  } else {
    await carregarConsultas();
    fecharModal();
  }
}

function visualizar(id) {
  const c = consultas.find((c) => c.id === id);

  const horaFmt = c.hora
    ? new Date(`1970-01-01T${c.hora}`).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";

  alert(`🩺 ${c.nome}
Motivo: ${c.motivo || "—"}
Data: ${c.data || "—"} às ${horaFmt}
Local: ${c.local || "—"}`);
}

function editar(id) {
  const c = consultas.find((c) => c.id === id);
  editandoId = id;

  document.getElementById("nome").value = c.nome;
  document.getElementById("motivo").value = c.motivo || "";
  document.getElementById("data").value = c.data || "";
  document.getElementById("hora").value = c.hora || "";
  document.getElementById("local").value = c.local || "";

  abrirModal("Editar Consulta");
}

async function remover(id) {
  if (confirm("Remover esta consulta?")) {
    const { error } = await supabase.from("consultas").delete().eq("id", id);
    if (error) {
      alert("Erro ao remover consulta.");
      console.error(error);
    } else {
      await carregarConsultas();
    }
  }
}

// ======== INICIALIZAÇÃO E EVENTOS ========
window.addEventListener("load", async () => {
  await carregarConsultas();

  // Impede datas retroativas
  const dataInput = document.getElementById("data");
  const hoje = new Date().toISOString().split("T")[0];
  dataInput.min = hoje;

  // Configura input de hora
  const horaInput = document.getElementById("hora");
  horaInput.type = "time";
  horaInput.step = 60; // precisão de 1 minuto

  // Eventos do modal
  addBtn.addEventListener("click", () => abrirModal("Nova Consulta"));
  cancelarBtn.addEventListener("click", fecharModal);
  salvarBtn.addEventListener("click", salvarConsulta);
});
