const api = "http://127.0.0.1:5000";

// Função para mostrar feedback com pop-up
function mostrarFeedback(mensagem, tipo = "success") {
    // Pop-up alert
    if (tipo === "error") {
        alert("❌ " + mensagem);
    } else {
        alert("✅ " + mensagem);
    }
    
    // Também mostrar no elemento (opcional)
    const feedback = document.getElementById("feedback");
    feedback.innerText = mensagem;
    feedback.className = tipo;
    setTimeout(() => {
        feedback.innerText = "";
        feedback.className = "";
    }, 5000);
}

// Cadastro de aluno
document.getElementById("formAluno").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const data = document.getElementById("data").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!nome || !data || !email || !senha) {
        mostrarFeedback("Por favor, preencha todos os campos!", "error");
        return;
    }

    try {
        const dados = {
            nome: nome,
            data_nascimento: data,
            email: email,
            senha: senha
        };

        const res = await fetch(api + "/cadastrar_aluno", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(dados)
        });

        const resultado = await res.json();
        
        if (!res.ok) {
            mostrarFeedback(resultado.erro || "Erro ao cadastrar aluno", "error");
            return;
        }
        
        mostrarFeedback(resultado.mensagem, "success");
        document.getElementById("formAluno").reset();
        carregarTurmas();

    } catch (erro) {
        console.error("Erro:", erro);
        mostrarFeedback("Erro ao conectar ao servidor. Verifique se está rodando em http://127.0.0.1:5000", "error");
    }
});


// Criar turma
document.getElementById("formTurma").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nomeTurma = document.getElementById("nomeTurma").value.trim();
    const maxAlunos = parseInt(document.getElementById("maxAlunos").value);

    if (!nomeTurma || !maxAlunos || maxAlunos < 1) {
        mostrarFeedback("Preencha os campos corretamente!", "error");
        return;
    }

    try {
        const dados = {
            nome: nomeTurma,
            max_alunos: maxAlunos
        };

        const res = await fetch(api + "/criar_turma", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(dados)
        });

        const resultado = await res.json();
        
        if (!res.ok) {
            mostrarFeedback(resultado.erro || "Erro ao criar turma", "error");
            return;
        }

        mostrarFeedback(resultado.mensagem, "success");
        document.getElementById("formTurma").reset();
        carregarTurmas();

    } catch (erro) {
        console.error("Erro:", erro);
        mostrarFeedback("Erro ao conectar ao servidor. Verifique se está rodando em http://127.0.0.1:5000", "error");
    }
});


async function enviarRequisicao(method, path, body = null) {
    const options = { method, headers: {"Content-Type": "application/json"} };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(api + path, options);
    const data = await res.json();
    return { res, data };
}


async function editarTurma(turmaId) {
    const novoNome = prompt("Nome da turma:", "");
    if (novoNome === null) return;
    const novaVaga = prompt("Máximo de alunos:", "");
    if (novaVaga === null) return;
    const maxAlunos = parseInt(novaVaga);
    if (!novoNome.trim() || isNaN(maxAlunos) || maxAlunos < 1) {
        mostrarFeedback("Nome e máximo válidos são obrigatórios.", "error");
        return;
    }

    try {
        const { res, data } = await enviarRequisicao("PUT", `/atualizar_turma/${turmaId}`, { nome: novoNome.trim(), max_alunos: maxAlunos });
        if (!res.ok) {
            mostrarFeedback(data.erro || "Erro ao atualizar turma.", "error");
            return;
        }
        mostrarFeedback(data.mensagem, "success");
        carregarTurmas();
    } catch (erro) {
        console.error("Erro ao atualizar turma:", erro);
        mostrarFeedback("Erro ao atualizar turma.", "error");
    }
}


async function excluirTurma(turmaId) {
    if (!confirm("Tem certeza que deseja excluir esta turma?")) return;
    try {
        const { res, data } = await enviarRequisicao("DELETE", `/deletar_turma/${turmaId}`);
        if (!res.ok) {
            mostrarFeedback(data.erro || "Erro ao excluir turma.", "error");
            return;
        }
        mostrarFeedback(data.mensagem, "success");
        carregarTurmas();
    } catch (erro) {
        console.error("Erro ao excluir turma:", erro);
        mostrarFeedback("Erro ao excluir turma.", "error");
    }
}


