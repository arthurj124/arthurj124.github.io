// ======== MEDICAMENTOS-SCRIPT.JS ========

// Controle de usuário
let usuarioId = null;

// Dados em memória
let medicamentos = [];
let consultas = [];
let editandoId = null;
let modoVisualizacao = false;

// Referências de DOM (inicializadas no window.load)
let lista;
let modal;
let addBtn;
let cancelarBtn;
let salvarBtn;
let consultaSelect;
let imgInput;
let imgPreview;

// ======== AUTENTICAÇÃO ========
async function verificarLogin() {
  // checkSession vem do main.js (igual em consultas)
  const user = await checkSession();
  if (!user) return false;
  usuarioId = user.id;
  return true;
}

// ======== FUNÇÕES AUX ========
async function carregarConsultas() {
  const logado = await verificarLogin();
  if (!logado) {
    lista.innerHTML = "<p>Faça login para ver seus medicamentos.</p>";
    return;
  }

  const { data, error } = await supabase
    .from("consultas")
    .select("id, nome")
    .eq("usuario_id", usuarioId)
    .order("data", { ascending: true });

  if (!error && data) {
    consultas = data;
    consultaSelect.innerHTML = `<option value="">Selecione...</option>`;
    data.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.nome;
      consultaSelect.appendChild(opt);
    });
  }
}

async function carregarMedicamentos() {
  const logado = await verificarLogin();
  if (!logado) {
    lista.innerHTML = "<p>Faça login para ver seus medicamentos.</p>";
    return;
  }

  const { data, error } = await supabase
    .from("medicamentos")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("data_inicio", { ascending: true });

  if (error) {
    console.error("Erro ao carregar medicamentos:", error);
    lista.innerHTML = "<p>Erro ao carregar lista.</p>";
    return;
  }
  medicamentos = data || [];
  renderizarListaMedicamentos();
}

function renderizarListaMedicamentos() {
  lista.innerHTML = "";
  if (medicamentos.length === 0) {
    lista.innerHTML = "<p>Nenhum medicamento cadastrado.</p>";
    return;
  }

  medicamentos.forEach((m) => {
    const consultaNome =
      consultas.find((c) => c.id === m.consulta_id)?.nome || "—";

    const imagemHtml = m.imagem
      ? `<img src="${m.imagem}" alt="Imagem de ${m.nome}" class="thumb-medicamento" style="max-width:60px;max-height:60px;border-radius:6px;" />`
      : "—";

    const item = document.createElement("div");
    item.classList.add("item");
    item.innerHTML = `
      <strong>${m.nome}</strong>
      <div class="info-linha">Motivo: ${m.motivo || "—"}</div>
      <div class="info-linha">Consulta: ${consultaNome}</div>
      <div class="info-linha">Início: ${m.data_inicio || "—"}</div>
      <div class="info-linha">Fim: ${m.data_fim || "—"}</div>
      <div class="info-linha">Dosagem: ${m.dosagem || "—"}</div>
      <div class="info-linha">Observações: ${m.observacoes || "—"}</div>
      <div class="info-linha">Imagem: ${imagemHtml}</div>
      <div class="acoes">
        <button class="btn view" onclick="visualizarMedicamento(${
          m.id
        })"><i class="fas fa-eye"></i></button>
        <button class="btn edit" onclick="editarMedicamento(${
          m.id
        })"><i class="fas fa-pen"></i></button>
        <button class="btn delete" onclick="removerMedicamento(${
          m.id
        })"><i class="fas fa-trash"></i></button>
      </div>
    `;
    lista.appendChild(item);
  });
}

// ======== MODAL / MODO VISUALIZAÇÃO ========
function configurarModoVisualizacao(ativar) {
  modoVisualizacao = ativar;

  const campos = modal.querySelectorAll("input, select, textarea");

  campos.forEach((el) => {
    if (
      el.id !== "cancelarMedicamentoBtn" &&
      el.type !== "button" &&
      el.type !== "submit"
    ) {
      el.disabled = ativar;
    }
  });

  salvarBtn.style.display = ativar ? "none" : "inline-block";
  imgInput.disabled = ativar;
}

function abrirModalMedicamento(titulo) {
  document.getElementById("modalTitleMedicamento").innerText = titulo;
  modal.style.display = "flex";
}

function fecharModalMedicamento() {
  modal.style.display = "none";
  limparCamposMedicamento();
  editandoId = null;
  configurarModoVisualizacao(false);
}

function limparCamposMedicamento() {
  document.getElementById("nomeMedicamento").value = "";
  document.getElementById("motivoMedicamento").value = "";
  consultaSelect.value = "";
  document.getElementById("inicioMedicamento").value = "";
  document.getElementById("fimMedicamento").value = "";
  document.getElementById("dosagemMedicamento").value = "";
  document.getElementById("observacoesMedicamento").value = "";
  imgInput.value = "";
  imgPreview.src = "";
  imgPreview.style.display = "none";
}

function preencherCamposMedicamento(m) {
  document.getElementById("nomeMedicamento").value = m.nome || "";
  document.getElementById("motivoMedicamento").value = m.motivo || "";
  consultaSelect.value = m.consulta_id || "";
  document.getElementById("inicioMedicamento").value = m.data_inicio || "";
  document.getElementById("fimMedicamento").value = m.data_fim || "";
  document.getElementById("dosagemMedicamento").value = m.dosagem || "";
  document.getElementById("observacoesMedicamento").value = m.observacoes || "";

  if (m.imagem) {
    imgPreview.src = m.imagem;
    imgPreview.style.display = "block";
  } else {
    imgPreview.src = "";
    imgPreview.style.display = "none";
  }

  imgInput.value = "";
}

