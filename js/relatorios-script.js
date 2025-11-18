// js/relatorios-script.js

document.addEventListener("DOMContentLoaded", () => {
  // ======== ESTADO ========
  let usuarioId = null;
  let todasConsultas = [];
  let todosMedicamentos = [];
  let todosDocumentos = [];
  let consultasMap = new Map();
  let medicamentosMap = new Map();

  // ======== DOM ========
  const inputDataInicio = document.getElementById("filtroDataInicio");
  const inputDataFim = document.getElementById("filtroDataFim");
  const chkConsultas = document.getElementById("filtroConsultas");
  const chkMedicamentos = document.getElementById("filtroMedicamentos");
  const chkDocumentos = document.getElementById("filtroDocumentos");
  const btnAplicar = document.getElementById("aplicarFiltrosBtn");

  const cardsResumoDiv = document.getElementById("cardsResumo");

  const secaoConsultas = document.getElementById("secaoConsultas");
  const secaoMedicamentos = document.getElementById("secaoMedicamentos");
  const secaoDocumentos = document.getElementById("secaoDocumentos");

  const tbodyConsultas = document.getElementById("tabelaConsultasBody");
  const tbodyMedicamentos = document.getElementById("tabelaMedicamentosBody");
  const tbodyDocumentos = document.getElementById("tabelaDocumentosBody");

  // ======== LOGIN (main.js) ========
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

  // ======== CARREGAR DADOS ========
  async function carregarConsultas() {
    const { data, error } = await supabase
      .from("consultas")
      .select("*")
      .eq("usuario_id", usuarioId)
      .order("data", { ascending: true });

    if (error) {
      console.error("Erro ao carregar consultas:", error);
      todasConsultas = [];
    } else {
      todasConsultas = data || [];
    }

    consultasMap = new Map(todasConsultas.map((c) => [c.id, c]));
  }

  async function carregarMedicamentos() {
    const { data, error } = await supabase
      .from("medicamentos")
      .select("*")
      .eq("usuario_id", usuarioId)
      .order("data_inicio", { ascending: true });

    if (error) {
      console.error("Erro ao carregar medicamentos:", error);
      todosMedicamentos = [];
    } else {
      todosMedicamentos = data || [];
    }

    medicamentosMap = new Map(todosMedicamentos.map((m) => [m.id, m]));
  }

  async function carregarDocumentos() {
    // AQUI SIMPLIFICAMOS: só a tabela documentos, sem join com midias_documento
    const { data, error } = await supabase
      .from("documentos")
      .select("id, nome, consulta_id, medicamento_id, criado_em")
      .eq("usuario_id", usuarioId)
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao carregar documentos:", error);
      todosDocumentos = [];
    } else {
      todosDocumentos = data || [];
    }
  }

  // ======== DATA UTILS ========
  function hojeISO() {
    return new Date().toISOString().split("T")[0]; // yyyy-mm-dd
  }

  function dataNDiasAtras(n) {
    const dt = new Date();
    dt.setDate(dt.getDate() - n);
    return dt.toISOString().split("T")[0];
  }

  function parseDataISO(str) {
    if (!str) return null;
    if (str.length <= 10) return new Date(str + "T00:00:00");
    return new Date(str);
  }

  function formatarDataBR(str) {
    if (!str) return "—";
    const dt = parseDataISO(str);
    if (!dt || isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("pt-BR");
  }

  function formatarHora(horaStr) {
    if (!horaStr) return "—";
    try {
      const [h, m] = horaStr.split(":");
      return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
    } catch (e) {
      return horaStr;
    }
  }

  // ======== FILTROS E RELATÓRIO ========
  function atualizarRelatorio() {
    const inicioStr = inputDataInicio.value;
    const fimStr = inputDataFim.value;

    const temIntervalo = inicioStr && fimStr;
    const dtInicio = temIntervalo ? parseDataISO(inicioStr) : null;
    const dtFim = temIntervalo ? parseDataISO(fimStr) : null;

    // --- Consultas ---
    let consultasFiltradas = [...todasConsultas];
    if (temIntervalo) {
      consultasFiltradas = consultasFiltradas.filter((c) => {
        const d = parseDataISO(c.data);
        return d && d >= dtInicio && d <= dtFim;
      });
    }

    // --- Medicamentos (intervalo sobreposto ao período) ---
    let medicamentosFiltrados = [...todosMedicamentos];
    if (temIntervalo) {
      medicamentosFiltrados = medicamentosFiltrados.filter((m) => {
        const di = m.data_inicio ? parseDataISO(m.data_inicio) : null;
        const df = m.data_fim ? parseDataISO(m.data_fim) : null;

        if (!di && !df) return true;

        const inicioMed = di || df;
        const fimMed = df || di;

        if (!inicioMed || !fimMed) return true;

        return inicioMed <= dtFim && fimMed >= dtInicio;
      });
    }

    // --- Documentos (usando criado_em, só parte da data) ---
    let documentosFiltrados = [...todosDocumentos];
    if (temIntervalo) {
      documentosFiltrados = documentosFiltrados.filter((d) => {
        if (!d.criado_em) return false;
        // criado_em vem como "2025-03-18T14:20:30.123Z" ou similar
        const dataCriacao = String(d.criado_em).split("T")[0]; // "YYYY-MM-DD"
        return dataCriacao >= inicioStr && dataCriacao <= fimStr;
      });
    }

    // --- Cards resumo ---
    renderizarCardsResumo(
      consultasFiltradas,
      medicamentosFiltrados,
      documentosFiltrados
    );

    // --- Mostrar / esconder seções ---
    secaoConsultas.style.display = chkConsultas.checked ? "block" : "none";
    secaoMedicamentos.style.display = chkMedicamentos.checked
      ? "block"
      : "none";
    secaoDocumentos.style.display = chkDocumentos.checked ? "block" : "none";

    // --- Tabelas ---
    if (chkConsultas.checked) {
      renderizarTabelaConsultas(consultasFiltradas);
    } else {
      tbodyConsultas.innerHTML = "";
    }

    if (chkMedicamentos.checked) {
      renderizarTabelaMedicamentos(medicamentosFiltrados);
    } else {
      tbodyMedicamentos.innerHTML = "";
    }

    if (chkDocumentos.checked) {
      renderizarTabelaDocumentos(documentosFiltrados);
    } else {
      tbodyDocumentos.innerHTML = "";
    }
  }

  function renderizarCardsResumo(cons, meds, docs) {
    const hoje = parseDataISO(hojeISO());

    const medsEmUsoHoje = meds.filter((m) => {
      const di = m.data_inicio ? parseDataISO(m.data_inicio) : null;
      const df = m.data_fim ? parseDataISO(m.data_fim) : null;

      if (!di && !df) return false;

      if (di && !df && di <= hoje) return true;
      if (!di && df && df >= hoje) return true;
      if (di && df && di <= hoje && df >= hoje) return true;

      return false;
    }).length;

    cardsResumoDiv.innerHTML = `
      <div class="card-resumo">
        <span class="label">Consultas no período</span>
        <span class="valor">${cons.length}</span>
      </div>
      <div class="card-resumo">
        <span class="label">Medicamentos no período</span>
        <span class="valor">${meds.length}</span>
      </div>
      <div class="card-resumo">
        <span class="label">Documentos no período</span>
        <span class="valor">${docs.length}</span>
      </div>
      <div class="card-resumo">
        <span class="label">Medicamentos em uso hoje</span>
        <span class="valor">${medsEmUsoHoje}</span>
      </div>
    `;
  }

  function renderizarTabelaConsultas(consultas) {
    tbodyConsultas.innerHTML = "";

    if (consultas.length === 0) {
      tbodyConsultas.innerHTML =
        '<tr><td colspan="5">Nenhuma consulta no período.</td></tr>';
      return;
    }

    const hoje = parseDataISO(hojeISO());

    consultas.forEach((c) => {
      const tr = document.createElement("tr");

      const dt = parseDataISO(c.data);
      const classe =
        dt && dt < hoje
          ? "linha-passado"
          : dt && dt >= hoje
          ? "linha-futuro"
          : "";

      if (classe) tr.classList.add(classe);

      tr.innerHTML = `
        <td>${formatarDataBR(c.data)}</td>
        <td>${formatarHora(c.hora)}</td>
        <td>${escapeHtml(c.nome)}</td>
        <td>${escapeHtml(c.motivo || "—")}</td>
        <td>${escapeHtml(c.local || "—")}</td>
      `;
      tbodyConsultas.appendChild(tr);
    });
  }

  function renderizarTabelaMedicamentos(medicamentos) {
    tbodyMedicamentos.innerHTML = "";

    if (medicamentos.length === 0) {
      tbodyMedicamentos.innerHTML =
        '<tr><td colspan="6">Nenhum medicamento no período.</td></tr>';
      return;
    }

    const hoje = parseDataISO(hojeISO());

    medicamentos.forEach((m) => {
      const tr = document.createElement("tr");

      const consulta = m.consulta_id ? consultasMap.get(m.consulta_id) : null;
      const consultaNome = consulta ? consulta.nome : "—";

      const di = m.data_inicio ? parseDataISO(m.data_inicio) : null;
      const df = m.data_fim ? parseDataISO(m.data_fim) : null;

      let emUsoHoje = "Não";
      if (di || df) {
        if (di && !df && di <= hoje) emUsoHoje = "Sim";
        else if (!di && df && df >= hoje) emUsoHoje = "Sim";
        else if (di && df && di <= hoje && df >= hoje) emUsoHoje = "Sim";
      }

      tr.innerHTML = `
        <td>${escapeHtml(m.nome)}</td>
        <td>${escapeHtml(consultaNome)}</td>
        <td>${formatarDataBR(m.data_inicio)}</td>
        <td>${formatarDataBR(m.data_fim)}</td>
        <td>${escapeHtml(m.dosagem || "—")}</td>
        <td>${emUsoHoje}</td>
      `;
      tbodyMedicamentos.appendChild(tr);
    });
  }

  function renderizarTabelaDocumentos(documentos) {
    tbodyDocumentos.innerHTML = "";

    if (documentos.length === 0) {
      tbodyDocumentos.innerHTML =
        '<tr><td colspan="5">Nenhum documento no período.</td></tr>';
      return;
    }

    documentos.forEach((d) => {
      const tr = document.createElement("tr");

      const consulta = d.consulta_id ? consultasMap.get(d.consulta_id) : null;
      const medicamento = d.medicamento_id
        ? medicamentosMap.get(d.medicamento_id)
        : null;

      const consultaNome = consulta ? consulta.nome : "—";
      const medicamentoNome = medicamento ? medicamento.nome : "—";

      tr.innerHTML = `
        <td>${escapeHtml(d.nome)}</td>
        <td>${escapeHtml(consultaNome)}</td>
        <td>${escapeHtml(medicamentoNome)}</td>
        <td>${formatarDataBR(d.criado_em)}</td>
        <td>—</td>
      `;
      tbodyDocumentos.appendChild(tr);
    });
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
  btnAplicar.addEventListener("click", atualizarRelatorio);
  chkConsultas.addEventListener("change", atualizarRelatorio);
  chkMedicamentos.addEventListener("change", atualizarRelatorio);
  chkDocumentos.addEventListener("change", atualizarRelatorio);

  // ======== INICIALIZAÇÃO ========
  (async function init() {
    const ok = await verificarLogin();
    if (!ok) return;

    inputDataFim.value = hojeISO();
    inputDataInicio.value = dataNDiasAtras(30);

    await carregarConsultas();
    await carregarMedicamentos();
    await carregarDocumentos();

    atualizarRelatorio();

    console.log("Relatórios: inicializado para usuário", usuarioId);
  })();
});
