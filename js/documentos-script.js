// js/documentos-script.js

document.addEventListener("DOMContentLoaded", () => {
  // ======== ESTADO ========
  let usuarioId = null;
  let documentos = [];
  let consultas = [];
  let medicamentos = [];
  let arquivoSelecionado = null; // 1 arquivo por documento

  // ======== DOM ========
  const lista = document.getElementById("listaDocumentos");
  const modal = document.getElementById("modal");
  const addBtn = document.getElementById("addBtn");
  const cancelarBtn = document.getElementById("cancelarBtn");
  const salvarBtn = document.getElementById("salvarBtn");

  const inputNome = document.getElementById("nomeDocumento");
  const selectConsulta = document.getElementById("consultaRelacionada");
  const selectMedicamento = document.getElementById("medicamentoRelacionado");
  const inputArquivo = document.getElementById("arquivoDocumento");
  const previewContainer = document.getElementById("previewContainer");

  // ======== LOGIN (USANDO main.js / checkSession) ========
  async function verificarLogin() {
    try {
      const user = await checkSession();
      if (!user) {
        window.location.href = "index.html";
        return false;
      }
      usuarioId = user.id;
      return true;
    } catch (err) {
      console.error("Erro ao verificar sessão:", err);
      window.location.href = "index.html";
      return false;
    }
  }

  // ======== CARREGAR CONSULTAS / MEDICAMENTOS ========
  async function carregarConsultas() {
    try {
      const { data, error } = await supabase
        .from("consultas")
        .select("id, nome, data")
        .eq("usuario_id", usuarioId)
        .order("data", { ascending: true });

      if (error) throw error;

      consultas = data || [];
      selectConsulta.innerHTML = `<option value="">— Nenhuma —</option>`;
      consultas.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.nome}${c.data ? " - " + c.data : ""}`;
        selectConsulta.appendChild(opt);
      });
    } catch (err) {
      console.error("Erro ao carregar consultas:", err);
    }
  }

  async function carregarMedicamentos() {
    try {
      const { data, error } = await supabase
        .from("medicamentos")
        .select("id, nome")
        .eq("usuario_id", usuarioId)
        .order("nome", { ascending: true });

      if (error) throw error;

      medicamentos = data || [];
      selectMedicamento.innerHTML = `<option value="">— Nenhum —</option>`;
      medicamentos.forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.nome;
        selectMedicamento.appendChild(opt);
      });
    } catch (err) {
      console.error("Erro ao carregar medicamentos:", err);
    }
  }

  // ======== CARREGAR DOCUMENTOS ========
  async function carregarDocumentos() {
    try {
      const { data, error } = await supabase
        .from("documentos")
        .select(
          "id, nome, consulta_id, medicamento_id, criado_em, midias_documento(id, url, tipo)"
        )
        .eq("usuario_id", usuarioId)
        .order("criado_em", { ascending: false });

      if (error) throw error;

      documentos = (data || []).map((d) => ({
        id: d.id,
        nome: d.nome,
        consultaId: d.consulta_id,
        medicamentoId: d.medicamento_id,
        midias: d.midias_documento || [],
      }));

      renderizarLista();
    } catch (err) {
      console.error("Erro ao carregar documentos:", err);
      lista.innerHTML = "<p>Erro ao carregar lista.</p>";
    }
  }

  // ======== LISTA ========
  function renderizarLista() {
    lista.innerHTML = "";

    if (!documentos || documentos.length === 0) {
      lista.innerHTML = "<p>Nenhum documento cadastrado.</p>";
      return;
    }

    documentos.forEach((d) => {
      const item = document.createElement("div");
      item.classList.add("item");

      const consultaNome = (
        consultas.find((c) => c.id === d.consultaId) || {
          nome: "—",
        }
      ).nome;

      const medicamentoNome = (
        medicamentos.find((m) => m.id === d.medicamentoId) || { nome: "—" }
      ).nome;

      const midiasCount = d.midias ? d.midias.length : 0;

      item.innerHTML = `
        <strong>${escapeHtml(d.nome)}</strong>
        <div class="info-linha">Consulta: ${escapeHtml(consultaNome)}</div>
        <div class="info-linha">Medicamento: ${escapeHtml(
          medicamentoNome
        )}</div>
        <div class="info-linha">Arquivos: ${midiasCount}</div>
        <div class="acoes">
          <button class="btn view" data-id="${
            d.id
          }"><i class="fas fa-eye"></i></button>
          <button class="btn delete" data-id="${
            d.id
          }"><i class="fas fa-trash"></i></button>
        </div>
      `;
      lista.appendChild(item);
    });

    // eventos
    lista.querySelectorAll(".acoes .view").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        visualizar(Number(e.currentTarget.dataset.id))
      );
    });

    lista.querySelectorAll(".acoes .delete").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        remover(Number(e.currentTarget.dataset.id))
      );
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
  }

  function limparCampos() {
    inputNome.value = "";
    selectConsulta.value = "";
    selectMedicamento.value = "";
    inputArquivo.value = "";
    previewContainer.innerHTML = "";
    arquivoSelecionado = null;
  }

  // ======== PREVIEW ARQUIVO ========
  function atualizarPreview() {
    previewContainer.innerHTML = "";
    if (!arquivoSelecionado) return;

    const file = arquivoSelecionado;
    const div = document.createElement("div");
    div.classList.add("preview-item");

    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      div.appendChild(img);
    } else {
      const span = document.createElement("span");
      span.textContent = `📎 ${file.name}`;
      div.appendChild(span);
    }

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.innerText = "x";
    removeBtn.onclick = () => {
      arquivoSelecionado = null;
      atualizarPreview();
    };
    div.appendChild(removeBtn);

    previewContainer.appendChild(div);
  }

  inputArquivo.addEventListener("change", (e) => {
    const file = e.target.files[0];
    arquivoSelecionado = file || null;
    atualizarPreview();
  });

  // ======== AUX: LER ARQUIVO COMO DATA URL ========
  function lerArquivoComoDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); // data URL
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  // ======== SALVAR ========
  async function salvarDocumento() {
    try {
      const nome = inputNome.value.trim();
      if (!nome) {
        alert("O nome do documento é obrigatório!");
        return;
      }

      if (!arquivoSelecionado) {
        alert("Selecione um arquivo para o documento!");
        return;
      }

      const consultaId = selectConsulta.value
        ? Number(selectConsulta.value)
        : null;
      const medicamentoId = selectMedicamento.value
        ? Number(selectMedicamento.value)
        : null;

      // 1) cria documento
      const { data: docData, error: docError } = await supabase
        .from("documentos")
        .insert([
          {
            nome,
            usuario_id: usuarioId,
            consulta_id: consultaId,
            medicamento_id: medicamentoId,
          },
        ])
        .select("id")
        .single();

      if (docError) throw docError;
      const docId = docData.id;

      // 2) converte arquivo em base64 e salva em midias_documento
      const dataUrl = await lerArquivoComoDataUrl(arquivoSelecionado);
      const tipo = arquivoSelecionado.type.startsWith("image/")
        ? "image"
        : "pdf"; // pdf/doc/docx tratados como "pdf"

      const { error: midiaError } = await supabase
        .from("midias_documento")
        .insert([
          {
            documento_id: docId,
            url: dataUrl,
            tipo,
          },
        ]);

      if (midiaError) {
        console.error("Erro ao salvar mídia:", midiaError);
      }

      await carregarDocumentos();
      fecharModal();
    } catch (err) {
      console.error("Erro ao salvar documento:", err);
      alert("Erro ao salvar documento. Veja o console.");
    }
  }

  // ======== VISUALIZAR / REMOVER ========
  async function visualizar(id) {
    const d = documentos.find((x) => x.id === id);
    if (!d) {
      alert("Documento não encontrado.");
      return;
    }

    const consultaNome = (
      consultas.find((c) => c.id === d.consultaId) || {
        nome: "—",
      }
    ).nome;

    const medicamentoNome = (
      medicamentos.find((m) => m.id === d.medicamentoId) || { nome: "—" }
    ).nome;

    const midia = d.midias[0];

    let conteudo;
    if (!midia) {
      conteudo = "<p>Sem arquivo associado.</p>";
    } else if (midia.tipo === "image") {
      conteudo = `<img src="${midia.url}" style="max-width:100%;height:auto;" />`;
    } else {
      conteudo = `<iframe src="${midia.url}" style="width:100%;height:80vh;border:none;"></iframe>`;
    }

    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(`
      <h2>${escapeHtml(d.nome)}</h2>
      <p><strong>Consulta:</strong> ${escapeHtml(consultaNome)}</p>
      <p><strong>Medicamento:</strong> ${escapeHtml(medicamentoNome)}</p>
      <hr />
      ${conteudo}
    `);
  }

  async function remover(id) {
    if (!confirm("Remover este documento e seu arquivo?")) return;
    try {
      const { error: errMid } = await supabase
        .from("midias_documento")
        .delete()
        .eq("documento_id", id);
      if (errMid) throw errMid;

      const { error: errDoc } = await supabase
        .from("documentos")
        .delete()
        .eq("id", id);
      if (errDoc) throw errDoc;

      await carregarDocumentos();
    } catch (err) {
      console.error("Erro ao remover documento:", err);
      alert("Erro ao remover (veja console).");
    }
  }

  // ======== ESCAPE HTML ========
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ======== EVENTOS ========
  addBtn.addEventListener("click", () => abrirModal("Novo Documento"));
  cancelarBtn.addEventListener("click", fecharModal);
  salvarBtn.addEventListener("click", salvarDocumento);

  // ======== INICIALIZAÇÃO ========
  (async function init() {
    const ok = await verificarLogin();
    if (!ok) return;

    await carregarConsultas();
    await carregarMedicamentos();
    await carregarDocumentos();

    console.log("Documentos: inicializado para usuário", usuarioId);
  })();
});