async function editarAluno(turmaId, alunoId) {
    const nome = prompt("Nome do aluno:", "");
    if (nome === null) return;
    const dataNascimento = prompt("Data de nascimento (YYYY-MM-DD):", "");
    if (dataNascimento === null) return;
    const email = prompt("Email do aluno:", "");
    if (email === null) return;
    const senha = prompt("Senha do aluno:", "");
    if (senha === null) return;

    if (!nome.trim() || !dataNascimento.trim() || !email.trim() || !senha.trim()) {
        mostrarFeedback("Todos os dados do aluno são obrigatórios.", "error");
        return;
    }

    try {
        const { res, data } = await enviarRequisicao("PUT", `/atualizar_aluno/${turmaId}/${alunoId}`, {
            nome: nome.trim(),
            data_nascimento: dataNascimento.trim(),
            email: email.trim(),
            senha: senha.trim()
        });
        if (!res.ok) {
            mostrarFeedback(data.erro || "Erro ao atualizar aluno.", "error");
            return;
        }
        mostrarFeedback(data.mensagem, "success");
        carregarTurmas();
    } catch (erro) {
        console.error("Erro ao atualizar aluno:", erro);
        mostrarFeedback("Erro ao atualizar aluno.", "error");
    }
}


async function removerAluno(turmaId, alunoId) {
    if (!confirm("Tem certeza que deseja remover este aluno da turma?")) return;
    try {
        const { res, data } = await enviarRequisicao("DELETE", `/remover_aluno/${turmaId}/${alunoId}`);
        if (!res.ok) {
            mostrarFeedback(data.erro || "Erro ao remover aluno.", "error");
            return;
        }
        mostrarFeedback(data.mensagem, "success");
        carregarTurmas();
    } catch (erro) {
        console.error("Erro ao remover aluno:", erro);
        mostrarFeedback("Erro ao remover aluno.", "error");
    }
}


// Listar turmas
async function carregarTurmas() {
    try {
        const res = await fetch(api + "/turmas");
        
        if (!res.ok) {
            throw new Error("Erro ao carregar turmas");
        }

        const turmas = await res.json();
        const div = document.getElementById("listaTurmas");
        div.innerHTML = "";

        if (turmas.length === 0) {
            div.innerHTML = "<p style='text-align: center; color: #7f8c8d; padding: 20px;'>Nenhuma turma criada ainda.</p>";
            return;
        }

        turmas.forEach(turma => {
            let html = `
                <div class="turma-card">
                    <div class="turma-header">
                        <h3>${turma.nome}</h3>
                        <div class="turma-actions">
                            <button class="btn-small" onclick="editarTurma(${turma.id})">Editar turma</button>
                            <button class="btn-small btn-danger" onclick="excluirTurma(${turma.id})">Excluir turma</button>
                        </div>
                    </div>
                    <p><strong>Vagas:</strong> ${turma.alunos.length}/${turma.max_alunos}</p>
                    <div style="margin-top: 15px;">
                        <strong>Alunos inscritos:</strong>
                        <ul style="margin: 10px 0 0 20px;">
            `;

            if (turma.alunos.length === 0) {
                html += `<li style="color: #7f8c8d;">Nenhum aluno inscrito</li>`;
            } else {
                turma.alunos.forEach(aluno => {
                    html += `<li>${aluno.nome} <span class="aluno-actions"><button class="btn-small" onclick="editarAluno(${turma.id}, ${aluno.id})">Editar</button><button class="btn-small btn-danger" onclick="removerAluno(${turma.id}, ${aluno.id})">Remover</button></span></li>`;
                });
            }

            html += `
                        </ul>
                    </div>
                </div>
            `;

            div.innerHTML += html;
        });

    } catch (erro) {
        console.error("Erro ao carregar turmas:", erro);
        const div = document.getElementById("listaTurmas");
        div.innerHTML = "<p style='color: #dc3545; padding: 20px;'>⚠️ Não foi possível carregar as turmas. Certifique-se de que o servidor está rodando em http://127.0.0.1:5000</p>";
    }
}

// Carrega turmas ao abrir a página
carregarTurmas();