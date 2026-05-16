from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

turmas = []
fila_espera = []
next_turma_id = 1
next_aluno_id = 1


def buscar_turma(turma_id):
    return next((turma for turma in turmas if turma["id"] == turma_id), None)


def buscar_aluno(turma, aluno_id):
    return next((aluno for aluno in turma["alunos"] if aluno["id"] == aluno_id), None)


# Criar turma
@app.route('/criar_turma', methods=['POST'])
def criar_turma():
    global next_turma_id
    try:
        data = request.json
        
        if not data.get("nome") or not data.get("max_alunos"):
            return jsonify({"erro": "Nome e máximo de alunos são obrigatórios!"}), 400
        
        nova_turma = {
            "id": next_turma_id,
            "nome": data["nome"],
            "max_alunos": data["max_alunos"],
            "alunos": []
        }
        next_turma_id += 1

        # preencher com fila de espera
        while fila_espera and len(nova_turma["alunos"]) < nova_turma["max_alunos"]:
            nova_turma["alunos"].append(fila_espera.pop(0))

        turmas.append(nova_turma)

        return jsonify({
            "status": "ok",
            "mensagem": "Turma criada com sucesso!",
            "turma": nova_turma
        }), 201
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Atualizar turma
@app.route('/atualizar_turma/<int:turma_id>', methods=['PUT'])
def atualizar_turma(turma_id):
    try:
        turma = buscar_turma(turma_id)
        if not turma:
            return jsonify({"erro": "Turma não encontrada."}), 404

        data = request.json
        nome = data.get("nome")
        max_alunos = data.get("max_alunos")

        if nome:
            turma["nome"] = nome
        if max_alunos is not None:
            if max_alunos < len(turma["alunos"]):
                return jsonify({"erro": "O máximo de alunos não pode ser menor que a quantidade atual de alunos."}), 400
            turma["max_alunos"] = max_alunos

        return jsonify({"status": "ok", "mensagem": "Turma atualizada com sucesso!", "turma": turma}), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Excluir turma
@app.route('/deletar_turma/<int:turma_id>', methods=['DELETE'])
def deletar_turma(turma_id):
    try:
        global turmas
        turma = buscar_turma(turma_id)
        if not turma:
            return jsonify({"erro": "Turma não encontrada."}), 404

        turmas = [t for t in turmas if t["id"] != turma_id]
        return jsonify({"status": "ok", "mensagem": "Turma removida com sucesso!"}), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Cadastro de aluno
@app.route('/cadastrar_aluno', methods=['POST'])
def cadastrar_aluno():
    global next_aluno_id
    try:
        data = request.json
        
        if not all([data.get("nome"), data.get("data_nascimento"), data.get("email"), data.get("senha")]):
            return jsonify({"erro": "Todos os campos são obrigatórios!"}), 400

        aluno = {
            "id": next_aluno_id,
            "nome": data["nome"],
            "data_nascimento": data["data_nascimento"],
            "email": data["email"],
            "senha": data["senha"]
        }
        next_aluno_id += 1

        # tenta colocar em turma existente
        for turma in turmas:
            if len(turma["alunos"]) < turma["max_alunos"]:
                turma["alunos"].append(aluno)
                return jsonify({
                    "status": "ok",
                    "mensagem": f"Cadastro realizado! Você está na turma: {turma['nome']}",
                    "turma": turma
                }), 201

        # se não houver vaga → fila
        fila_espera.append(aluno)

        return jsonify({
            "status": "fila",
            "mensagem": "Cadastro realizado! A turma está completa. Você será adicionado automaticamente quando uma nova turma for criada.",
            "aluno": aluno
        }), 201
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Atualizar aluno
@app.route('/atualizar_aluno/<int:turma_id>/<int:aluno_id>', methods=['PUT'])
def atualizar_aluno(turma_id, aluno_id):
    try:
        turma = buscar_turma(turma_id)
        if not turma:
            return jsonify({"erro": "Turma não encontrada."}), 404

        aluno = buscar_aluno(turma, aluno_id)
        if not aluno:
            return jsonify({"erro": "Aluno não encontrado na turma."}), 404

        data = request.json
        aluno["nome"] = data.get("nome", aluno["nome"])
        aluno["data_nascimento"] = data.get("data_nascimento", aluno["data_nascimento"])
        aluno["email"] = data.get("email", aluno["email"])
        aluno["senha"] = data.get("senha", aluno["senha"])

        return jsonify({"status": "ok", "mensagem": "Aluno atualizado com sucesso!", "aluno": aluno}), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Remover aluno da turma
@app.route('/remover_aluno/<int:turma_id>/<int:aluno_id>', methods=['DELETE'])
def remover_aluno(turma_id, aluno_id):
    try:
        turma = buscar_turma(turma_id)
        if not turma:
            return jsonify({"erro": "Turma não encontrada."}), 404

        aluno = buscar_aluno(turma, aluno_id)
        if not aluno:
            return jsonify({"erro": "Aluno não encontrado na turma."}), 404

        turma["alunos"] = [a for a in turma["alunos"] if a["id"] != aluno_id]

        # preencher vaga com fila de espera
        if fila_espera and len(turma["alunos"]) < turma["max_alunos"]:
            turma["alunos"].append(fila_espera.pop(0))

        return jsonify({"status": "ok", "mensagem": "Aluno removido com sucesso!"}), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Listar turmas
@app.route('/turmas', methods=['GET'])
def listar_turmas():
    return jsonify(turmas)


if __name__ == '__main__':
    app.run(debug=True)