// ======== AUX: ler arquivo como base64 ========
function lerArquivoComoDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // data URL
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

// ======== CRUD ========
async function salvarMedicamento() {
  const nome = document.getElementById("nomeMedicamento").value.trim();
  const dataInicio = document.getElementById("inicioMedicamento").value;
  const dataFim = document.getElementById("fimMedicamento").value;

  if (!nome) {
    alert("O nome do medicamento é obrigatório!");
    return;
  }

  if (!usuarioId) {
    alert("Nenhum usuário logado. Faça login novamente.");
    return;
  }

  if (dataInicio && dataFim && dataFim < dataInicio) {
    alert("A data de fim não pode ser anterior à data de início!");
    return;
  }

  const dosagem = document.getElementById("dosagemMedicamento").value.trim();
  const observacoes = document
    .getElementById("observacoesMedicamento")
    .value.trim();

  let imagem = null;

  // se estiver editando, preserva imagem antiga caso nenhuma nova seja selecionada
  if (editandoId) {
    const existente = medicamentos.find((m) => m.id === editandoId);
    if (existente && existente.imagem) {
      imagem = existente.imagem;
    }
  }

  if (imgInput.files && imgInput.files[0]) {
    try {
      imagem = await lerArquivoComoDataUrl(imgInput.files[0]);
    } catch (e) {
      console.error("Erro ao ler imagem:", e);
      alert("Erro ao processar a imagem.");
      return;
    }
  }

  const medicamento = {
    usuario_id: usuarioId,
    nome,
    motivo: document.getElementById("motivoMedicamento").value.trim(),
    consulta_id: consultaSelect.value || null,
    data_inicio: dataInicio || null,
    data_fim: dataFim || null,
    dosagem: dosagem || null,
    observacoes: observacoes || null,
    imagem: imagem || null,
  };

  let error;
  if (editandoId) {
    ({ error } = await supabase
      .from("medicamentos")
      .update(medicamento)
      .eq("id", editandoId)
      .eq("usuario_id", usuarioId));
  } else {
    ({ error } = await supabase.from("medicamentos").insert([medicamento]));
  }

  if (error) {
    console.error("Erro ao salvar medicamento:", error);
    alert("Erro ao salvar medicamento.");
  } else {
    await carregarMedicamentos();
    fecharModalMedicamento();
  }
}

// VISUALIZAR: usa o mesmo modal, porém em modo somente leitura
function visualizarMedicamento(id) {
  const m = medicamentos.find((m) => m.id === id);
  if (!m) return;

  preencherCamposMedicamento(m);
  configurarModoVisualizacao(true);
  abrirModalMedicamento("Detalhes do Medicamento");
}

// EDITAR: usa campos preenchidos, mas em modo edição
function editarMedicamento(id) {
  const m = medicamentos.find((m) => m.id === id);
  if (!m) return;

  editandoId = id;
  preencherCamposMedicamento(m);
  configurarModoVisualizacao(false);
  abrirModalMedicamento("Editar Medicamento");
}

// ======== REMOVER (com mensagem específica para doc vinculado) ========
async function removerMedicamento(id) {
  if (!confirm("Remover este medicamento?")) return;

  const { error } = await supabase
    .from("medicamentos")
    .delete()
    .eq("id", id)
    .eq("usuario_id", usuarioId);

  if (error) {
    console.error("Erro ao remover medicamento:", error);

    // Código 23503 = violação de foreign key (registros dependentes em outra tabela)
    if (error.code === "23503") {
      alert(
        "Este medicamento não pode ser removido porque existe pelo menos um documento vinculado a ele.\n\n" +
        "Remova primeiro os documentos relacionados a este medicamento na tela de Documentos e tente novamente."
      );
    } else {
      alert("Erro ao remover medicamento.");
    }
  } else {
    await carregarMedicamentos();
  }
}

// ======== INICIALIZAÇÃO ========
window.addEventListener("load", async () => {
  lista = document.getElementById("listaMedicamentos");
  modal = document.getElementById("modalMedicamento");
  addBtn = document.getElementById("addMedicamentoBtn");
  cancelarBtn = document.getElementById("cancelarMedicamentoBtn");
  salvarBtn = document.getElementById("salvarMedicamentoBtn");
  consultaSelect = document.getElementById("consultaMedicamento");
  imgInput = document.getElementById("imagemMedicamento");
  imgPreview = document.getElementById("previewImagemMedicamento");

  // Preview local ao escolher imagem
  imgInput.addEventListener("change", () => {
    if (imgInput.files && imgInput.files[0]) {
      const url = URL.createObjectURL(imgInput.files[0]);
      imgPreview.src = url;
      imgPreview.style.display = "block";
    } else {
      imgPreview.src = "";
      imgPreview.style.display = "none";
    }
  });

  addBtn.addEventListener("click", () => {
    editandoId = null;
    limparCamposMedicamento();
    configurarModoVisualizacao(false);
    abrirModalMedicamento("Novo Medicamento");
  });

  cancelarBtn.addEventListener("click", fecharModalMedicamento);
  salvarBtn.addEventListener("click", salvarMedicamento);

  await carregarConsultas();
  await carregarMedicamentos();
});
